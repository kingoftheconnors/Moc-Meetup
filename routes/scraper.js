var express = require('express');
var router = express.Router();
const dataTier = require("../lib/dataTier");
const scraper = require("../lib/scrapper");
const utils = require("../lib/utils");

// POST calendar to database
router.get('/', function(req,res) {
  res.send("Working on it");

  // Clear class tables
  dataTier.clearClassData()
  // Double-check for subjects that don't have any classes
  scraper.scrapeUnusedClasses(utils.getTerm())
});

router.get('/push', function(req,res) {
  res.send("Pushing class data to tableau data source");

  // Clear class tables
  dataTier.pushClassDataToSheet()
});


module.exports = router;
