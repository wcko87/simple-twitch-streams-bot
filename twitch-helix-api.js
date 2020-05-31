const request = require('./request');
const querystring = require('querystring');
const fs = require('./filesystem');
const path = require('path');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tokens.json'), 'utf-8'));
let token_timer = 0;
let token_valid = false;
function writeToken (newToken) {
  config["twitch-client-token"] = newToken;
  fs.readFile(path.join(__dirname, '..', 'tokens.json'), 'utf-8').then((data) => {
    data = JSON.parse(data);
    if (typeof data === 'object') {
      data["twitch-client-token"] = newToken;
      data = JSON.stringify(data, null, 2);
      fs.writeFile(path.join(__dirname, '..', 'tokens.json'), data, 'utf-8').catch((e) => {
        console.error(e);
      });
    }
  });
}
function apiRequest (path, query) {
  query = querystring.stringify(query);
  return request({
    "host": 'api.twitch.tv',
    "path": '/helix/' + path + '?' + query,
    "method": 'GET',
    "headers": {
      "Authorization": 'Bearer ' + config["twitch-client-token"],
      "Client-ID": config["twitch-client-id"]
    },
    "special": {
      "https": true
    }
  });
}
function getToken () {
  return request({
    "host": 'id.twitch.tv',
    "method": 'POST',
    "path": '/oauth2/token?' + querystring.stringify({
      "client_id": config["twitch-client-id"],
      "client_secret": config["twitch-client-secret"],
      "grant_type": 'client_credentials'
    }),
    "special": {
      "https": true
    }
  }).then((response) => {
    let res = JSON.parse(response.data);
    token_timer = res.expires_in;
    console.log('A new token has been fetched, it expires in ' + res.expires_in + ' seconds.');
    token_valid = true;
    writeToken(res.access_token);
    return res.access_token;
  });
}
function validateToken (token) {
  return request({
    "host": 'id.twitch.tv',
    "path": '/oauth2/validate',
    "special": {
      "https": true
    },
    "headers": {
      "Authorization": 'OAuth ' + config["twitch-client-token"]
    }
  }).then((response) => {
    let res = JSON.parse(response.data);
    if ((res.hasOwnProperty('status') && res.status === 401) || res.expires_in < 1800) {
      console.log('Token invalid or about to expire, fetching a new one...');
      token_valid = false;
      return true;
    } else {
      console.log('Current token passed validation check.');
      token_valid = true;
      token_timer = res.expires_in;
    }
  }).then((fetchToken) => {
    if (fetchToken === true) {
      return getToken();
    }
  });
}
function tokenLoop () {
  if (typeof config["twitch-client-token"] !== 'string') {
    console.log('client-token in tokens.json is not a string, fetching a new one...');
    getToken().catch((e) => {
      console.error(e);
    }).then(() => {
      setTimeout(tokenLoop, 1200000);
    });
  } else {
    validateToken(config["twitch-client-token"]).catch((e) => {
      console.error(e);
    }).then(() => {
      setTimeout(tokenLoop, 1200000);
    });
  }
}
setTimeout(tokenLoop, 1200000);
function getUsers (data) {
  return new Promise((resolve, reject) => {
    if (typeof config["twitch-client-token"] !== 'string') {
      console.log('client-token in tokens.json is not a string, fetching a new one...');
      getToken().then((token) => {
        writeToken(token);
        return getUsers(data);
      }).then(resolve, reject);
      return null;
    }
    if (typeof data === 'undefined' || (typeof data.id === 'undefined' && typeof data.login === 'undefined')) {
      reject('You must specify user id(s) or username(s) as a string or an array.');
    } else if ((Array.isArray(data.id) && data.id.length > 100) || (Array.isArray(data.login) && data.login.length > 100)) {
      reject('You specified too many user ids or usernames.');
    } else {
      apiRequest('users', data).then((response) => {
        response.data = JSON.parse(response.data);
        resolve(response);
      });
    }
  });
}
function getStreams (data) {
  return new Promise((resolve, reject) => {
    if (typeof config["twitch-client-token"] !== 'string') {
      console.log('client-token in tokens.json is not a string, fetching a new one...');
      getToken().then((token) => {
        writeToken(token);
        return getStreams(data);
      }).then(resolve, reject);
      return null;
    }
    if (typeof data === 'undefined' || (typeof data.game_id === 'undefined' && typeof data.user_id === 'undefined')) {
      reject('You must specify game id(s) or user id(s) as a string or an array.');
    } else if ((Array.isArray(data.game_id) && data.game_id.length > 100) || (Array.isArray(data.user_id) && data.user_id.length > 100)) {
      reject('You specified too many game ids or user ids.');
    } else {
      apiRequest('streams', data).then((response) => {
        response.data = JSON.parse(response.data);
        resolve(response);
      });
    }
  });
}
module.exports = {
  "users": {
    "getUsers": getUsers
  },
  "streams": {
    "getStreams": getStreams
  }
}
