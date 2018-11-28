// Libraries
var bodyParser = require('body-parser');
var express = require('express'); // ExpressJS HTTP framework
var _ = require('lodash'); // Tools to manipulate objects, arrays, string...
var path = require('path'); // Node library to manipulate directories, file paths, etc.

var app = express(); // Instance of Express
var server = require('http').Server(app);

<<<<<<< HEAD
// Loading the credentials from 'credentials.json'
var credentials = require(path.join(__dirname, 'credentials.json'));
var WORKSPACE_ID = _.get(credentials, 'workspace_id');
var USERNAME = _.get(credentials, 'username');
var PASSWORD = _.get(credentials, 'password');
=======
var webSocketWrapper = require(path.join(__dirname, 'webSocketWrapper'))(server);
>>>>>>> 701db6f7e0a19158213c276ec6ae988d678da68a

// Configuration of the app to use libraries
const PORT = 3000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

<<<<<<< HEAD
// define port
var port = 3000;

let context = {}; // Context for Watson

// Watson service is created with credentials and init paramneters
var service = new assistantV1({
  username: USERNAME,
  password: PASSWORD,
  version: '2018-09-20',
  minimum_confidence: 0.75
});

// function for processing text response from Watson
var processTextResponse = function (response) {
  return {text: response.text};  //object to be return the the client in the http response
};

// function for processing Option response from Watson
var processOptionResponse = function (response) {
  return response;
};

// Function that processes the response from Watson
// includes intent, text output and time of response
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
    // if user provides value for $old_sort_code (same for account number, and new sc / an)
    // Do an API call to Oracle
    // new dialog branches - to consider what happens with API
    //

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
        // text += response.text + '\n';
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

=======
// -- Web app starts here

>>>>>>> 701db6f7e0a19158213c276ec6ae988d678da68a
// When the client performs a GET request on 'http://localhost:3000/', sending 'index1.html'
app.get('/', function (req, res){
  res.sendFile(path.join(__dirname, 'index1.html'));
});

// Starting the server that will listen on the specified port
server.listen(PORT, function (err) {
  if (err) {
    return console.log('Error')
  }
  console.log(`Chatbot app listening on port ${PORT}`);
});
