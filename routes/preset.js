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
  // Create expiration date
  var expirationSemesters = parseInt(req.body.expirationPeriod);
  if(expirationSemesters == NaN) {
    expirationSemesters = 1
  }
  var expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + expirationSemesters*365/2)
  // Convert date to database-friendly string
  expirationDate = expirationDate.toISOString().replace('T',' ').replace('Z','');
  // Convert single-input presets from String to Array
  if (typeof inputClasses !== "array" && typeof inputClasses !== "object") {
    inputClasses = [inputClasses]
  }
  // Return error if no classes passed in
  if(inputClasses.length == 0) {
    req.flash('error', 'Preset must contain classes!');
    res.redirect('/preset');
    return;
  }
  // Remove duplicates
  inputClasses = inputClasses.sort().filter(function(item, pos, ary) {
      return !pos || item.toLowerCase() != ary[pos - 1].toLowerCase();
  });
  // Save data in database
  dataTier.addPreset(calendarName, inputClasses, expirationDate, function(errorString) {
    if(errorString)
      req.flash('error', errorString);
    else
      req.flash('message', 'New preset was successfully created!');
    res.redirect('/preset');
  });
});

module.exports = router;
