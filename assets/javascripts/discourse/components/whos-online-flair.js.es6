import Ember from 'ember';
var inject = Ember.inject;

export default Ember.Component.extend({
  onlineService: inject.service('online-service'),

  display: function() {
    // If the indicator feature is disabled, return false
    if(!this.siteSettings.whos_online_show_avatar_icon){
      return false;
    }

    return this.get('onlineService').get('shouldDisplay');

  }.property(),

  isOnline: function(){
    return this.get('onlineService').isUserOnline(this.get('user').id);
  }.property('onlineService.users.@each'),

  isOffline: function(){
    return !this.get('isOnline');
  }.property('isOnline'),
  //   attributeBindings: ['user.username:data-user-card'],
});