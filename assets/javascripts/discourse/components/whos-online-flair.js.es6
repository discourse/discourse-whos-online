import Ember from 'ember';
var inject = Ember.inject;

export default Ember.Component.extend({
  tagName: 'div',
  classNames: 'online-indicator',
  classNameBindings: ['isOnline:status-online', 'isOffline:status-offline'],
  onlineService: inject.service('online-service'),

  isOnline: function(){
    return this.get('onlineService').isUserOnline(this.get('user').id);
  }.property('onlineService.users.@each'),
  
  isOffline: function(){
    return !this.get('isOnline');
  }.property('isOnline'),
  //   attributeBindings: ['user.username:data-user-card'],
});