import discourseComputed, { observes } from "discourse-common/utils/decorators";
import { inject as service } from "@ember/service";
import { apiInitializer } from "discourse/lib/api";

const PLUGIN_ID = "whos-online";

export default apiInitializer("0.8", (api) => {
  const siteSettings = api.container.lookup("site-settings:main");

  if (
    !(
      siteSettings.whos_online_display_public ||
      api.getCurrentUser()?.trust_level >=
        siteSettings.whos_online_display_min_trust_level
    )
  ) {
    return;
  }

  const indicatorType = siteSettings.whos_online_avatar_indicator;
  if (indicatorType === "none") {
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
    api.modifyClass("component:topic-list-item", {
      pluginId: PLUGIN_ID,
      whosOnline: service(),
      classNameBindings: ["isOnline:last-poster-online"],
      @discourseComputed(
        "topic.lastPoster.id",
        "topic.lastPosterUser.id",
        "whosOnline.users.[]"
      )
      isOnline(lastPosterId, lastPosterUserId) {
        return this.whosOnline.isUserOnline(lastPosterId || lastPosterUserId);
      },
    });

    api.modifyClass("component:latest-topic-list-item", {
      pluginId: PLUGIN_ID,
      whosOnline: service(),
      classNameBindings: ["isOnline:last-poster-online"],
      @discourseComputed(
        "topic.lastPoster.id",
        "topic.lastPosterUser.id",
        "whosOnline.users.[]"
      )
      isOnline(lastPosterId, lastPosterUserId) {
        return this.whosOnline.isUserOnline(lastPosterId || lastPosterUserId);
      },
    });
  }

  api.modifyClass("component:scrolling-post-stream", {
    pluginId: PLUGIN_ID,
    didInsertElement() {
      this._super();
      this._whosOnlineCallback = (changedUserIds) => {
        changedUserIds.forEach((id) => {
          let postIds = this.get("attrs")
            .posts.value.posts.filter(({ user_id }) => {
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
      };

      this.appEvents.on("whosonline:changed", this._whosOnlineCallback);
    },

    willDestroyElement() {
      this.appEvents.off("whosonline:changed", this._whosOnlineCallback);
    },
  });

  api.reopenWidget("post-avatar", {
    buildKey: (attrs) => `post-${attrs.id}-avatar-${attrs.user_id}`,
    isUserOnline(userId) {
      return this.container.lookup("service:whos-online").isUserOnline(userId);
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
