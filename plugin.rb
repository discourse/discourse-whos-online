# frozen_string_literal: true

# name: discourse-whos-online
# about: Display a list of online users at the top of the screen
# meta_topic_id: 52345
# version: 2.0
# authors: David Taylor
# url: https://github.com/discourse/discourse-whos-online
# transpile_js: true

enabled_site_setting :whos_online_enabled

PLUGIN_NAME ||= "discourse_whos_online".freeze
CHANNEL_NAME ||= "/whos-online/online"

register_asset "stylesheets/whos_online.scss"

after_initialize do
  register_presence_channel_prefix("whos-online") do |channel_name|
    if channel_name == "/whos-online/online"
      config = PresenceChannel::Config.new(timeout: SiteSetting.whos_online_active_timeago * 60)
      if SiteSetting.whos_online_display_public
        config.public = true
      else
        config.allowed_group_ids = [::Group::AUTO_GROUPS[:trust_level_0]]
      end
      config.count_only = SiteSetting.whos_online_count_only
      config
    end
  end

  on(:user_seen) do |user|
    hidden = false
    hidden ||= user.user_option.hide_profile_and_presence if defined?(
      user.user_option.hide_profile_and_presence
    )
    hidden ||= user.id < 0
    next if hidden
    PresenceChannel.new(CHANNEL_NAME).present(user_id: user.id, client_id: "seen")
  rescue PresenceChannel::InvalidAccess
  end

  add_to_serializer(
    :site,
    :whos_online_state,
    include_condition: -> do
      @whos_online_channel ||= PresenceChannel.new(CHANNEL_NAME)
      @whos_online_channel.can_view?(user_id: scope.user&.id)
    end,
  ) do
    @whos_online_channel ||= PresenceChannel.new(CHANNEL_NAME)
    PresenceChannelStateSerializer.new(@whos_online_channel.state, root: nil)
  end
end
