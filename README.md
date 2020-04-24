# Simple Twitch Streams Discord Bot

A basic discord bot that tracks twitch streams for a specific game, and posts messages to discord when twitch streams go live.

Note: It only tracks one game, and only posts to one discord channel. Edit the code yourself if you want it to do anything more.

Type `.streams` to display currently live twitch streams.

Based off the [Dustforce Discord Bot](https://github.com/NoLifeJoel/Dustforce)

# How to set up:

### Prerequisites

* [Node.js](https://nodejs.org/)

### Step 1
Create a file named `tokens.json` in the parent directory of this file, with the following contents:
```
{
  "twitch-client-id": "abcdefhijklmnopqrstuvwxyz",
  "twitch-client-secret": "abcdefhijklmnopqrstuvwxyz",
  "twitch-client-token": null,
  "discord-token": "ABCDEFHIJKLMNOPQRSTUVWXYZ.ABCDEFHIJKLMNOPQRSTUVWXYZ"
}
```
(do not let tokens.json be publicly visible, as it will contain the sensitive twitch/discord ids/tokens required for the bot to work)

`twitch-client-id`
  1. Go to [dev.twitch.tv](https://dev.twitch.tv/login)
  2. Click **Your Console**
  3. Click **Register Your Application**
  4. Type whatever you want in the fields (you can use `http://localhost` for OAuth Redirect URL) and click **Create**
  5. Click **Manage** on the new app you created
  6. Copy the Client ID and secret. You can use a token if you already have one, otherwise leave it null and one will be generated for you.

`discord-token`
  * See [Setting Up a Bot Application](https://discordjs.guide/#/preparations/setting-up-a-bot-application)
  * This field should contain the token for your bot.


### Step 2
Edit the settings in the `config.js` file:
```
module.exports = {
  "discord-response-channel-id": '123456789123456789',
  "discord-notifications-channel-id": '123456789123456789',
  "target-game-id": '123456',
  "bot-user-name": 'Twitch Streams Bot',
  "bot-avatar-url": 'https://discuss.dev.twitch.tv/uploads/default/original/2X/1/1bce496ed4973e05b444bbc5519d8d350ea49c76.png',
  "bot-currently-playing": 'Twitch',
};
```
To get the channel ID of a channel in your discord server, turn on developer mode in your discord user settings (under "Appearance"). You can then get the channel ID by right-clicking a channel and selecting "Copy ID".

`discord-response-channel-id`
  * The ID of the channel you type `.streams` in, to get a list of streams from the bot. (the bot will also respond in this channel)

`discord-notifications-channel-id`
  * The channel the bot posts "going live" notifications to.

`target-game-id`
  * This is the ID of the game you want to track. An easy way to find a game's ID is by searching for it on [twitchinsights.net/](http://twitchinsights.net/).
  * For example, the game ID of Dustforce is **29093**, as seen [here](http://twitchinsights.net/game/29093).

`bot-user-name`
  * The username of your bot.

`bot-avatar-url`
  * The url of your bot's avatar.

`bot-currently-playing`
  * The game "currently being played" by your bot.

### Step 3

Installing dependencies:
```
npm install
```

Running the bot:
```
node index.js
```
