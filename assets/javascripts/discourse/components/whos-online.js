import Component from "@ember/component";
import { inject as service } from "@ember/service";
import { computed } from "@ember/object";
import { readOnly } from "@ember/object/computed";

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
    return this.users && this.users.length > 0;
  }

  @computed("count")
  get hasCount() {
    return this.count && this.count > 0;
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
