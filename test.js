var path = require('path');
var _ = require('lodash');
var util = require('util');

var watsonWrapper = require(path.join(__dirname, 'watsonWrapper.js'));

var cb = function(err, response) {
    if (err)
      console.log('error:', err);
    else
    console.log(JSON.stringify(response, null, 2));
};

var wrapMessage = function(message) {
  return {text: message};
};

var test = util.promisify(watsonWrapper.sendMessage);

//test("__qwerty1234").then(function(data) {
//  console.log(data);
//});


test({text: 'Hello'}).then(function(data) {
  console.log(data);
}).catch(function(err) {
  console.error(err);
});
