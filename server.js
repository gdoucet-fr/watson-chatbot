// Libraries
var bodyParser = require('body-parser');
var express = require('express'); // ExpressJS HTTP framework
var _ = require('lodash'); // Tools to manipulate objects, arrays, string...
var path = require('path'); // Node library to manipulate directories, file paths, etc.

var app = express(); // Instance of Express
var server = require('http').Server(app);

var webSocketWrapper = require(path.join(__dirname, 'webSocketWrapper'))(server);

// Configuration of the app to use libraries
const PORT = 3000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

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
