import { withPluginApi } from 'discourse/lib/plugin-api';
import { iconNode } from 'discourse-common/lib/icon-library';

export default {
  name: 'start-whos-online',

  initialize(container) {
    const onlineService = container.lookup('service:online-service');

    withPluginApi('0.2', api => {

      api.createWidget('online-indicator', {
        tagName: 'div.online-indicator',
        buildKey: attrs => `online-status-${attrs.user_id}`,

        defaultState() {
          this.appEvents.on("whosonline:changed", () => {
            this.state.online = this.isOnline();
            this.scheduleRerender();
          });

          return {online: this.isOnline()};
        },

        html() {
          if(this.state.online){
            return [];
          }else{
            return [];
          }
        },

        buildClasses(attrs){
          if(this.state.online){
            return 'status-online'
          }else{
            return 'status-offline'
          }
        },

        isOnline(){
          return onlineService.isUserOnline(this.attrs.user_id, this);
        }
      });

      api.decorateWidget('post-avatar:after', helper => {
        return helper.attach('online-indicator', {user_id: helper.attrs.user_id});
      });

      api.decorateWidget('topic-participant:after', helper => {
        return helper.attach('online-indicator', {user_id: helper.attrs.id});
      });
    });
  },
};