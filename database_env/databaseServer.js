const PORT = 8000;

// Libraries
var bodyParser = require('body-parser');
var express = require('express'); // ExpressJS HTTP framework
var _ = require('lodash'); // Tools to manipulate objects, arrays, string...
var path = require('path'); // Node library to manipulate directories, file paths, etc.

// Separate routers to handle exposed endpoints
const users = require('./routes/users');
const cases = require('./routes/cases');

// Creating the web server
var app = express();
var server = require('http').Server(app);

// Web server options
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/users', users);
app.use('/cases', cases);

// Starting the server that will listen on the specified port
server.listen(PORT, function (err) {
  if (err) {
    return console.log('Error')
  }
  console.log(`Database server listening on port ${PORT}`);
});
