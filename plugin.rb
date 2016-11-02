# name: Discourse Whos Online
# about: Who's online widget
# version: 0.0.1
# authors: David Taylor

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
      users = User.where("last_seen_at > ?", SiteSetting.whos_online_active_timeago.minutes.ago)

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
          usernames = User.where("last_seen_at > ?", SiteSetting.whos_online_active_timeago.minutes.ago).pluck(:username)
          
          MessageBus.publish('/whos-online', {'users':usernames})
        end
      end
  end

end
