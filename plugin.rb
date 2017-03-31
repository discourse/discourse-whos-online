# name: Discourse Whos Online
# about: Who's online widget
# version: 0.0.1
# authors: David Taylor

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

  # Monkeypatch User class to add DiscourseEvent trigger
  require_dependency 'user'
  class ::User
    alias_method :old_update_last_seen!, :update_last_seen!

    def update_last_seen!(now=Time.zone.now)
      now_date = now.to_date
      # Only update last seen once every minute
      redis_key = "user:#{id}:#{now_date}"
      return if $redis.exists(redis_key)

      old_update_last_seen!(now)

      DiscourseEvent.trigger(:user_seen, self)
    end
  end

  add_to_serializer(:site, :users_online) do
    online_user_ids = $redis.smembers("users_online")
    online_users = User.find(online_user_ids)

    serialized_online_users = []

    for user in online_users do
      serialized_online_users.push(BasicUserSerializer.new(user, root: false))
    end

    { users: serialized_online_users,
      messagebus_id: MessageBus.last_id('/whos-online') }    
  end

  # When user seen, update the user:#:online redis key
  # and add to 'users_online' set if necessary
  DiscourseEvent.on(:user_seen) do |user|
    puts("Event running, adding to redis")

    redis_key = "user:#{user.id}:online"
    expire_seconds = SiteSetting.whos_online_active_timeago.minutes

    already_online = $redis.exists(redis_key)

    $redis.set(redis_key, '1', {:ex => expire_seconds})

    if not already_online
      # Add to the redis set of online users
      Jobs.enqueue(:whos_online_going_online, {:user_id => user.id})
    end
  end

  module ::Jobs

    # This clears up users who have now moved offline
    class WhosOnlineGoingOffline < Jobs::Scheduled
      every 1.minutes

      def execute(args)
        return if !SiteSetting.whos_online_enabled?

        online_users = $redis.smembers("users_online")

        going_offline_ids = []

        for user_id in online_users do
          redis_key = "user:#{user_id}:online"
          
          user_still_online = $redis.exists(redis_key)

          if not user_still_online
            going_offline_ids.push(Integer(user_id))
            $redis.srem("users_online", user_id)
          end
        end

        if going_offline_ids.size > 0
          message = {
            message_type: 'going_offline',
            users: going_offline_ids
          }

          MessageBus.publish('/whos-online', message.as_json)
        end
      end
    end

    # This is run whenever a user becomes online
    class WhosOnlineGoingOnline < Jobs::Base
        
      def execute(args)
        return if !SiteSetting.whos_online_enabled?

        user_id = args[:user_id]

        return if $redis.sismember('users_online', user_id)

        new_user = User.find(user_id)

        message = {
          message_type: 'going_online',
          user: BasicUserSerializer.new(new_user, root: false)
        }

        $redis.sadd("users_online", new_user.id)
        MessageBus.publish('/whos-online', message.as_json)
      end
    end
  end

    
end
