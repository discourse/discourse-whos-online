import Component from "@ember/component";

export default class WhosOnlineAvatar extends Component {
  tagName = "a";
  attributeBindings = ["user.username:data-user-card", "user.path:href"];
}
