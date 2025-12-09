require("dotenv").config();

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("MongoDB Connected ✔️"))
.catch(err => console.log("MongoDB Error ❌", err));

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const expressSession = require("express-session");
const flash = require("connect-flash");

var indexRouter = require('./routes/index');
const passport = require('passport');

var app = express();

// =======================
// ✅ VIEW ENGINE
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
// ✅ PASSPORT
// =======================
app.use(passport.initialize());
app.use(passport.session());

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
// ❌ 404 HANDLER
// =======================
app.use(function(req, res, next) {
  next(createError(404));
});

// =======================
// ❌ ERROR HANDLER
// =======================
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

