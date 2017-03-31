import Ember from 'ember';
import { ajax } from 'discourse/lib/ajax'

var inject = Ember.inject;

export default Ember.Service.extend({  
    after: 'message-bus',

    messageBus: window.MessageBus,

    users:[],

    init() {
        var startingData = Discourse.Site.currentProp('users_online')
        
        this.set('users',startingData['users']);
        
        // Store the service instance so we can access it from the messageBus callback
        const onlineService = this;

        this.messageBus.subscribe('/whos-online', function(data){

            var currentUsers = onlineService.get('users')

            switch (data['message_type']) {
                case 'going_online':
                    var user = data['user'];
                    currentUsers.pushObject(user);

                    break;
                case 'going_offline':
                    var matchById = function(element){
                        return element.id == this;
                    }

                    data['users'].forEach(function(user_id){
                        var found = currentUsers.find(matchById, user_id);
                        if(found !== undefined){ 
                            currentUsers.removeObject(found);
                        }
                    });

                    break;
                default:
                    console.error('Unknown message type sent to /whos-online');
                    break;
            }
        }, startingData['messagebus_id']);

    }

});