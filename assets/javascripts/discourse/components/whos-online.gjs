import Component from "@ember/component";
import { computed } from "@ember/object";
import { readOnly } from "@ember/object/computed";
import { service } from "@ember/service";
import { i18n } from "discourse-i18n";
import WhosOnlineAvatar from "./whos-online-avatar";

export default class WhosOnline extends Component {
  @service whosOnline;

  @readOnly("whosOnline.count") count;

  @computed("whosOnline.users.[]")
  get users() {
    return this.whosOnline.users?.slice(
      0,
      this.siteSettings.whos_online_maximum_display
    );
  }

  @computed("users", "users.length")
  get hasUsers() {
    return this.users?.length >= this.siteSettings.whos_online_minimum_display;
  }

  @computed("count")
  get hasCount() {
    return this.count >= this.siteSettings.whos_online_minimum_display;
  }

  @computed("count")
  get isLong() {
    return this.count >= this.siteSettings.whos_online_collapse_threshold;
  }

  @computed("count")
  get shouldDisplay() {
    if (
      this.count < this.siteSettings.whos_online_minimum_display &&
      this.siteSettings.whos_online_hide_below_minimum_display
    ) {
      return false;
    }

    return this.whosOnline.enabled;
  }

  <template>
    {{#if this.shouldDisplay}}
      <div id="whos-online" class={{if this.isLong "collapsed"}}>
        <span
          title={{i18n
            "whos_online.tooltip"
            count=this.siteSettings.whos_online_active_timeago
          }}
        >
          {{#if this.hasUsers}}
            {{i18n "whos_online.title" count=this.count}}
          {{else if this.hasCount}}
            {{i18n "whos_online.count_only" count=this.count}}
          {{else}}
            {{i18n "whos_online.no_users"}}
          {{/if}}
        </span>
        {{#if this.hasUsers}}
          {{#each this.users as |user|}}
            <WhosOnlineAvatar @user={{user}} />
          {{/each}}
        {{/if}}
      </div>
    {{/if}}
  </template>
}
