import Ember from 'ember';  
var inject = Ember.inject;

export default Ember.Component.extend({  
    online: inject.service('online-service'),
    users: function() {
    	return this.get('online').users.slice(0, this.siteSettings.whos_online_maximum_display)
	}.property('online.users.@each'),
    isLong: function() {
    	return this.get('online').users.length >= this.siteSettings.whos_online_collapse_threshold
	}.property('online.users.length')
});