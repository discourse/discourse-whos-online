import Component from "@ember/component";
import { inject as service } from "@ember/service";
import discourseComputed from "discourse-common/utils/decorators";

export default Component.extend({
  online: service("online-service"),

  @discourseComputed("online.users.length")
  showWhosOnline() {
    // If the number of users is less than the minimum, and it's set to hide, hide it
    if (
      this.online.users.length <
        this.siteSettings.whos_online_minimum_display &&
      this.siteSettings.whos_online_hide_below_minimum_display
    ) {
      return false;
    }

    return this.online.shouldDisplay;
  },

  @discourseComputed("online.users.@each")
  users() {
    return this.online.users.slice(
      0,
      this.siteSettings.whos_online_maximum_display
    );
  },

  @discourseComputed("online.users.length")
  isLong() {
    return (
      this.online.users.length >=
      this.siteSettings.whos_online_collapse_threshold
    );
  },

  @discourseComputed("online.users.length")
  isUsers() {
    return (
      this.online.users.length >= this.siteSettings.whos_online_minimum_display
    );
  },
});
