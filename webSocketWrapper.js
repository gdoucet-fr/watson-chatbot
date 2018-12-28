var _ = require('lodash');
var path = require('path');
var watsonWrapper = require(path.join(__dirname, 'watsonWrapper.js'));

module.exports = function (httpServer) {
  var io = require('socket.io')(httpServer);

  var formatMessage = function (eventType, data) {
    var payload = {eventType: eventType, data: data};
    var payloadString = JSON.stringify(payload);
    return payloadString;
  };

  var parseSocketMessage = function (socketMessage) {
    var watsonInput = JSON.parse(socketMessage);
    return _.get(watsonInput, 'watsonInput');
  };

  io.on('connection', function (clientSocket) {
    console.log('--- New user has connected');
    watsonWrapper.init(function (err, data) {
      var payload;
      if (err) {
        payload = formatMessage('server:error', err);
      } else {
        payload = formatMessage('server:init', data);
      }
      clientSocket.send(payload);
    });

    clientSocket.on('disconnect', function (){
      console.log('--- A user has disconnected');
      watsonWrapper.disconnect();
    });

    // When a message is receiced by the server
    clientSocket.on('message', function (socketMessage) {
      var watsonInput = parseSocketMessage(socketMessage); // Parse the data received as a string
      watsonWrapper.sendMessage(watsonInput, function (err, data) { // Relay the message to Watson
        var payload;
        if (err) { // Relay error to the client
          payload = formatMessage('server-error', err);
        } else {
          payload = formatMessage('server-message', data);
        }
        clientSocket.send(payload);
      });
    });
  });

  return io;
}
