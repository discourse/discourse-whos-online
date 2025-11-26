import Service, { service } from "@ember/service";
import Site from "discourse/models/site";

export default class WhosOnlineService extends Service {
  @service presence;

  #channel;

  init() {
    super.init(...arguments);

    this.#channel = this.presence.getChannel("/whos-online/online");

    if (this.enabled) {
      this.#channel.subscribe(Site.currentProp("whos_online_state"));
    }
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
