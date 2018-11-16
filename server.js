// Libraries
var assistantV1 = require('watson-developer-cloud/assistant/v1'); // Loading the Watson SDK
var bodyParser = require('body-parser');
var express = require('express'); // ExpressJS HTTP framework
var _ = require('lodash'); // Tools to manipulate objects, arrays, string...
var path = require('path'); // Node library to manipulate directories, file paths, etc.

var app = express(); // Instance of Express

var credentials = require(path.join(__dirname, 'credentials.json')); // Loading the credentials from 'credentials.json'
var WORKSPACE_ID = _.get(credentials, 'workspace_id');
var USERNAME = _.get(credentials, 'username');
var PASSWORD = _.get(credentials, 'password');

// Configuration of the app to use libraries
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

var port = 3000;

let context = {}; // Context for Watson

// Watson service is created with credentials and init paramneters
var service = new assistantV1({
  username: USERNAME,
  password: PASSWORD,
  version: '2018-09-20',
  minimum_confidence: 0.75
});

var processTextResponse = function (response) {
  return {text: response.text};  //object to be return the the client in the http response
};

var processOptionResponse = function (response) {
  return response;
};

// Function that processes the response from Watson
var processResponse = function (err, response) {
  var intent;
  var text = '';
  var now = new Date();
  var time = '';
  var time = now.getHours() + ':' + now.getMinutes();

  if (err) {
    return console.log(err);
  }

  context = response.context;
  console.log(JSON.stringify(response, null, 2));

  // If some intents are detected
  if (response.intents.length > 0) {
//    console.log('Intents:');
    intent = response.intents[0].intent
    // _.forEach(response.intents, function (intent, key) {
    //     if (_.isEqual(intent.intent, 'change_bank_details')) {
    //       console.log('******** DO AN API CALL TO ORACLE HR BLAH');
    //     }
    //     console.log(key, intent);
    // });

    // used to look for a bot response, and ouput them line after line
    var botResponses = response.output.generic; //Is an array of Objects {response_type: "blah", param1: value1, param2, value2, ...}
    var responses = [];
      if (botResponses.length != 0) { // If not empty, concatenate all the messages
        // For all each of response in the array of response
        // apply function to array botResponses
        responses = _.map(botResponses, function (botResponse) {
          var response;
          var responseType = _.get(botResponse, 'response_type');
          console.log('-------------------- Response type:', responseType);
          if (_.isEqual(responseType, 'text')) {
            response = processTextResponse(botResponse);
//         text += response.text + '\n';
          } else if (_.isEqual(responseType, 'option')) {
            response = processOptionResponse(botResponse);
          }
        // TO DO: add flag for the bot, add the time, add the intents
        _.set(response, 'bot', true);
        _.set(response, 'time', time);
        _.set(response, 'intent', intent);
        return response;
      });
      console.log('-------------------- Responses as set to the client', responses);
    }
  }
  return responses;
}

// APP STARTS HERE

// Initial message to Watson, should display an error message if Watson down
service.message({
  workspace_id: WORKSPACE_ID,
  context: context
}, processResponse);

// When the client performs a GET request on 'http://localhost:3000/', sending 'index.html'
app.get('/', function (req, res){
  res.sendFile(path.join(__dirname, 'index1.html'));
});


// When the client performs a POST request to 'http://loclahost:3000/msg'
app.post('/msg', function (req, res) {
  var userMessage = _.get(req, 'body.message');
  console.log('');
  console.log('-------------------');
  console.log('User message: ', userMessage);

  // Relaying the message to Watson
  service.message({
    workspace_id: WORKSPACE_ID,
    input: {text: userMessage},
    context : context,
  }, function (err, response) {
      var data = processResponse(err, response);
      res.json(data);
  });
});

// app.get('/reset', function (req, res) {
//   console.log('Resetting the context');
//   context = {};
//   // Relaying the message to Watson
//   service.message({
//     workspace_id: WORKSPACE_ID,
//     input: {text: ''},
//     context : context,
//   }, function (err, response) {
//       var data = processResponse(err, response);
//       console.log(data)
//       res.json(data);
//   });
// });

app.listen(port, function (err) {
  if (err) {
    return console.log('Error')
  }
  console.log(`listening on port ${port}`);
});
