import Ember from 'ember';  
var inject = Ember.inject;

export default Ember.Component.extend({  
    online: inject.service('online-service'),
    isLong: function() {
    	return this.get('online').users.length >= this.siteSettings.whos_online_collapse_threshold
	}.property('online.users.length')
});