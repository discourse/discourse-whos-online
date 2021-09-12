import { withPluginApi } from "discourse/lib/plugin-api";
import discourseComputed from "discourse-common/utils/decorators";
import { inject as service } from "@ember/service";
import { observes } from "discourse-common/utils/decorators";

const PLUGIN_ID = "whos-online";

export default {
  name: "start-whos-online",

  initialize(container) {
    const onlineService = container.lookup("service:online-service");
    const siteSettings = container.lookup("site-settings:main");

    // If user not allowed, don't display
    if (!onlineService.get("shouldDisplay")) {
      return;
    }

    const indicatorType = siteSettings.whos_online_avatar_indicator;

    // If feature disabled, don't display
    if (indicatorType === "none") {
      return;
    }

    // Set the html class accordingly
    $("html").addClass(`whos-online-${indicatorType}`);

    withPluginApi("0.2", (api) => {
      api.modifyClass("component:user-card-contents", {
        pluginId: PLUGIN_ID,
        onlineService: service("online-service"),
        classNameBindings: ["isOnline:user-online"],

        @discourseComputed("user", "onlineService.users.@each")
        isOnline(user) {
          if (!user) {
            return false;
          }
          return this.onlineService.isUserOnline(user.id);
        },
      });

      // This is a bit hacky, since the user page doesn't currently
      // use components
      api.modifyClass("route:user", {
        pluginId: PLUGIN_ID,
        onlineService: service("online-service"),

        afterModel() {
          this.updateBodyClass();
          return this._super();
        },

        @observes("onlineService.users.@each")
        updateBodyClass() {
          const user_id = this.modelFor("user").id;
          const isOnline = this.get("onlineService").isUserOnline(user_id);

          if (isOnline) {
            Ember.$("body").addClass("user-page-online");
          } else {
            Ember.$("body").removeClass("user-page-online");
          }
        },

        deactivate() {
          this._super();
          Ember.$("body").removeClass("user-page-online");
        },
      });

      if (siteSettings.whos_online_avatar_indicator_topic_lists) {
        api.modifyClass("component:topic-list-item", {
          pluginId: PLUGIN_ID,
          onlineService: service("online-service"),
          classNameBindings: ["isOnline:last-poster-online"],

          @discourseComputed(
            "topic.lastPoster.id",
            "topic.lastPosterUser.id",
            "onlineService.users.@each"
          )
          isOnline(lastPosterId, lastPosterUserId) {
            return this.get("onlineService").isUserOnline(
              lastPosterId || lastPosterUserId
            );
          },
        });

        api.modifyClass("component:latest-topic-list-item", {
          pluginId: PLUGIN_ID,
          onlineService: service("online-service"),
          classNameBindings: ["isOnline:last-poster-online"],

          @discourseComputed(
            "topic.lastPoster.id",
            "topic.lastPosterUser.id",
            "onlineService.users.@each"
          )
          isOnline(lastPosterId, lastPosterUserId) {
            return this.get("onlineService").isUserOnline(
              lastPosterId || lastPosterUserId
            );
          },
        });
      }

      api.modifyClass("component:scrolling-post-stream", {
        pluginId: PLUGIN_ID,
        didInsertElement() {
          this._super();
          this.appEvents.on("whosonline:changed", (changedUserIds) => {
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
          });
        },
        willDestroyElement() {
          this.appEvents.off("whosonline:changed");
        },
      });
      api.reopenWidget("post-avatar", {
        buildKey: (attrs) => `post-${attrs.id}-avatar-${attrs.user_id}`,
        defaultState(attrs) {
          return { online: onlineService.isUserOnline(attrs.user_id) };
        },
        updateOnline() {
          this.state.online = onlineService.isUserOnline(this.attrs.user_id);
        },
        buildClasses(attrs, state) {
          if (state.online) {
            return "user-online";
          }
          return [];
        },
      });
    });
  },
};
