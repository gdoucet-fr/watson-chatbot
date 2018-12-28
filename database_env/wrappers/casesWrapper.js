var _ = require('lodash');
var moment = require('moment');
var path = require('path');
var cases =  require(path.join(__dirname, '..', 'data', 'cases.json'));

var getCase = function (caseID) {
  var _case =  _.get(cases, caseID);
  return _.isUndefined(_case) ? null : _case;
};

var createCase = function () {
  var caseID = (_.size(cases) + 1) + '';
  var newCase = {
    id: caseID,
    created: new Date().toString()
  };
  _.set(cases, caseID, newCase);
  console.log(`Case created with id ${caseID}`);
  return caseID.toString();
};

var getAllCases = function () {
  var _cases = _.map(cases, function (_case) {
    return _case;
  });
  return _cases;
};

var decorateLogs = function (messages) {
  var logs = _.map(messages, function (message) {
    var tmp = _.pick(message, ['text', 'time']);
    _.set(tmp, 'time', new Date(tmp.time).toString());
    _.set(tmp, 'from', _.get(message, 'bot') ? 'bot' : 'user');
    return tmp;
  });
  return logs;
};

var updateCase = function (caseID, data) {
  _caseID = _.isNil(caseID) ? "0" : caseID;
  var messages = _.get(data, 'logs');
  var userID = _.get(data, 'id');

  if (!_.isNil(messages)) {
    var logs = decorateLogs(messages);
    _.set(cases, _.join([_caseID, 'logs'], '.'), logs);
    console.log(`Logs updated for case ${caseID}`);
  }

  if (!_.isNil(userID)) {
    _.set(cases, _.join([caseID, 'userID'], '.'), userID);
    console.log(`User id updated for case ${caseID}`);
  }
  return true;
}

module.exports = {
  getCase: getCase,
  getAllCases: getAllCases,
  createCase: createCase,
  updateCase: updateCase
}
