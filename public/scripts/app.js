var watsonChatbot = angular.module('watsonChatbot', []);

watsonChatbot.controller('mainController', ['$scope', '$http',
  function mainController($scope, $http) {

    $scope.usrMsg = 'Hello';

    $scope.sendMsg = function () {
      $scope.messages.push({text: $scope.usrMsg, bot: false});
      $http({
        method: 'POST',
        url: 'http://localhost:3000/msg',
        data: {message: $scope.usrMsg}
      }).then(function successCallback(response) {
        console.log(response);
        $scope.messages.push(response.data);
      }, function errorCallback(response) {
        console.log('Error:', response);
      });
    };

    $scope.messages = [];
  }]);
