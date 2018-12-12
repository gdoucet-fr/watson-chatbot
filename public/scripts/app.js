var watsonChatbot = angular.module('watsonChatbot', ['btford.socket-io']);

console.log('Hellooooooooooooo');

watsonChatbot.service('socket', ['socketFactory', function SocketService(socketFactory) {
    return socketFactory({
        ioSocket: io.connect('http://localhost:3000'),
        prefix: ''
    });
}]);

watsonChatbot.service('watsonWrapper', [function () {

  // Wrap the text to send in an object readable by Watson
  var wrapText = function (inputText) {
    var watsonInput = {text: inputText};
    return watsonInput;
  };

  return {
    wrapText: wrapText
  }
}]);

watsonChatbot.service('wsWrapper', [function () {

  var readMessage = function (msg, callback) {
    var message = JSON.parse(msg);
    var eventType = _.get(message, 'eventType');
    var data = _.get(message, 'data');
    if (_.isEqual(eventType, 'server:error')) {
      var error = _.get(message, 'data');
      // TODO other error types with enum types
      callback({text: 'Connection problem with the AI Server', err: data}, null);
    } else {
      console.log('wsWrapper', eventType, data);
      callback(null, data);
    }
  };

  var wrapData = function (watsonInput) {
// var payload = {eventType: eventType, data: data};
    var payload = {headers: {}, watsonInput: watsonInput};
    var payloadString = JSON.stringify(payload);
    console.log('Message that will be send to the server socket:', payloadString, _.isString(payloadString));
    return payloadString;
  };

  return {
    readMessage: readMessage,
    wrapData: wrapData
  }
}]);

watsonChatbot.controller('mainController', ['$scope', '$http', 'socket', 'wsWrapper', 'watsonWrapper',
  function mainController($scope, $http, socket, wsWrapper, watsonWrapper) {

    // Scope variables
    $scope.userInput = '';
    $scope.messages = [];
    $scope.lastMessageIsOption = false;
    $scope.error = null;

    // Scroll function to auo-scroll
    var scroll = function () {
      var modal = document.getElementById('chat-modal');
      modal.scrollTop = modal.scrollHeight
    };

    var processError = function (error) {
      console.error(error);
      $scope.error = error;
      return;
    };

    var addMessage = function (textToDisplay) {
      var now = new Date();
      var message = {text: textToDisplay, bot: false, time: now, response_type: 'none'};
      $scope.messages.push(message);
    };

    // Callback function that processes HTTP Responses received from the server
    var processSocketMessage = function (socketMessage) {
      _.forEach(socketMessage, function (response) {
          _.set(response, 'display', _.get(response, 'text'));
         $scope.messages.push(response);
      });

      var numberOfMessages = $scope.messages.length;
      var lastMessage = $scope.messages[numberOfMessages-1];
      $scope.lastMessageIsOption = _.isEqual(_.get(lastMessage, 'response_type'), 'option');
      //  Delays the forced scroll allow the page to add the elements into the containers
      setTimeout(scroll, 200);
    };

    var sendMessageTest = function (watsonInput, callback) {
      var inputText = _.get(watsonInput, 'text');
      if (!_.isEqual(inputText, '')) {
        var payload = wsWrapper.wrapData(watsonInput); // Send a message using the socket
//        console.log('Payload:', payload, _.isString(payload));
        socket.emit('message', payload);
        callback();
      }
    };

    // Function that returns the time in the format hh:mm from an epoch timestamp
    $scope.timestampToString = function (timestamp) {
      var date = new Date(timestamp);
      var minutes = date.getMinutes();
      var minAsString = minutes <= 9 ? '0' + minutes : minutes.toString();
      var timeAsString = date.getHours() + ':' + minAsString;
      return timeAsString;
    };

    // When the client socket receives a message
    socket.on('message', function(socketMessage) {
      wsWrapper.readMessage(socketMessage, function (err, message) {
        if (err) {
          processError(err);
          return;
        } else {
          $scope.error = null;
          processSocketMessage(message);
        }
      });
    });

    // Callback function used when the user is presented with options and clicks on the right answer
    $scope.clickOption = function (option) {
      var watsonInput = _.get(option, 'value.input');
      var textToDisplay = _.get(option, 'label');
      console.log(textToDisplay);
      sendMessageTest(watsonInput, function () {
        addMessage(textToDisplay);
      });
    };

    // Callback function used when the user clicks the 'Send' button or press Enter
    $scope.clickSend = function () {
      var userInput = $scope.userInput;
      $scope.userInput = '';
      var watsonInput = watsonWrapper.wrapText(userInput);
      sendMessageTest(watsonInput, function () {
        addMessage(userInput);
      });
    };

    $scope.reset = function () {
      $scope.userInput = "__abc123";
      $scope.sendMsg();
    };
  }]);
