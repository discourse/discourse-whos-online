import { service } from "@ember/service";
import { apiInitializer } from "discourse/lib/api";
import discourseComputed, { observes } from "discourse/lib/decorators";

const PLUGIN_ID = "whos-online";

export default apiInitializer("1.39.0", (api) => {
  const siteSettings = api.container.lookup("service:site-settings");

  // pre-initialize the service so that it can start listening to the presence channel
  // and avoid triggering "... was previously used in the same computation" errors
  // while subscribing1
  api.container.lookup("service:whos-online");

  const indicatorType = siteSettings.whos_online_avatar_indicator;
  if (indicatorType === "none") {
    return;
  }

  if (
    !(
      siteSettings.whos_online_display_public ||
      api.getCurrentUser()?.trust_level >=
        siteSettings.whos_online_display_min_trust_level
    )
  ) {
    return;
  }

  document.documentElement.classList.add(`whos-online-${indicatorType}`);

  api.modifyClass("component:user-card-contents", {
    pluginId: PLUGIN_ID,

    whosOnline: service(),
    classNameBindings: ["isOnline:user-online"],

    @discourseComputed("user", "whosOnline.users.[]")
    isOnline(user) {
      return user && this.whosOnline.isUserOnline(user.id);
    },
  });

  api.modifyClass("route:user", {
    pluginId: PLUGIN_ID,

    whosOnline: service(),

    async afterModel(model) {
      const superVal = await this._super(...arguments);
      this.set("whosOnlineUserId", model.id);
      this.updateBodyClass();
      return superVal;
    },

    @discourseComputed("whosOnlineUserId", "whosOnline.users.[]")
    isOnline(userId) {
      return userId && this.whosOnline.isUserOnline(userId);
    },

    @observes("isOnline")
    updateBodyClass() {
      if (this.isOnline) {
        document.body.classList.add("user-page-online");
      } else {
        document.body.classList.remove("user-page-online");
      }
    },

    deactivate() {
      this._super();
      document.body.classList.remove("user-page-online");
    },
  });

  if (siteSettings.whos_online_avatar_indicator_topic_lists) {
    const addLastPosterOnlineClassNameTransformer = ({
      value: additionalClasses,
      context: { topic },
    }) => {
      const whosOnline = api.container.lookup("service:whos-online");
      const lastPosterId = topic.lastPoster.id;
      const lastPosterUserId = topic.lastPosterUser.id;

      if (whosOnline.isUserOnline(lastPosterId || lastPosterUserId)) {
        additionalClasses.push("last-poster-online");
      }

      return additionalClasses;
    };

    api.registerValueTransformer(
      "latest-topic-list-item-class",
      addLastPosterOnlineClassNameTransformer
    );
    api.registerValueTransformer(
      "topic-list-item-class",
      addLastPosterOnlineClassNameTransformer
    );
  }

  api.modifyClass("component:scrolling-post-stream", {
    pluginId: PLUGIN_ID,

    didInsertElement() {
      this._super();
      this.appEvents.on("whosonline:changed", this, this._whosOnlineCallback);
    },

    willDestroyElement() {
      this.appEvents.off("whosonline:changed", this, this._whosOnlineCallback);
    },

    _whosOnlineCallback(changedUserIds) {
      changedUserIds.forEach((id) => {
        let postIds = this.attrs.posts.value
          .filter(({ user_id }) => {
            return user_id === id;
          })
          .map((post) => post.id);
        postIds.forEach((postId) => {
          this.dirtyKeys.keyDirty(`post-${postId}`);
          this.dirtyKeys.keyDirty(`post-${postId}-avatar-${id}`, {
            onRefresh: "updateOnline",
          });
        });
      });
      this.queueRerender();
    },
  });

  api.reopenWidget("post-avatar", {
    buildKey: (attrs) => `post-${attrs.id}-avatar-${attrs.user_id}`,
    isUserOnline(userId) {
      return this.register.lookup("service:whos-online").isUserOnline(userId);
    },
    defaultState(attrs) {
      return {
        online: this.isUserOnline(attrs.user_id),
      };
    },
    updateOnline() {
      this.state.online = this.isUserOnline(this.attrs.user_id);
    },
    buildClasses(attrs, state) {
      if (state.online) {
        return "user-online";
      }
      return [];
    },
  });
});
