# frozen_string_literal: true

# name: discourse-whos-online
# about: Who's online widget
# version: 1.0
# authors: David Taylor
# url: https://github.com/davidtaylorhq/discourse-whos-online

enabled_site_setting :whos_online_enabled

PLUGIN_NAME ||= 'discourse_whos_online'.freeze

register_asset 'stylesheets/whos_online.scss'

after_initialize do
  module ::DiscourseWhosOnline
    class Engine < ::Rails::Engine
      engine_name PLUGIN_NAME
      isolate_namespace DiscourseWhosOnline
    end
  end

  module ::DiscourseWhosOnline::OnlineManager

    def self.redis_key
      'whosonline_users'
    end

    # return true if a key was added
    def self.add(user_id)
      Discourse.redis.hset(redis_key, user_id, Time.zone.now)
    end

    # return true if a key was deleted
    def self.remove(user_id)
      Discourse.redis.hdel(redis_key, user_id) > 0
    end

    def self.get_users
      user_ids = Discourse.redis.hkeys(redis_key).map(&:to_i)
      User.where(id: user_ids)
    end

    def self.get_serialized_users
      get_users.map { |user| BasicUserSerializer.new(user, root: false) }
    end

    def self.cleanup
      going_offline_ids = []

      # Delete out of date entries
      hash = Discourse.redis.hgetall(redis_key)
      hash.each do |user_id, time|
        if Time.zone.now - Time.parse(time) >= SiteSetting.whos_online_active_timeago.minutes
          going_offline_ids << user_id.to_i if remove(user_id)
        end
      end

      going_offline_ids
    end

  end

  require_dependency 'application_controller'

  class DiscourseWhosOnline::WhosOnlineController < ::ApplicationController
    requires_plugin PLUGIN_NAME

    def on_request
      render json: { users: ::DiscourseWhosOnline::OnlineManager.get_serialized_users,
                     messagebus_id: MessageBus.last_id('/whos-online') }
    end
  end

  DiscourseWhosOnline::Engine.routes.draw do
    get '/get' => 'whos_online#on_request'
  end

  ::Discourse::Application.routes.append do
    mount ::DiscourseWhosOnline::Engine, at: '/whosonline'
  end

  add_to_serializer(:site, :users_online) do
    { users: ::DiscourseWhosOnline::OnlineManager.get_serialized_users,
      messagebus_id: MessageBus.last_id('/whos-online') }
  end

  # When user seen, update the redis data
  on(:user_seen) do |user|
    hidden = false
    hidden ||= user.user_option.hide_profile_and_presence if defined? user.user_option.hide_profile_and_presence
    hidden ||= user.id < 0
    next if hidden

    was_offline = ::DiscourseWhosOnline::OnlineManager.add(user.id)

    if was_offline
      message = {
        message_type: 'going_online',
        user: BasicUserSerializer.new(user, root: false)
      }

      MessageBus.publish('/whos-online', message.as_json)
    end
  end

  module ::Jobs

    # This clears up users who have now moved offline
    class WhosOnlineGoingOffline < ::Jobs::Scheduled
      every 1.minutes

      def execute(args)
        return if !SiteSetting.whos_online_enabled?

        going_offline_ids = ::DiscourseWhosOnline::OnlineManager.cleanup

        if going_offline_ids.size > 0
          message = {
            message_type: 'going_offline',
            users: going_offline_ids
          }

          MessageBus.publish('/whos-online', message.as_json)
        end
      end
    end

  end

end
