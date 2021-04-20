var createError = require('http-errors');
var express = require('express');
var session = require('express-session')
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var sassMiddleware = require('node-sass-middleware')

var indexRouter = require('./routes/index');
var chartRouter = require('./routes/chart');
var saveRouter = require('./routes/save');
var scrapeRouter = require('./routes/scraper');
var presetRouter = require('./routes/preset');

var app = express();

// view engine setup
const flash = require('connect-flash')
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({secret: process.env.SESSION_SECRET,
                    resave: false, saveUninitialized: false}))
app.use(flash())

app.use(sassMiddleware({
  /* Options */
  src: __dirname + '/public',
  dest: __dirname + '/public',
  debug: true,
  outputStyle: 'expanded'
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/scrape', scrapeRouter);
app.use('/chart', chartRouter);
app.use('/saveChart', saveRouter);
app.use('/preset', presetRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

module.exports = app;
