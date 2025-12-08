require("dotenv").config(); // ✅ REQUIRED FOR EMAIL (DO NOT REMOVE)

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const expressSession = require("express-session");
const flash = require("connect-flash");

var indexRouter = require('./routes/index');
const userModel = require('./routes/users'); // ✅ mongoose user model
const passport = require('passport');

var app = express();

// =======================
// ✅ VIEW ENGINE SETUP
// =======================
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// =======================
// ✅ SESSION + FLASH
// =======================
app.use(flash());
app.use(expressSession({
  resave: false,
  saveUninitialized: false,
  secret: "hey hey hey"
}));

// =======================
// ✅ PASSPORT SETUP
// =======================
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

// =======================
// ✅ MIDDLEWARES
// =======================
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// =======================
// ✅ ROUTES
// =======================
app.use('/', indexRouter);

// =======================
// ✅ 404 HANDLER
// =======================
app.use(function(req, res, next) {
  next(createError(404));
});

// =======================
// ✅ ERROR HANDLER
// =======================
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

// =======================
// ✅ ✅ ✅ THIS WAS MISSING (CRITICAL FIX)
// =======================
module.exports = app;



