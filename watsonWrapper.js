var _ = require('lodash');
var path = require('path');
var watson = require('watson-developer-cloud');
var assistantV1 = require('watson-developer-cloud/assistant/v1');
var http = require('http');
var util = require('util');

var databaseAPI = require(path.join(__dirname, 'database_env', 'databaseAPI.js'));
var logger = require(path.join(__dirname, 'logger.js'));
var credentials = require(path.join(__dirname, 'credentials.json')); // Loading the credentials from 'credentials.json'

var VERSION = '2018-09-20';
var WORKSPACE_ID = _.get(credentials, 'workspace_id');
var USERNAME = _.get(credentials, 'username');
var PASSWORD = _.get(credentials, 'password');

var NODE_CHANGE_BANK_DETAIL = 'node_11_1542369646892';
var NODE_CREATE_CASE = 'node_2_1546537200725';
var NODE_UPDATE_CASE_INFO = 'node_16_1537887753001';
var NODE_VALIDATE_USER = 'node_5_1537969640504';

var keyMap = {
  'euro_id': 'id',
  'ni_number': 'nin',
  'name': 'name',
  'id_number': 'idNumber',
  'old_sort_code': 'sortCode',
  'old_account_number': 'accountNumber',
  'new_sort_code': 'sortCode',
  'new_account_number': 'accountNumber'
};

var _currentUser = {};
var caseID = null;
var _messages = [];

var transformKeys = function(value, key) {
  return _.get(keyMap, key);
};

var extractFromContext = function(paths) {
  var obj = _.pick(context, paths);
  obj = _.mapKeys(obj, transformKeys);
  return obj;
};

var watsonOptions = {
  username: USERNAME,
  password: PASSWORD,
  version: VERSION,
  minimum_confidence: 0.75
};

// var assistantV1 = require('watson-developer-cloud/assistant/v1'); // Loading the Watson SDK
var service = new watson.AssistantV1(watsonOptions)

var context = {}; // Context for Watson

/**
*/
var logUserMessage = function(watsonInput) {
  var message = {text: _.get(watsonInput, 'text')};
  _.set(message, 'time', new Date());
  _.set(message, 'bot', false);
  _messages.push(message);
};

/**
*/
var wrapTextResponse = function(response) {
  return {text: response.text};
};

/**
*/
var wrapOptionResponse = function(response) {
  return response;
};

/**
*/
var wrapInterceptResponse = function(response) {
  return {response_type: 'intercept' , text: 'please wait'};
};

var transformWatsonResponse = function(watsonResponse) {

  var time = Date.now();
  var intents = _.get(watsonResponse, 'intents');
  var watsonOutputs = _.get(watsonResponse, 'output.generic'); //Is an array of Objects {response_type: "blah", param1: value1, param2, value2, ...}
  var responses = [];
  if (watsonOutputs.length != 0) { // If not empty, concatenate all the messages
    // For all each of response in the array of response
    // apply function to array botResponses
    var messages = _.map(watsonOutputs, function(output) {
      var message;
      var responseType = _.get(output, 'response_type');
      if (_.isEqual(responseType, 'text')) {
        message = wrapTextResponse(output);
      } else if (_.isEqual(responseType, 'option')) {
        message = wrapOptionResponse(output);
      }

      // Decorating the response sent to the client
      _.set(message, 'bot', true);
      _.set(message, 'time', time);
      _.set(message, 'intents', intents);
      _messages.push(message); // Add the message to the history
      return message;
    });
    console.log('--- Sending to client', messages);
  }
  return messages;
};

