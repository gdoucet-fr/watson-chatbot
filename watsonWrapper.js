var _ = require('lodash');
var path = require('path');
var watson = require('watson-developer-cloud');
var assistantV1 = require('watson-developer-cloud/assistant/v1');
var http = require('http');
var databaseAPI = require(path.join(__dirname, 'database_env', 'databaseAPI.js'));

var credentials = require(path.join(__dirname, 'credentials.json')); // Loading the credentials from 'credentials.json'
var VERSION = '2018-09-20';
var WORKSPACE_ID = _.get(credentials, 'workspace_id');
var USERNAME = _.get(credentials, 'username');
var PASSWORD = _.get(credentials, 'password');

var NODE_ID_END_BANK_DETAIL = 'node_11_1542369646892';
var NODE_CREATE_CASE = 'node_3_1534929174763';//node_16_1537887753001';

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

var transformKeys = function (value, key) {
  return _.get(keyMap, key);
};

var extractFromContext = function (paths) {
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

var logUserMessage = function (watsonInput) {
  var message = {text: _.get(watsonInput, 'text')};
  _.set(message, 'time', new Date());
  _.set(message, 'bot', false);
  _messages.push(message);
};

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

  console.log('+++++ Watson\'s answer +++++');
  console.log(response);
  console.log('+++++ End of Watson\'s answer +++++');

  var intents = _.get(response, 'intents');
  var nodesVisited = _.get(response, 'output.nodes_visited');
  var triggerChangeBankDetail = false;
  var triggerCreateUser = false;

  console.log('--- Nodes visited', nodesVisited);
  // If some intents are detected
  if (_.size(intents) >= 0) {

    // If one of the visited nodes is the final node of the 'Change bank details' scenario
    triggerChangeBankDetail = _.includes(nodesVisited, NODE_ID_END_BANK_DETAIL);

    // If one of the visited nodes is the node where the user is confirmed then store current user and create a case
    triggerCreateUser = _.includes(nodesVisited, NODE_CREATE_CASE);

    // API call to change the bank details in the database and send a confirmation email
    if (triggerChangeBankDetail) {
      var oldBankDetails = extractFromContext(['old_sort_code', 'old_account_number']);
      var newBankDetails = extractFromContext(['new_sort_code', 'new_account_number']);
      //user =  {id: "111111", nin: "NN111111N"};
      //oldBankDetails = {sortCode: "11-11-11", accountNumber: "11111111"};
      //newBankDetails = {sortCode: "66-66-66", accountNumber: "66666666"};

      //console.log('--- User from context')
      //console.log(user);
      //console.log('--- Old bank details from context');
      //console.log(oldBankDetails);
      //console.log('--- New bank details from context');
      //console.log(newBankDetails);
      var errorCallback = function (err) {
        console.log(err);
      };
      databaseAPI.changeBankDetails(_currentUser, oldBankDetails, newBankDetails)
      .then(function (res) {
        console.log(res)
      });
    }

    if (triggerCreateUser && _.isNil(caseID)) {
      _currentUser = extractFromContext(['name', 'euro_id', 'ni_number', 'id_number']);
      databaseAPI.createCase(_currentUser).then(function (newCaseID) {
        console.log('log:127', newCaseID);
        caseID = newCaseID;
      });
    }

    // New dialog branches - to consider what happens with API

    // Used to look for a bot response, and ouput them line after line
    var botResponses = _.get(response, 'output.generic'); //Is an array of Objects {response_type: "blah", param1: value1, param2, value2, ...}
    var responses = [];
      if (botResponses.length != 0) { // If not empty, concatenate all the messages
        // For all each of response in the array of response
        // apply function to array botResponses
        responses = _.map(botResponses, function (botResponse) {
          var response;
          var responseType = _.get(botResponse, 'response_type');
          if (_.isEqual(responseType, 'text')) {
            response = processTextResponse(botResponse);
          } else if (_.isEqual(responseType, 'option')) {
            response = processOptionResponse(botResponse);
          }

        // Decorating the response sent to the client
        _.set(response, 'bot', true);
        _.set(response, 'time', time);
        _.set(response, 'intents', intents);
        _messages.push(response);
        return response;
      });
      console.log('--- Sending to client', responses);
    }
  }
  return responses;
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
      var data = processResponse(err, watsonResponse);
      callback(err, data);
  });
}

var init = function (callback) {
  console.log('--- Initialising Watson');
  sendMessage({text: "__qwerty1234"}, callback);
}

var disconnect = function () {
  databaseAPI.updateCaseLogs(caseID, _messages).then(function (res) {
    console.log(res);
  });
};

module. exports = {
  sendMessage: sendMessage,
  init: init,
  disconnect: disconnect
}
