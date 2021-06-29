import Service from "@ember/service";
import { ajax } from "discourse/lib/ajax";
import User from "discourse/models/user";
import Site from "discourse/models/site";
import { computed } from "@ember/object";
import { inject as service } from "@ember/service";

export default Service.extend({
  after: "message-bus",
  messageBus: window.MessageBus,
  users: null,
  appEvents: service(),
  _lastMessageId: null,

  isUserOnline(user_id) {
    let matchById = function (element) {
      return element.id === this;
    };

    let found = this.users.find(matchById, user_id);
    if (found !== undefined) {
      return true;
    }

    return false;
  },

  messageProcessor() {
    let onlineService = this;

    return function (data, global_id, message_id) {
      let currentUsers = onlineService.get("users");

      let last_message_id = onlineService.get("_lastMessageId");

      if (message_id !== last_message_id + 1) {
        // If not the next message
        onlineService.messageBus.unsubscribe("/whos-online", this.func);

        // Fetch up to date data
        ajax("/whosonline/get.json", { method: "GET" }).then(
          function (result) {
            let oldUserIds = currentUsers.map((user) => {
              return user.get("id");
            });
            onlineService.set(
              "users",
              result["users"].map((user) => {
                return User.create(user);
              })
            );
            let newUserIds = onlineService.get("users").map((user) => {
              return user.get("id");
            });
            onlineService.set("_lastMessageId", result["messagebus_id"]);
            onlineService.messageBus.subscribe(
              "/whos-online",
              onlineService.messageProcessor(),
              result["messagebus_id"]
            );

            let changedUsers = [...oldUserIds, ...newUserIds];

            onlineService.appEvents.trigger("whosonline:changed", changedUsers);
          },
          function (msg) {
            console.log(msg); // eslint-disable-line no-console
          }
        );

        return;
      }

      onlineService.set("_lastMessageId", message_id);

      switch (data["message_type"]) {
        case "going_online":
          let user = User.create(data["user"]);
          currentUsers.pushObject(user);
          onlineService.appEvents.trigger("whosonline:changed", [
            user.get("id"),
          ]);
          break;
        case "going_offline":
          let matchById = function (element) {
            return element.get("id") === this;
          };

          data["users"].forEach(function (user_id) {
            let found = currentUsers.find(matchById, user_id);
            if (found !== undefined) {
              currentUsers.removeObject(found);
            }
          });

          onlineService.appEvents.trigger("whosonline:changed", data["users"]);

          break;
        default:
          console.error("Unknown message type sent to /whos-online"); // eslint-disable-line no-console
          break;
      }
    };
  },

  init() {
    this._super(...arguments);

    this.set("users", []);

    let startingData = Site.currentProp("users_online");

    if (startingData) {
      this.set(
        "users",
        startingData["users"].map((user) => {
          return User.create(user);
        })
      );
      this.set("_lastMessageId", startingData["messagebus_id"]);

      this.appEvents.trigger(
        "whosonline:changed",
        startingData["users"].map(({ id }) => id)
      );

      this.messageBus.subscribe(
        "/whos-online",
        this.messageProcessor(),
        startingData["messagebus_id"]
      );
    }
    this._super(...arguments);
  },

  @computed
  get shouldDisplay() {
    // If the plugin is disabled, return false
    if (!this.siteSettings.whos_online_enabled) {
      return false;
    }

    // If it's visible to the public, always make visible
    if (this.siteSettings.whos_online_display_public) {
      return true;
    }

    // Check user trust levels
    if (!this.currentUser) {
      return false;
    } else {
      return (
        this.currentUser.trust_level >=
        this.siteSettings.whos_online_display_min_trust_level
      );
    }
  },
});
