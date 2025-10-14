import Service, { service } from "@ember/service";
import Site from "discourse/models/site";

export default class WhosOnlineService extends Service {
  @service presence;
  @service appEvents;

  #channel;

  init() {
    super.init(...arguments);

    this.#channel = this.presence.getChannel("/whos-online/online");

    if (this.enabled) {
      this.#channel.subscribe(Site.currentProp("whos_online_state"));
    }

    // TODO (glimmer-post-stream): remove this observer when removing the legacy widget code
    this.addObserver("users.[]", this, this._usersChanged);
  }

  get users() {
    return this.#channel?.users;
  }

  get count() {
    return this.#channel?.count || 0;
  }

  get countOnly() {
    return this.#channel?.countOnly || 0;
  }

  // TODO (glimmer-post-stream): remove this function when removing the legacy widget code
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
    return !!this.#channel?.users?.find((user) => user.id === id);
  }
}
