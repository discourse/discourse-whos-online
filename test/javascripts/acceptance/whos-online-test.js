import { visit } from "@ember/test-helpers";
import { test } from "qunit";
import { joinChannel } from "discourse/tests/helpers/presence-pretender";
import {
  acceptance,
  count,
  exists,
} from "discourse/tests/helpers/qunit-helpers";

acceptance("Discourse Whos Online", function (needs) {
  needs.user();
  needs.settings({
    whos_online_display_public: true,
    whos_online_minimum_display: 2,
  });

  test("displays whos online", async (assert) => {
    await visit("/");
    assert.ok(exists("#whos-online"), "whos online visible");
    assert.equal(count("#whos-online img"), 0, "has 0 avatars");

    await joinChannel("/whos-online/online", {
      id: 123,
      avatar_template: "/a/b/c.jpg",
      username: "myusername",
    });

    // Still below minimum display
    assert.equal(count("#whos-online img"), 0, "still has 0 avatars");

    await joinChannel("/whos-online/online", {
      id: 124,
      avatar_template: "/a/b/c.jpg",
      username: "myusername2",
    });

    assert.equal(count("#whos-online img"), 2, "has 2 avatars");
  });
});
