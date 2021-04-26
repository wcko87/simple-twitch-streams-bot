const twitch = require('./twitch-helix-api');
const EventEmitter = require('events');

const streamEmitter = new EventEmitter();
let startup = false;
let streams = { };
function streamLoop () {
  // Uncomment for logging.
  //console.log("Get streams...");
  //console.log(".--current streams--.");
  //console.log(streams)
  //console.log("'-------------------'");
  twitch.streams.getStreams({
    "game_id": [
      process.env.GAME_ID
    ],
    "type": 'live'
  }).then((data) => {
    let res = data.data.data;
    if (res === undefined) {
      console.log('ERROR: ' + data.data.error);
      return null;
    } else {
      console.log('request successful');
    }
    let user_ids = [];
    for (let stream of res) {
      user_ids.push(stream["user_id"]);
      if (typeof streams[stream["user_id"]] === 'undefined') {
        streams[stream["user_id"]] = {};
      }
      streams[stream["user_id"]]["timer"] = 15;
      streams[stream["user_id"]]["title"] = stream["title"];
      streams[stream["user_id"]]["viewer_count"] = stream["viewer_count"];
      streams[stream["user_id"]]["url"] = 'https://www.twitch.tv/' + stream["user_login"];
      streams[stream["user_id"]]["user_name"] = stream["user_name"];
      streams[stream["user_id"]]["login"] = stream["user_login"];
      if (startup === true) {
        streamEmitter.emit('messageStreamStarted', streams[stream["user_id"]]);
      }
    }
    return null;
  }).catch((e) => {
    console.error(e);
  }).then(() => {
    if (startup === false) {
      startup = true;
    }
    setTimeout(streamLoop, 30000);
  });
}
setTimeout(streamLoop, 5000);
setInterval(() => {
  for (let stream of Object.keys(streams)) {
    streams[stream]["timer"]--;
    if (streams[stream]["timer"] < 1) {
      if (typeof streams[stream]["url"] !== 'undefined' && typeof streams[stream]["title"] !== 'undefined') {
        streamEmitter.emit('messageStreamDeleted', {
          "url": streams[stream]["url"],
          "title": streams[stream]["title"],
          "id": stream
        });
      }
      delete streams[stream];
    }
  }
}, 20000);
streamEmitter.getStreams = () => {
  return streams;
}
module.exports = streamEmitter;
