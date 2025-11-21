import avatar from "discourse/helpers/avatar";

const WhosOnlineAvatar = <template>
  <a data-user-card={{@user.username}} href={{@user.path}}>
    {{avatar
      @user
      avatarTemplatePath="avatar_template"
      title=@user.username
      imageSize="small"
    }}
  </a>
</template>;

export default WhosOnlineAvatar;
