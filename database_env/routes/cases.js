const express  = require('express');
const router   = new express.Router();
const _ = require('lodash');
const path     = require('path');
const casesWrapper = require(path.join(__dirname, '..', 'wrappers', 'casesWrapper'));

/* GET data from mongodb instance */
router.get('/', function (req, res) {
  res.json(casesWrapper.getAllCases());
});

router.post('/create', function (req, res) {
  res.json(casesWrapper.createCase());
});

router.get('/:caseID', function (req, res) {
  let caseID = _.get(req, 'params.caseID');
  res.json(casesWrapper.getCase(caseID));
});

router.post('/:caseID', function (req, res) {
  let caseID = _.get(req, 'params.caseID');
  let data = _.get(req, 'body');
  res.json(casesWrapper.updateCase(caseID, data));
});

module.exports = router;
