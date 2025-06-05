import Component from "@ember/component";
import { classNames, tagName } from "@ember-decorators/component";
import WhosOnline from "../../components/whos-online";

@tagName("span")
@classNames("discovery-list-container-top-outlet", "online_users_widget")
export default class OnlineUsersWidget extends Component {
  <template><WhosOnline /></template>
}
