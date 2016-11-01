import Ember from 'ember';  
var inject = Ember.inject;

export default Ember.Component.extend({  
    online: inject.service('online-service')
});