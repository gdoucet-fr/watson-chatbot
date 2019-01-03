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

  // Upon new connection define some callbacks
  io.on('connection', function (clientSocket) {
    console.log('--- New user has connected');
    watsonWrapper.initPromise().then(function(data) {
      console.log('[init] Promise resolved');
      var payload = formatMessage('server:init', data);
      clientSocket.send(payload);
    }).catch(function(err) {
      console.error('[init] Promise caught:', err);
      payload = formatMessage('server:init', err);
      clientSocket.send(payload);
    });


    // When a message is receiced by the server
    clientSocket.on('message', function (socketMessage) {
      var watsonInput = parseSocketMessage(socketMessage); // Parse the data received as a string
      watsonWrapper.sendMessagePromise(watsonInput).then(function(data) {
        console.log('[sendMessage] Promise resolved');
        var payload = formatMessage('server-message', data);
        clientSocket.send(payload);
      }).catch(function(err) {
        console.log('[sendMessage] Promise caught:', err);
        var payload = formatMessage('server-error', err);
        clientSocket.send(payload);
      });
    });

      // When a user disconnects
    clientSocket.on('disconnect', function (){
      console.log('--- A user has disconnected');
      watsonWrapper.disconnect();
    });

  });

  return io;
}
