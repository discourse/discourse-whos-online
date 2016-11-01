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
    		// Load the users
            console.log('Fetched initial list of users')
            this.set('users', result['users']);

            // Store the service instance so we can access it from the messageBus callback
            const onlineService = this;

            this.messageBus.subscribe('/whos-online', function(data){
                var currentUsers = onlineService.get('users')
                var newUsernames = data['users']

                var toRemove = []

                currentUsers.forEach(function(user, index, array){
                    // Check if still online
                    var usernameIndex = newUsernames.indexOf(user.username);
                    if(usernameIndex == -1){ // User is now offline
                        console.log('Removing '+user.username+' from online')
                        toRemove.push(index) // Remove them from the array
                    }else{
                        console.log('Keeping '+user.username+' online')
                        newUsernames.splice(usernameIndex, 1) // It's not a new user, remove it from the list
                    }

                });

                toRemove.reverse().forEach(function(index){
                    currentUsers.removeAt(index, 1)
                })

                newUsernames.forEach(function(username){
                    console.log('Loading '+username+' for online')
                    Discourse.User.findByUsername(username).then(function(user){
                        console.log('Adding '+user.username+' to online')
                        onlineService.get('users').pushObject(user)
                    });
                });

            });

    	}.bind(this), function(msg){
            // An error occured
  	    	console.log(msg)
    	});
    }

});