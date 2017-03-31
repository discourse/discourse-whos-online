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

  require_dependency 'application_controller'

  class DiscourseWhosOnline::WhosOnlineController < ::ApplicationController
    def on_request
      users = User.joins(:_custom_fields).where('user_custom_fields.name':'online_now', 'user_custom_fields.value':true)

      render_serialized(users, BasicUserSerializer, root: 'users')
    end
  end

  DiscourseWhosOnline::Engine.routes.draw do
    get '/get' => 'whos_online#on_request'
  end

  ::Discourse::Application.routes.append do
    mount ::DiscourseWhosOnline::Engine, at: '/whosonline'
  end

  module ::Jobs
    class WhosOnlineJob < Jobs::Scheduled
        every 1.minutes

        def execute(args)
          return if !SiteSetting.whos_online_enabled?

          no_record_users = User.where("id NOT IN (
            SELECT uc.user_id
            FROM user_custom_fields uc
            WHERE uc.name = 'online_now' AND
                  uc.value IS NOT NULL
          )")

          for user in no_record_users do
            user.custom_fields['online_now'] = false
            user.save!
          end

          all_users = User.joins(:_custom_fields).where('user_custom_fields.name':'online_now')

          previously_online = all_users.where('user_custom_fields.value':true)
          going_offline = previously_online.where("last_seen_at < ? OR last_seen_at IS NULL", SiteSetting.whos_online_active_timeago.minutes.ago)

          previously_offline = all_users.where('user_custom_fields.value':false)
          going_online = previously_offline.where("last_seen_at > ? AND last_seen_at IS NOT NULL", SiteSetting.whos_online_active_timeago.minutes.ago)
          
          serialized_going_online = []
          for user in going_online do
            serialized_going_online.push(BasicUserSerializer.new(user, root: false).as_json)
          end

          serialized_going_offline = []
          for user in going_offline do
            serialized_going_offline.push(BasicUserSerializer.new(user, root: false).as_json)
          end


          MessageBus.publish('/whos-online', {'going_online': serialized_going_online, 'going_offline': serialized_going_offline})

          UserCustomField.where(id: going_offline.pluck('user_custom_fields.id')).update_all(value: false)
          UserCustomField.where(id: going_online.pluck('user_custom_fields.id')).update_all(value: true)
        end
      end
  end

end
