var _ = require('lodash');
var moment = require('moment');
var path = require('path');
var cases =  require(path.join(__dirname, '..', 'data', 'cases.json'));

const NAMESPACE = 'http://localhost';

var getCase = function (caseID) {
  var _case =  _.get(cases, caseID);
  return _.isUndefined(_case) ? null : _case;
};

var createCase = function (data) {
  var userID = _.get(data, 'userID');
  var logs = _.get(data, 'logs');
  var caseID = _.keys(cases).length + 1;
  var newCase = {
    id: caseID,
    userID: userID,
    created: new Date().toString()
  };
  _.set(cases, caseID, newCase);
  console.log(`Case created with id ${caseID}`);
  return caseID;
};

var getAllCases = function () {
  var _cases = _.map(cases, function (_case) {
    return _case;
  });
  return _cases;
};

var updateCaseLogs = function (caseID, messages) {
  console.log('log:34', caseID)
  var logs = _.map(messages, function (message) {
    var tmp = _.pick(message, ['text', 'time']);
    _.set(tmp, 'time', new Date(tmp.time).toString());
    _.set(tmp, 'from', _.get(message, 'bot') ? 'bot' : 'user');
    return tmp;
  });

  _.set(cases, _.join([caseID, 'logs'], '.'), logs);
  console.log(`Logs updated for case ${caseID}`);
  return true;
};

module.exports = {
  getCase: getCase,
  getAllCases: getAllCases,
  createCase: createCase,
  updateCaseLogs: updateCaseLogs
}
