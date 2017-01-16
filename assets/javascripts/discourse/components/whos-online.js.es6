import Ember from 'ember';  
var inject = Ember.inject;

export default Ember.Component.extend({  
    showWhosOnline: function() {
      // If the plugin is disabled, return false
      if(!this.siteSettings.whos_online_enabled){
        return false
      }

      // If it's visible to the public, always make visible
      if(this.siteSettings.whos_online_display_public){
        return true
      }

      // Check user trust levels
      var currentUser = Discourse.User.current();
      
      if(currentUser===null){
        return false;
      }else{
        return currentUser.trust_level >= this.siteSettings.whos_online_display_min_trust_level;
      }
      
    }.property(),
    online: inject.service('online-service'),
    users: function() {
    	return this.get('online').users.slice(0, this.siteSettings.whos_online_maximum_display)
	}.property('online.users.@each'),
    isLong: function() {
    	return this.get('online').users.length >= this.siteSettings.whos_online_collapse_threshold
	}.property('online.users.length'),
	isUsers: function() {
    	return this.get('online').users.length >= this.siteSettings.whos_online_minimum_display
	}.property('online.users.length')
});