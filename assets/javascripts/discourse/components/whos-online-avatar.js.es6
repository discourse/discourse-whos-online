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
    		
    		var theContainer = this;

    		this.$("img").one("load", function() {
    			if(typeof theContainer.$() !== "undefined"){
					theContainer.$().removeClass('is-hidden');
				}
			}).each(function() {
			  	if(this.complete) $(this).load();
			});
    	
	   	}, 10);
    }
});