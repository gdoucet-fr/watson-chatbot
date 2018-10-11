var bodyParser = require('body-parser');
var express = require('express');
var _ = require('lodash');
var path = require('path');
var app = express();
var credentials = require(path.join(__dirname, 'credentials.json'));

var assistantV1 = require('watson-developer-cloud/assistant/v1');

var WORKSPACE_ID = _.get(credentials, 'workspace_id');
var USERNAME = _.get(credentials, 'username');
var PASSWORD = _.get(credentials, 'password');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, '/public')));

var port = 3000;

var service = new assistantV1({
  username: USERNAME,
  password: PASSWORD,
  version: '2018-07-10',
  minimum_confidence: 0.50, // (Optional) Default is 0.75
});

service.message({
  workspace_id: WORKSPACE_ID
}, processResponse);

//
var processResponse = function (err, response) {
  var intent;
  var text;
  if (err) {
    return console.log(err);
  }

  if (response.intents.length > 0) {
    intent = response.intents[0].intent
    console.log('Detected intents: #', intent);
  }

  if (response.output.generic.length != 0) {
    text = response.output.generic[0].text;
    console.log(text);
  }
  return {bot: true, text: text, intent: intent};
};

app.get('/', function (req, res){
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/msg', function (req, res) {
  var message = _.get(req, 'body.message');
  console.log(message);

  service.message({
    workspace_id: WORKSPACE_ID,
    input: {text: message}
  }, function (err, response) {
      var data = processResponse(err, response);
      res.json(data);
  });
});

app.listen(port, function (err) {
  if (err) {
    return console.log('Error')
  }
  console.log(`listening on port ${port}`);
});
