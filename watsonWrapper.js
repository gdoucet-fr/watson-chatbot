var _ = require('lodash');
var path = require('path');

var assistantV1 = require('watson-developer-cloud/assistant/v1'); // Loading the Watson SDK

var credentials = require(path.join(__dirname, 'credentials.json')); // Loading the credentials from 'credentials.json'
var WORKSPACE_ID = _.get(credentials, 'workspace_id');
var USERNAME = _.get(credentials, 'username');
var PASSWORD = _.get(credentials, 'password');

var context = {}; // Context for Watson

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
  var time = Date.now();

  if (err) {
    return err;
  }

  context = _.get(response, 'context');

  console.log('----- Watson\'s answer -----');
  console.log(response);
  console.log('----- End of Watson\'s answer -----');

  var intents = _.get(response, 'intents');
  // If some intents are detected
  if (_.size(intents) >= 0) {
    // _.forEach(response.intents, function (intent, key) {
    //     if (_.isEqual(intent.intent, 'change_bank_details')) {
    //       console.log('******** DO AN API CALL TO ORACLE HR BLAH');
    //     }
    //     console.log(key, intent);
    // });

    // used to look for a bot response, and ouput them line after line
    var botResponses = _.get(response, 'output.generic'); //Is an array of Objects {response_type: "blah", param1: value1, param2, value2, ...}
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
          } else if (_.isEqual(responseType, 'option')) {
            response = processOptionResponse(botResponse);
          }

        // Decorating the response sent to the client
        _.set(response, 'bot', true);
        _.set(response, 'time', time);
        _.set(response, 'intents', intents);
        return response;
      });
      console.log('-------------------- Responses as sent to the client', responses);
    }
  }
  return responses;
}

// -- Exported functions start here --
var sendMessage = function (watsonInput, callback) {
  // TODO change 'text' to an object called {}
  console.log('Watson will process:', watsonInput);
  service.message({
    workspace_id: WORKSPACE_ID,
    context: context,
    input: watsonInput
  }, function (err, watsonResponse) {
      var data = processResponse(err, watsonResponse);
      callback(err, data);
  });
}

var init = function (callback) {
  console.log('Initialising Watson');
  service.message({
    workspace_id: WORKSPACE_ID,
    context: context
  }, function (err, watsonResponse) {
      var data = processResponse(err, watsonResponse);
      callback(err, data);
  });
}

module. exports = {
  sendMessage: sendMessage,
  init: init
}
