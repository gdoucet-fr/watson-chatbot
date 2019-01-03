var _ = require('lodash');
var path = require('path');
var users =  require(path.join(__dirname, '..', 'data', 'users.json'));
var mailer = require(path.join(__dirname, '..', 'mailer.js'));

var defaultCriteria = ['id', 'nin'];

var getUser = function (user, criteria) {
  var findCriteria = defaultCriteria;
  if (!_.isUndefined(criteria)) {
    findCriteria = criteria;
  };
  var registeredUser = _.find(users, function (usr) {
    // For all the security criteria, establish an array of booleans
    var conditions = _.map(findCriteria, function (criterion) {
      return _.isEqual(_.get(usr, criterion), _.get(user, criterion));
    });
    var allValid = !_.includes(conditions, false); // Is one criterion does not match
    return allValid;
  });
  // Find a matching user for ID and NIN in the list of users
  return _.isUndefined(registeredUser) ? null : registeredUser;
};

var validateUser = function (user) {
  console.log('Validating user...', user);
  var registeredUser = getUser(user);
  console.log('User found? ', !_.isNil(registeredUser));
  return !_.isNil(registeredUser) ? _.get(registeredUser, 'firstName') : null;
};

var compareBankDetails = function (oldBankDetails, newBankDetails) {
  var _old = _.pick(oldBankDetails,  ['sortCode', 'accountNumber']);
  var _new = _.pick(newBankDetails, ['sortCode', 'accountNumber']);
  return _.isEqual(_old, _new);
};

var validateBankDetails = function (user, bankDetails) {
  var registeredUser = getUser(user);
  var registeredBankDetails = _.pick(registeredUser, ['sortCode', 'accountNumber']);
  var validBankDetails = compareBankDetails(registeredBankDetails, bankDetails);
  return validBankDetails;
};

var updateUser = function (user, newFields) {
  var registeredUser = getUser(user);
  _.forEach(newFields, function (value, key) {
    if (!_.isUndefined(_.get(registeredUser, key))) {
      _.set(registeredUser, key, value);
    }
  });
  newUsers = _.filter(users, function(existingUser) {
    return !_.isEqual(_.get(existingUser, 'id'), _.get(user, 'id'));
  });
  newUsers.push(registeredUser);
  newUsers = _.sortBy(newUsers, ['id']);
  users = newUsers;
  return true;
};

var changeBankDetails = function (user, oldDetails, newDetails) {
  var validUser = false;
  var validBankDetails = false;
  var success = false;
  var currentUser;
  validUser = validateUser(user);
  if (validUser) {
    console.log('User is valid');
    // If the user exists, check that the old bank details provided are valid
    validBankDetails = validateBankDetails(user, oldDetails);
    if (validBankDetails) {
      console.log('Old bank details are confirmed');
      var success = updateUser(user, newDetails);
      if (success) {
        currentUser = getUser(user);
        console.log('Bank details successfully updated');
        mailer.sendMailChangeBankDetails(currentUser);
        console.log(users);
        return {code: 0, message: 'Bank details successfully updated'};
      }
    }
    console.log('Bank details not matching');
    return {code: 2, message: 'Bank details not matching'};
  }
  console.log('User could not be identified');
  return {code: 1, message: 'User could not be identified'};
};

var getAllUsers = function () {
  return users;
};

module.exports = {
  validateUser: validateUser,
  changeBankDetails: changeBankDetails,
  getAllUsers: getAllUsers
}
