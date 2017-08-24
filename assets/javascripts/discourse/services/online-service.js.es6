import Ember from 'ember';
import { ajax } from 'discourse/lib/ajax';

export default Ember.Service.extend({
    after: 'message-bus',

    messageBus: window.MessageBus,

    users:[],

    appEvents: Discourse.__container__.lookup('app-events:main'),

    _lastMessageId: null,

    isUserOnline(user_id){

        var matchById = function(element){
                            return element.id === this;
                        };

        var found = this.get('users').find(matchById, user_id);
        if(found !== undefined){
            return true;
        }

        return false;

    },

    messageProcessor(){
        var onlineService = this;

        return function(data, global_id, message_id){
            var currentUsers = onlineService.get('users');

            var last_message_id = onlineService.get('_lastMessageId');

            if(message_id !== last_message_id + 1){ // If not the next message
                console.log("Reloading online users data");
                onlineService.messageBus.unsubscribe('/whos-online',this.func);

                // Fetch up to date data
                ajax('/whosonline/get.json', {method: 'GET'}).then(function(result){
                    onlineService.set('users', result['users']);
                    onlineService.set('_lastMessageId', result['messagebus_id']);
                    onlineService.messageBus.subscribe('/whos-online', onlineService.messageProcessor(), result['messagebus_id']);
                }, function(msg){
                    console.log(msg); // Log the error
                });
                onlineService.appEvents.trigger('whosonline:changed');
                return;
            }

            onlineService.set('_lastMessageId', message_id);

            switch (data['message_type']) {
                case 'going_online':
                    var user = data['user'];
                    currentUsers.pushObject(user);

                    break;
                case 'going_offline':
                    var matchById = function(element){
                        return element.id === this;
                    };

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
            onlineService.appEvents.trigger('whosonline:changed');

        };
    },

    init() {
        var startingData = Discourse.Site.currentProp('users_online');

        this.set('users',startingData['users']);
        this.set('_lastMessageId', startingData['messagebus_id']);

        this.appEvents.trigger('whosonline:changed');

        this.messageBus.subscribe('/whos-online', this.messageProcessor(), startingData['messagebus_id']);
    }

});