import Ember from 'ember';
import { ajax } from 'discourse/lib/ajax'

var inject = Ember.inject;

export default Ember.Service.extend({  
    after: 'message-bus',

    messageBus: window.MessageBus,

    users:[],

    init() {
        this.get('users').pushObject(Discourse.User.current())

    	// Go get the initial set of users
    	ajax('/whosonline/get.json', {method: 'GET'}).then(function(result){
            this.set('users', result['users']);

            // Store the service instance so we can access it from the messageBus callback
            const onlineService = this;

            this.messageBus.subscribe('/whos-online', function(data){
                console.log(data);

                var currentUsers = onlineService.get('users')

                data['going_online'].forEach(function(user, index, array){
                    currentUsers.pushObject(user);   
                });

                data['going_offline'].forEach(function(user, index, array){
                    var found = currentUsers.find(function(element){
                        return element.id == this.id
                    }, user);
                    currentUsers.removeObject(found);
                });
            });

    	}.bind(this), function(msg){
            // An error occured
  	    	console.log(msg)
    	});
    }

});