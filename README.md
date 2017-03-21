[![Build Status](https://travis-ci.org/davidtaylorhq/discourse-whos-online.svg?branch=master)](https://travis-ci.org/davidtaylorhq/discourse-whos-online)

# Discourse Who's Online Plugin

A Discourse plugin which displays a list of users currently active on the site:

<img src="https://meta-s3-cdn.global.ssl.fastly.net/original/3X/a/f/af9186cf7b6b694a8e00018fc67bce7f9f4e3660.gif"/>

The plugin uses the MessageBus to keep up-to-date, using messages from a Sidekiq job run every 1 minute on the server. This is my first attempt at Ember/Ruby development so any suggestions for improvements to the code structure are more than welcome. The plugin has only been tested on a very small discourse community, so use with caution!

### Configuration Options
These are available in the "plugins" section of the admin settings panel.

- **whos online active timeago**: maximum "last seen" for which users are considered online (minutes)
- **whos online collapse threshold**: number of users before the avatars overlap each other (see gif above). Set very high to disable this feature
- **whos online maximum display**: the maximum number of avatars to display. The numeric counter will still count higher than this. The choice of who gets displayed is currently inconsistent 
- **whos online minimum display**: the mimimum number of avatars to display. Below this  a "no users online" message is displayed

### Language Strings
These are available in the "plugins" section of the admin settings panel.

- **js.whos_online.no_users** | "No users currently online":The message displayed when the number of users < **whos online minimum display** setting. Set to blank to make it disappear when there are few users online.
- **js.whos_online.title** | "Online": The text displayed before the list of avatars
- **js.whos_online.tooltip** | "Users seen in the last 5 minutes": the text displayed on mouseover of the text

### [How to Install a Plugin](https://meta.discourse.org/t/install-a-plugin/19157)
### [More Information / Discussion](https://meta.discourse.org/t/whos-online-plugin/52345)