/**
  Processes the response from Watson
  Returns [Messages] where message to be displayed by the client interface
*/
var processResponse = function(err, response) {
  var intercept = false;
  var messages = [];

  if (err) {
    return err;
  }

  context = _.get(response, 'context');

  logger.logWatsonResponse(response);

  var nodesVisited = _.get(response, 'output.nodes_visited');
  var triggerChangeBankDetail = false;
  var triggerCreateUser = false;
  var interceptMessages = false;

  console.log('--- Nodes visited', nodesVisited);

  // If one of the visited nodes is the node where the user is confirmed then store current user and create a case
  triggerCreateUser = _.includes(nodesVisited, NODE_CREATE_CASE);

  triggerUpdateCaseInfo = _.includes(nodesVisited, NODE_UPDATE_CASE_INFO);

  triggerValidateUser = _.includes(nodesVisited, NODE_VALIDATE_USER) && _.includes(nodesVisited, 'handler_6_1538039799713');

  // If one of the visited nodes is the final node of the 'Change bank details' scenario
  triggerChangeBankDetail = _.includes(nodesVisited, NODE_CHANGE_BANK_DETAIL);

  console.log('');
  console.log('--- CREATE_USER | UPDATE CASE | VALIDATE USER | CHANGE BANK DETAIL');
  console.log(`--- ${triggerCreateUser} | ${triggerUpdateCaseInfo} | ${triggerValidateUser} | ${triggerChangeBankDetail}`);
  console.log('');

  // API call to change the bank details in the database and send a confirmation email
  if (triggerChangeBankDetail) {
    var oldBankDetails = extractFromContext(['old_sort_code', 'old_account_number']);
    var newBankDetails = extractFromContext(['new_sort_code', 'new_account_number']);

    databaseAPI.changeBankDetails(_currentUser, oldBankDetails, newBankDetails).then(function (res) {
      console.log('--- [changeBankDetails] Promise resolved:', res);
    });
  }

  // Branch 2
  if (triggerCreateUser && _.isNil(caseID)) {
    databaseAPI.createCase().then(function (newCaseID) {
      console.log(`--- New case created with id ${newCaseID}`);
      caseID = newCaseID;
    });
  }

  // Branch 3
  if (triggerUpdateCaseInfo) {
    databaseAPI.updateCase(caseID, _currentUser).then(function(data) {
      ;
    });
  }

  // Branch 3
  if (triggerValidateUser) {
    triggerValidateUser = false;
    var tempUser = extractFromContext(['euro_id', 'ni_number']);

    return databaseAPI.validateUser(tempUser).then(function(registeredUsername) {
      if (!_.isNil(registeredUsername)) {
        _.set(tempUser, 'name', registeredUsername);
        _.set(tempUser, 'idNumber', caseID);
        _.set(context, 'name', registeredUsername);
        _currentUser = tempUser;
        return {text: "__userValid"};
      } else {
        return {text: "__userInvalid"};
      }
    }).then(function(message) {
      return sendMessagePromise(message);
    }).then(function(watsonResponse) {
      return processResponse(watsonResponse);
    }).catch(function(err) {
      console.error('--- Chain of promise caught an error:', err);
    });

  } else {
    messages = transformWatsonResponse(response);
    return messages;
  }


};

// -- Exported functions start here --
var sendMessage = function (watsonInput, callback) {
  console.log('--- Watson will process:', watsonInput);
  service.message({
    workspace_id: WORKSPACE_ID,
    context: context,
    input: watsonInput
  }, function (err, watsonResponse) {
      logUserMessage(watsonInput);
      var messages = processResponse(err, watsonResponse);
      callback(err, messages);
  });
}

var sendMessagePromise = util.promisify(sendMessage);

var init = function (callback) {
  console.log('--- Initialising Watson');
  sendMessage({text: "__qwerty1234"}, callback);
}

var initPromise = function() {
  console.log('--- Initialising Watson (promise)');
  return sendMessagePromise({text: '__qwerty1234'});
}

var disconnect = function () {
  context = {};
  _currentUser = {};
  databaseAPI.updateCase(caseID, {logs: _messages}).then(function (res) {
      _messages = [];
      caseID = null;
    console.log(res);
  });
};

module. exports = {
  disconnect: disconnect,
  sendMessagePromise: sendMessagePromise,
  initPromise: initPromise
}
