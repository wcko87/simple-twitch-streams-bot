const fs = require('./filesystem');
const Discord = require('discord.js');
const discordClient = new Discord.Client({
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});
const twitch = require('./twitch-helix');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const Geo = require('./geoquiz');
const GeoQuiz = new Geo();
class DiscordChannel {
  constructor(id) {
    this.id = id;
  }
  send(msg) {
    return new Promise((resolve, reject) => {
      if (discordClient.ws.status === 0) {
        const channel = discordClient.channels.cache.get(this.id);
        if (typeof channel !== 'undefined') {
          resolve(channel.send(msg));
        } else {
          reject(
            'Failed to send discord message (Discord connection open, but channel not found.'
          );
        }
      } else {
        reject('Failed to send discord message (Discord connection not open)');
      }
    });
  }
}

const responseDiscordChannel = new DiscordChannel(
  process.env.DISCORD_RESPONSE_CHANNEL_ID
);
const notifyDiscordChannel = new DiscordChannel(
  process.env.DISCORD_NOTIFICATIONS_CHANNEL_ID
);

const logChannel = new DiscordChannel(process.env.DISCORD_LOG_CHANNEL_ID);

setTimeout(() => {
  console.log('Logging in to discord...');
  discordClient
    .login(process.env.DISCORD_TOKEN)
    .then(() => {
      console.log('Discord login success');
    })
    .catch((e) => {
      console.log('Discord login failure');
      console.log(e);
    });
}, 5000);
twitch.on('messageStreamStarted', (stream) => {
  const messageEmbed = new Discord.MessageEmbed()
    .setColor('#9146ff')
    .setTitle(stream.title)
    .setURL(stream.url)
    .setAuthor(stream.user_name, stream.user.profile_image_url, stream.url)
    .setDescription(stream.user.description)
    .addField('Language', stream.language, true)
    .addField('Viewer Count', stream.viewer_count, true)
    .setImage(
      stream.thumbnail_url.replace('{width}', 1920).replace('{height}', 1080)
    )
    .setTimestamp();
  notifyDiscordChannel
    .send(messageEmbed)
    .then((message) => {
      console.log(stream.title + ' ' + stream.url);
    })
    .catch((e) => {
      console.log(e);
    });
});
twitch.on('messageStreamDeleted', (stream) => {
  // Do nothing.
});
discordClient.on('ready', () => {
  function failToSet(setting) {
    return (e) => {
      console.log('Failed to set ' + setting);
      console.log(e);
    };
  }

  discordClient.user.setPresence({
    status: 'online', //You can show online, idle....
    game: {
      name: 'GeoGuess Steams', //The message shown
      type: 'WATCHING', //PLAYING: WATCHING: LISTENING: STREAMING:
      url: 'https://www.twitch.tv/directory/game/GeoGuess',
    },
  });
});
function toWeirdCase(pattern, str) {
  return str
    .split('')
    .map((v, i) =>
      pattern[(i % 7) + 1] === pattern[(i % 7) + 1].toLowerCase()
        ? v.toLowerCase()
        : v.toUpperCase()
    )
    .join('');
}
discordClient.on('message', async (message) => {
  let streamCommandRegex = /^(\.|!)streams$/i;
  let streamNotCased = /^(\.|!)streams$/;
  if (
    message.channel.id === responseDiscordChannel.id &&
    streamCommandRegex.test(message.content)
  ) {
    let applyWeirdCase = !streamNotCased.test(message.content);
    let streams = twitch.getStreams();
    let nobodyStreaming = 'Nobody is streaming.';
    let unknownStreaming =
      "At least 1 person is streaming. I'll push notification(s) after I finish gathering data.";
    if (applyWeirdCase) {
      nobodyStreaming = toWeirdCase(message.content, nobodyStreaming);
      unknownStreaming = toWeirdCase(message.content, unknownStreaming);
    }
    if (Object.keys(streams).length === 0) {
      message.channel.send(nobodyStreaming);
    } else {
      let streamsString = '';
      for (let stream of Object.keys(streams)) {
        let streamTitle = streams[stream]['title'];
        if (applyWeirdCase) {
          streamTitle = toWeirdCase(message.content, streamTitle);
        }
        if (typeof streams[stream]['login'] !== 'undefined') {
          streamsString +=
            streamTitle + ' : <' + streams[stream]['url'] + '>\n';
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

  const REGEX_EMOJI = new RegExp(
    '(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]){1,2}',
    'g'
  );

  if (
    message.content.startsWith('GeoQuiz#') &&
    message.member.hasPermission('ADMINISTRATOR')
  ) {
    const splitMsg = message.content.split('\n').slice(1);

    const emojis = splitMsg.map((ans) => ans.match(REGEX_EMOJI)[0]);

    GeoQuiz.startQuestion(message.id);
    const addEmoji = async (emoji) => {
      return new Promise(async (resolve) => {
        resolve(
          message.react(emoji[0]).then(() => {
            if (emoji.length > 1) {
              return addEmoji(emoji.slice(1));
            }
            return;
          })
        );
      });
    };
    await addEmoji(emojis);

    console.log('GeoQuiz.messageId: ' + message.id);
  }
  if (
    message.content.startsWith('!correct') &&
    message.member.hasPermission('ADMINISTRATOR')
  ) {
    const emoji = message.content.match(REGEX_EMOJI)[0];
    GeoQuiz.setRightAnswer(emoji);
    console.log('GeoQuiz.rightAnswer: ' + emoji);

    message.delete();
  }
  if (
    message.content.startsWith('!end') &&
    message.member.hasPermission('ADMINISTRATOR')
  ) {
    try{
      const congratUsers = await GeoQuiz.endQuestion();
      
      console.log('GeoQuiz.endQuestion');
      if (congratUsers.length > 0) {
        const users = [];
        
        for (const userId of congratUsers) {
          try {
            if (message.channel.guild.members.cache.has(userId)) {
              users.push(message.channel.guild.members.cache.get(userId));
            } else {
              console.log('User ' + userId + ' not found');
              let user = await message.channel.guild.members.fetch(userId);
              users.push(user);
            }
          } catch (e) {
            console.log(e);
          }
        }
        
        message.channel.send(
          'Congratulations to ' +
          users.join(', ') +
          ' for getting the correct answer!'
          );
          message.delete();
        }
      } catch(e){
        logChannel.send('Send `!correct` before `!end`'); 
      }
  }

  if (
    message.content.startsWith('!messageId') &&
    message.member.hasPermission('ADMINISTRATOR')
  ) {
    const messageId = message.content.split(' ');
    if (messageId.length == 2) {
      GeoQuiz.setMessageId(messageId[1]);
      console.log('GeoQuiz.setMessageId', messageId[1]);
      message.delete();
    }
  }

  if (
    message.content.startsWith('!leaderboard') &&
    message.member.hasPermission('ADMINISTRATOR')
  ) {
    let textScore = '**Leaderboard:**\n';
    const totals = await GeoQuiz.getAllScores();

    for (const { userId, score } of totals) {
      try {
        let user;
        if (message.channel.guild.members.cache.has(userId)) {
          user = message.channel.guild.members.cache.get(userId);
        } else {
          user = await message.channel.guild.members.fetch(userId);
        }
        if (user) {
          textScore = textScore + `@${user.displayName} - ${score}\n`;
        }
      } catch (e) {
        console.log(e);
      }
    }

    message.channel.send(textScore);
    message.delete();
  }
});
discordClient.on('messageReactionAdd', async (reaction, user) => {
  if (reaction.partial) {
    // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Something went wrong when fetching the message: ', error);
      // Return as `reaction.message.author` may be undefined/null
      return;
    }
  }

  if (
    (await GeoQuiz.database.getMessageId()) == reaction.message.id &&
    !reaction.me
  ) {
    logChannel
      .send(user.username + ' (' + user.id + ') ' + reaction.emoji.name)
      .catch((e) => {
        console.log(e);
      });
    GeoQuiz.addAnswer(user.id, reaction.emoji.name);

    reaction.users.remove(user).catch((e) => {
      console.log(e);
    });
  }
});
