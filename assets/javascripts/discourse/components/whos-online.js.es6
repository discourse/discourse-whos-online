import Component from "@ember/component";
import { inject as service } from "@ember/service";
import { computed } from "@ember/object";

export default Component.extend({
  online: service("online-service"),

  @computed
  get showWhosOnline() {
    // If the number of users is less than the minimum, and it's set to hide, hide it
    if (
      this.online.users.length <
        this.siteSettings.whos_online_minimum_display &&
      this.siteSettings.whos_online_hide_below_minimum_display
    ) {
      return false;
    }

    return this.online.get("shouldDisplay");
  },

  @computed("online.users.@each")
  get users() {
    return this.online.users.slice(
      0,
      this.siteSettings.whos_online_maximum_display
    );
  },

  @computed("online.users.length")
  get isLong() {
    return (
      this.online.users.length >=
      this.siteSettings.whos_online_collapse_threshold
    );
  },

  @computed("online.users.length")
  get isUsers() {
    return (
      this.online.users.length >=
      this.siteSettings.whos_online_minimum_display
    );
  }
});
