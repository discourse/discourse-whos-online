import Component from "@ember/component";
import avatar from "discourse/helpers/avatar";

export default class WhosOnlineAvatar extends Component {
  tagName = "a";
  attributeBindings = ["user.username:data-user-card", "user.path:href"];

  <template>
    {{avatar
      this.user
      avatarTemplatePath="avatar_template"
      title=this.user.username
      imageSize="small"
    }}
  </template>
}
