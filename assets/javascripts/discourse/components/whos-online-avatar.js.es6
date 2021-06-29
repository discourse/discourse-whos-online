import Component from "@ember/component";

export default Component.extend({
  tagName: "a",
  attributeBindings: ["user.username:data-user-card", "user.path:href"],
});
