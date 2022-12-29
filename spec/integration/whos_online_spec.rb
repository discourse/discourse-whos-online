# frozen_string_literal: true

require "rails_helper"

describe "whos online plugin", type: :request do
  before do
    SiteSetting.whos_online_enabled = true
    PresenceChannel.clear_all!
  end

  let(:c) { PresenceChannel.new("/whos-online/online") }
  let(:user) { Fabricate(:user).tap { |u| Group.refresh_automatic_group!(:trust_level_0) } }

  it "registers a presence channel" do
    expect(c.timeout).to eq(SiteSetting.whos_online_active_timeago * 60)
    expect(c.config.public).to eq(true)
    expect(c.config.allowed_group_ids).to eq(nil)
  end

  it "secures the presence channel when non-public" do
    SiteSetting.whos_online_display_public = false
    expect(c.config.public).to eq(false)
    expect(c.config.allowed_group_ids).to contain_exactly(Group::AUTO_GROUPS[:trust_level_0])
  end

  it "serializes the state into the site" do
    get "/site.json"
    expect(response.status).to eq(200)
    expect(response.parsed_body["whos_online_state"]).not_to eq(nil)
    expect(response.parsed_body["whos_online_state"].keys).to include("users", "count")
  end

  it "only serializes state for logged-in users when secured" do
    SiteSetting.whos_online_display_public = false

    get "/site.json"
    expect(response.status).to eq(200)
    expect(response.parsed_body["whos_online_state"]).to eq(nil)

    sign_in(user)
    get "/site.json"
    expect(response.status).to eq(200)
    expect(response.parsed_body["whos_online_state"]).not_to eq(nil)
    expect(response.parsed_body["whos_online_state"].keys).to include("users", "count")
  end

  it "marks users as present when a request is made" do
    expect(c.user_ids).to eq([])

    sign_in(user)
    get "/latest.json"
    expect(c.user_ids).to contain_exactly(user.id)

    user2 = Fabricate(:user)
    sign_in(user2)
    get "/latest.json"
    expect(c.user_ids).to contain_exactly(user.id, user2.id)
  end

  it "respects 'hide my profile and presence' option" do
    expect(c.user_ids).to eq([])

    sign_in(user)
    get "/latest.json"
    expect(c.user_ids).to contain_exactly(user.id)

    user2 = Fabricate(:user)
    user2.user_option.update(hide_profile_and_presence: true)
    sign_in(user2)
    get "/latest.json"
    expect(c.user_ids).to contain_exactly(user.id)
  end
end
