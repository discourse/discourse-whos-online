import Ember from 'ember';

export default Ember.Component.extend({
	tagName: 'a',
    attributeBindings: ['user.username:data-user-card'],
});