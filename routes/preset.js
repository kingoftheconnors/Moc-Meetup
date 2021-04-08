var express = require('express');
const { errors } = require('puppeteer');
var router = express.Router();

const dataTier = require("../lib/dataTier");

/* GET preset page. */
router.get('/', function(req, res, next) {
  dataTier.getClassNames(function(classesArray) {
    dataTier.getPresets(function(presetsDict) {
      res.render('preset', { classes: classesArray
                           , presets: presetsDict
                           , error: req.flash('error')
                           , message: req.flash('message')});
    })
  })
});

router.post('/insert', function(req, res, next) {
  // Get data from request
  var inputClasses = req.body.classes || []
  var calendarName = req.body.presetName;
  // Convert single-input presets from String to Array
  if (typeof inputClasses !== "array" && typeof inputClasses !== "object") {
    inputClasses = [inputClasses]
  }
  // Remove duplicates
  inputClasses = inputClasses.sort().filter(function(item, pos, ary) {
      return !pos || item.toLowerCase() != ary[pos - 1].toLowerCase();
  });
  // Save data in database
  dataTier.addPreset(calendarName, inputClasses, function(errorString) {
    if(errorString)
      req.flash('error', errorString)
    else
      req.flash('message', 'New preset was successfully created!')
    res.redirect('/preset');
  });
});

module.exports = router;
