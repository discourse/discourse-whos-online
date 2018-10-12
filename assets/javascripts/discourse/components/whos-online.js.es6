import Ember from "ember";
var inject = Ember.inject;

export default Ember.Component.extend({
  showWhosOnline: function() {
    // If the number of users is less than the minimum, and it's set to hide, hide it
    if (
      this.get("online").users.length <
        this.siteSettings.whos_online_minimum_display &&
      this.siteSettings.whos_online_hide_below_minimum_display
    ) {
      return false;
    }

    return this.get("online").get("shouldDisplay");
  }.property(),
  online: inject.service("online-service"),
  users: function() {
    return this.get("online").users.slice(
      0,
      this.siteSettings.whos_online_maximum_display
    );
  }.property("online.users.@each"),
  isLong: function() {
    return (
      this.get("online").users.length >=
      this.siteSettings.whos_online_collapse_threshold
    );
  }.property("online.users.length"),
  isUsers: function() {
    return (
      this.get("online").users.length >=
      this.siteSettings.whos_online_minimum_display
    );
  }.property("online.users.length")
});
