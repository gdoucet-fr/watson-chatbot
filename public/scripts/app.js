var watsonChatbot = angular.module('watsonChatbot', []);

watsonChatbot.controller('mainController', ['$scope', '$http',
  function mainController($scope, $http) {

    $scope.usrMsg = '';
    $scope.messages = [];
    $scope.responseIsOption = false;

    var processResponse = function (httpResponse) {
      console.log(httpResponse.data);
      for (var i =0; i < httpResponse.data.length; i++) {
        var response = httpResponse.data[i];
        $scope.messages.push(response);
      }
      var numberOfMessages = $scope.messages.length;
      $scope.responseIsOption = ($scope.messages[numberOfMessages-1]['response_type'] === 'option');
      var modal = document.getElementById('chat-modal');
      //  Delays the forced scroll allow the page to add the elements into the containers
      setTimeout($scope.scroll, 200);
    }

    var getTimeString = function (timestamp) {
      var timeAsString = '';
      var minutes = timestamp.getMinutes();
      var minAsString = minutes <= 9 ? '0' + minutes : minutes.toString();
      var timeAsString = timestamp.getHours() + ':' + minAsString;
      return timeAsString;
    }

    $scope.sendMsg = function (userMessage) {
      var message;
      if (userMessage !== undefined) {
        message = userMessage;
      } else {
        var message = $scope.usrMsg;
      }

      if (message !== '') {
        $scope.usrMsg ='';
        var now = new Date();
        var time = getTimeString(now);
        $scope.messages.push({text: message, bot: false, time: time, response_type: 'none'});
        $http({
          method: 'POST',
          url: 'http://localhost:3000/msg',
          data: {message: message}
        }).then(function successCallback(response) {
          processResponse(response);
        }, function errorCallback(response) {
          console.log('Error:', response);
        });
      }
    };

    $scope.respondToOption = function (value) {
      $scope.sendMsg(value.input.text);
      console.log(value);
    };

    $scope.reset = function () {
      $scope.usrMsg = "__abc123";
      $scope.sendMsg();
    };

    $scope.scroll = function () {
        var modal = document.getElementById('chat-modal');
        modal.scrollTop = modal.scrollHeight
    }
  }]);
