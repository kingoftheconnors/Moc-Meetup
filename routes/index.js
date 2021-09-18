var express = require('express');
var router = express.Router();

const dataTier = require("../lib/dataTier");

var addresses = []

/* GET home page. */
router.get('/', function(req, res, next) {
  if (!addresses.find(x => x == req.connection.remoteAddress))
    addresses.push(req.connection.remoteAddress)
  console.log("Request by " + req.connection.remoteAddress + ". Site has seen " + addresses.length + " unique IPs")
  dataTier.getClassNames(function(classesArray) {
      res.render('configSearch', { classes: classesArray
                                 , error: req.flash('error')
                                 , message: req.flash('message')});
  })
});

/* GET home page. */
router.get('/about', function(req, res, next) {
  res.render('about');
});

/* GET home page. */
router.get('/help', function(req, res, next) {
  res.render('help');
});

module.exports = router;
