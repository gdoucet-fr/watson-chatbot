var axios = require('axios');
var URL_CHANGE_BANK_DETAILS = 'http://localhost:8000/users/change-bank-details';
var URL_CREATE_CASE = 'http://localhost:8000/cases/create';
var URL_CASES = 'http://localhost:8000/cases/';

var user =  {id: "111111", nin: "NN111111N"};
var invalidUser = {id: "111111", nin: "NN111111Z"};
var oldBankDetails = {sortCode: "11-11-11", accountNumber: "11111111"};
var newBankDetails = {sortCode: "66-66-66", accountNumber: "66666666"};

var changeBankDetails = function (user, oldBankDetails, newBankDetails, successCallback, errorCallback) {
  var postData = {user: user, oldBankDetails: oldBankDetails, newBankDetails: newBankDetails};
  return axios.post(URL_CHANGE_BANK_DETAILS, postData)
  .then(function(res){
    return res.data;
  }).catch(function(err) {
    return err;
  });
};

var createCase = function (user) {
  var postData = {userID: user.id};
  return axios.post(URL_CREATE_CASE, postData)
  .then(function(res){
    return res.data;
  }).catch(function(err) {
    return err;
  });
};

var updateCaseLogs = function (caseID, messages) {
  var url = URL_CASES + caseID;
  var postData = {logs: messages};
  return axios.post(url, postData).then(function(res){
    return res.data;
  }).catch(function(err) {
    return err;
  });
};

module.exports = {
  changeBankDetails: changeBankDetails,
  createCase: createCase,
  updateCaseLogs: updateCaseLogs
}
