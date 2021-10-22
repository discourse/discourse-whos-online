# frozen_string_literal: true

class EnableWhosOnlineIfAlreadyInstalled < ActiveRecord::Migration[6.1]
  def up
    if Discourse.redis.hgetall("whosonline_users").count > 0
      # v1 of the plugin is currently installed (and someone is currently 'online'). In this case, set enabled=true in the database
      execute <<~SQL
        INSERT INTO site_settings(name, data_type, value, created_at, updated_at)
        VALUES('whos_online_enabled', 5, 't', NOW(), NOW())
        ON CONFLICT (name) DO NOTHING
      SQL
    end
  end

  def down
    # do nothing
  end
end
