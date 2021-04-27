var express = require('express');
var router = express.Router();
const dataTier = require("../lib/dataTier");

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('webdataconnector');
});

router.get('/data', function(req, res, next) {
    dataTier.getClassesJSON(function(meetings) {
        res.json(meetings);
    })
});

module.exports = router;
