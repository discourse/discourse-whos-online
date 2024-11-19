import Component from "@ember/component";
import { computed } from "@ember/object";
import { readOnly } from "@ember/object/computed";
import { service } from "@ember/service";

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
}
