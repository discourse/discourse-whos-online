import { computed } from "@ember/object";
import { readOnly } from "@ember/object/computed";
import Service, { service } from "@ember/service";
import Site from "discourse/models/site";

export default class WhosOnlineService extends Service {
  @service presence;
  @service appEvents;

  @readOnly("channel.users") users;
  @readOnly("channel.count") count;
  @readOnly("channel.countOnly") countOnly;

  init() {
    super.init(...arguments);

    this.set("channel", this.presence.getChannel("/whos-online/online"));

    if (this.enabled) {
      this.channel.subscribe(Site.currentProp("whos_online_state"));
    }

    this.addObserver("users.[]", this, this._usersChanged);
  }

  _usersChanged() {
    const currentUserIds = new Set(this.users?.map((u) => u.id) || []);
    const prevUserIds = this._prevUserIds || new Set([]);

    const enteredUsers = [...currentUserIds].filter((x) => !prevUserIds.has(x));
    const leftUsers = [...prevUserIds].filter((x) => !currentUserIds.has(x));
    const changedUsers = [...enteredUsers, ...leftUsers];

    if (changedUsers.length > 0) {
      this.appEvents.trigger("whosonline:changed", changedUsers);
    }
  }

  @computed
  get enabled() {
    const anonAndLoginRequired =
      !this.currentUser && this.siteSettings.login_required;
    if (anonAndLoginRequired) {
      return false;
    }

    return (
      this.siteSettings.whos_online_display_public ||
      this.currentUser?.trust_level >=
        this.siteSettings.whos_online_display_min_trust_level
    );
  }

  isUserOnline(id) {
    return !!this.channel?.users?.find((user) => user.id === id);
  }
}
