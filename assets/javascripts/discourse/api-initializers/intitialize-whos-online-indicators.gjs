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

  customizePost(api);
});

function customizePost(api) {
  api.registerValueTransformer(
    "post-avatar-class",
    ({ value, context: { post } }) => {
      const whosOnline = api.container.lookup("service:whos-online");

      if (whosOnline.isUserOnline(post.user_id)) {
        value.push("user-online");
      }

      return value;
    }
  );
}
