const express  = require('express');
const router   = new express.Router();
const _ = require('lodash');
const path     = require('path');
const usersWrapper = require(path.join(__dirname, '..', 'wrappers', 'usersWrapper'));

// Get all users in the database
router.get('/', function (req, res) {
  res.json(usersWrapper.getAllUsers());
});

// Validate a user
router.post('/validate', function (req, res) {
  var user = _.get(req, 'body.user');
  console.log('Request to validate:', user);
  res.json(usersWrapper.validateUser(user));
});

// Changer the bank details
router.post('/change-bank-details', function (req, res) {
  var body = _.get(req, 'body');
  var user = _.get(body, 'user');
  var oldBankDetails = _.get(body, 'oldBankDetails');
  var newBankDetails = _.get(body, 'newBankDetails');
  var result = usersWrapper.changeBankDetails(user, oldBankDetails, newBankDetails);
  res.send(result);
});

module.exports = router;
