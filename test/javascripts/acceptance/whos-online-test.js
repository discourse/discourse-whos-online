import { visit } from "@ember/test-helpers";
import { test } from "qunit";
import { joinChannel } from "discourse/tests/helpers/presence-pretender";
import { acceptance } from "discourse/tests/helpers/qunit-helpers";

acceptance("Discourse Whos Online", function (needs) {
  needs.user();
  needs.settings({
    whos_online_display_public: true,
    whos_online_minimum_display: 2,
  });

  test("displays whos online", async (assert) => {
    await visit("/");
    assert.dom("#whos-online").exists("whos online visible");
    assert.dom("#whos-online img").doesNotExist("has 0 avatars");

    await joinChannel("/whos-online/online", {
      id: 123,
      avatar_template: "/a/b/c.jpg",
      username: "myusername",
    });

    // Still below minimum display
    assert.dom("#whos-online img").doesNotExist("still has 0 avatars");

    await joinChannel("/whos-online/online", {
      id: 124,
      avatar_template: "/a/b/c.jpg",
      username: "myusername2",
    });

    assert.dom("#whos-online img").exists({ count: 2 }, "has 2 avatars");
  });
});
