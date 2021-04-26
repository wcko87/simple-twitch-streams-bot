const fs = require('./filesystem');
const Discord = require('discord.js');
const discordClient = new Discord.Client();
const path = require('path');
const twitch = require('./twitch-helix');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
class DiscordChannel {
  constructor (id) {
    this.id = id;
  }
  send (msg) {
    return new Promise ((resolve, reject) => {
      if (discordClient.ws.connection !== null && discordClient.status === 0) {
        let channel = discordClient.channels.get(this.id);
        if (typeof channel !== 'undefined') {
          resolve(channel.send(msg));
        } else {
          reject('Failed to send discord message (Discord connection open, but channel not found.');
        }
      } else {
        reject('Failed to send discord message (Discord connection not open)');
      }
    });
  }
}

const responseDiscordChannel = new DiscordChannel(process.env.DISCORD_RESPONSE_CHANNEL_ID);
const notifyDiscordChannel = new DiscordChannel(process.env.DISCORD_NOTIFICATIONS_CHANNEL_ID);

setTimeout(() => {
  console.log("Logging in to discord...");
  discordClient.login(process.env.DISCORD_TOKEN).then(() => {
    console.log("Discord login success");
  }).catch((e) => {
    console.log("Discord login failure");
    console.log(e);
  });
}, 5000);
twitch.on('messageStreamStarted', (stream) => {
  let notificationMessage = stream.url + ' just went live: ' + stream.title;
  console.log(notificationMessage);
  notifyDiscordChannel.send(notificationMessage).then((message) => {
    console.log(message);
  }).catch((e) => {
    console.log(e);
  });
});
twitch.on('messageStreamDeleted', (stream) => {
  // Do nothing.
});
discordClient.on('ready', () => {
  function failToSet(setting) {return (e) => {
    console.log('Failed to set ' + setting);
    console.log(e);
  }}

 discordClient.user.setPresence({
        status: "online",  //You can show online, idle....
        game: {
            name: "GeoGuess Steams",  //The message shown
            type: "WATCHING" //PLAYING: WATCHING: LISTENING: STREAMING:
        }
    });
});
function toWeirdCase (pattern, str) {
  return str.split('').map((v, i) => pattern[i%7+1] === pattern[i%7+1].toLowerCase() ? v.toLowerCase() : v.toUpperCase()).join('');
}
discordClient.on('message', (message) => {
  let streamCommandRegex = /^(\.|!)streams$/i;
  let streamNotCased = /^(\.|!)streams$/;
  if (message.channel.id === responseDiscordChannel.id && streamCommandRegex.test(message.content)) {
    let applyWeirdCase = !streamNotCased.test(message.content);
    let streams = twitch.getStreams();
    let nobodyStreaming = 'Nobody is streaming.';
    let unknownStreaming = 'At least 1 person is streaming. I\'ll push notification(s) after I finish gathering data.';
    if (applyWeirdCase) {
      nobodyStreaming = toWeirdCase(message.content, nobodyStreaming);
      unknownStreaming = toWeirdCase(message.content, unknownStreaming);
    }
    if (Object.keys(streams).length === 0) {
      message.channel.send(nobodyStreaming);
    } else {
      let streamsString = '';
      for (let stream of Object.keys(streams)) {
        let streamTitle = streams[stream]["title"];
        if (applyWeirdCase) {
          streamTitle = toWeirdCase(message.content, streamTitle);
        }
        if (typeof streams[stream]["login"] !== 'undefined') {
          streamsString +=  streamTitle + ':' +  streams[stream]["url"]  + '\n';
        }
      }
      if (streamsString === '') {
        message.channel.send(unknownStreaming);
      } else {
        streamsString = streamsString.slice(0, -1);
        message.channel.send(streamsString);
      }
    }
  }
});
