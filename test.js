var watson = require('watson-developer-cloud');
var path = require('path');
var _ = require('lodash');

var credentials = require(path.join(__dirname, 'credentials.json')); // Loading the credentials from 'credentials.json'
var URL = 'https://gateway-lon.watsonplatform.net/assistant/api';
var VERSION = '2018-09-20';
var WORKSPACE_ID = _.get(credentials, 'workspace_id');
var USERNAME = _.get(credentials, 'username');
var PASSWORD = _.get(credentials, 'password');

var assistant = new watson.AssistantV1({
  username: USERNAME,
  password: PASSWORD,
  iam_apikey: '{apikey}',
  version: VERSION,
  url: URL
});

assistant.message({
  workspace_id: WORKSPACE_ID,
  input: {'text': 'Hello'}
},  function(err, response) {
  if (err)
    console.log('error:', err);
  else
    console.log(JSON.stringify(response, null, 2));
});
