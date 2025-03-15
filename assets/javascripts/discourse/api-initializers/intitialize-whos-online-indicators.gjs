import bodyClass from "discourse/helpers/body-class";
import { apiInitializer } from "discourse/lib/api";

const PLUGIN_ID = "whos-online";

export default apiInitializer((api) => {
  const siteSettings = api.container.lookup("service:site-settings");
  const whosOnlineService = api.container.lookup("service:whos-online");

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

  const userOnline = (id) => whosOnlineService.isUserOnline(id);

  api.modifyClass(
    "component:user-card-contents",
    (Superclass) =>
      class extends Superclass {
        get classNames() {
          const extraClasses = [];
          if (this.user && userOnline(this.user.id)) {
            extraClasses.push("user-online");
          }
          return [...super.classNames, ...extraClasses];
        }
      }
  );

  api.renderInOutlet(
    "above-user-profile",
    <template>
      {{#if (userOnline @outletArgs.model.id)}}
        {{bodyClass "user-page-online"}}
      {{/if}}
    </template>
  );

  if (siteSettings.whos_online_avatar_indicator_topic_lists) {
    const addLastPosterOnlineClassNameTransformer = ({
      value: additionalClasses,
      context: { topic },
    }) => {
      if (topic) {
        const whosOnline = api.container.lookup("service:whos-online");
        const { lastPoster, lastPosterUser } = topic;

        if (whosOnline.isUserOnline(lastPoster?.id || lastPosterUser?.id)) {
          additionalClasses.push("last-poster-online");
        }
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
