var express = require('express');
var router = express.Router();

const buildCalendar = require("../lib/buildCalendar");
const dataTier = require("../lib/dataTier");
var CryptoJS = require("crypto-js");

// GET calendar search
router.get('/search', function(req, res, next) {
  // If an extension is noted, call it by id
  var searchTerm = req.param('searchterm') || ''
  dataTier.searchCalendarsByName(searchTerm, function(calendarData) {
    res.render('search',
    {
      calendars: calendarData
    });
  })
});

// GET classroom search
router.get('/classroom', function(req, res, next) {
  dataTier.getBuildings(function(buildingsArray) {
    res.render('classroom', { buildings: buildingsArray });
  })
});

// GET calendar
router.get('/:id', function(req, res, next) {
  // If an extension is noted, call it by id
  var key = "example"
  if(process.env.CHART_ENCODER_KEY) {
    key = process.env.CHART_ENCODER_KEY
  } else {
    try {
      configVars = require('./config')
      key = configVars['encoding_key'];
    }
    catch (e) {
      console.log("WARNING: No config file or database found. Loaded calendar will not be the same as on web app");
    }
  }
  var bytes  = CryptoJS.AES.decrypt(req.params.id, key);
  var plaintext = bytes.toString(CryptoJS.enc.Utf8);
  dataTier.loadCalendar(plaintext, function(calendarData) {
    res.render('chart',
      { name: "Class Layout by Week",
        barArray: JSON.stringify(calendarData),
        chartX: 5,
        chartY: 27,
        isAlreadySaved: true
      });
  })
});

// POST search params
router.post('/', function(req, res, next) {
  var inputClasses = req.body.classes
  if(!req.body.classes) {
    inputClasses = []
  }
  if (typeof inputClasses !== "array" && typeof inputClasses !== "object") {
    inputClasses = [inputClasses]
  }
  // Go through req to find REAL input, find out WHICH files need to be opened
  classProcessingArray = inputClasses.map(name => dataTier.getClassData(name.replace(/^\s*/g, '').replace(/\s*$/g, '')))
  Promise.all(classProcessingArray)
    .then((values) => {
      // Numbers 1-27 represent 8:00am-9:30pm on Monday by half-hour. 28-54 represent 8:00am-9:30pm on Tuesday.
      var createdCalendar = buildCalendar(inputClasses, values); // Created calendar format: { CPSC1100: [0, 1, 2, 8, 9, 12, 13, 41, 42], CPSC1110: [22, 76], ... }
      
      res.render('chart',
        { name: "Class Layout by Week",
          barArray: JSON.stringify(createdCalendar),
          chartX: 5,
          chartY: 27,
          isAlreadySaved: false
        });
    });
});

module.exports = router;
