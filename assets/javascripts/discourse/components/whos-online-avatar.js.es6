import Ember from 'ember';  

export default Ember.Component.extend({  
	tagName: 'a',
    attributeBindings: ['user.username:data-user-card'],
    classNameBindings: ['isHidden'],
    isHidden: true,

    didInsertElement() {
    	// Run this later, to give the browser a chance to see the initial CSS class
    	// Otherwise the CSS3 animation won't work :(
    	// I hope there's a better way to do this!
    	Ember.run.later(this, function() {
    		this.$().removeClass('is-hidden');
	   	}, 10);
    }
});