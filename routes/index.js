var express = require('express');
var router = express.Router();

const dataTier = require("../lib/dataTier");

/* GET home page. */
router.get('/', function(req, res, next) {
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
