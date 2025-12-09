require("dotenv").config();

const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected ✔️"))
  .catch((err) => console.log("MongoDB Error ❌", err));

var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const User = require("./models/users");

var indexRouter = require("./routes/index");

var app = express();

// ----------------------
// View Engine
// ----------------------
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// ----------------------
// TRUST PROXY FOR RENDER
// ----------------------
app.set("trust proxy", 1);

// ----------------------
// SESSION CONFIG
// ----------------------
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret123",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// ----------------------
// PASSPORT SETUP
// ----------------------
app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(flash());

// ----------------------
// Middleware
// ----------------------
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// ----------------------
// Routes
// ----------------------
app.use("/", indexRouter);

// ----------------------
// 404
// ----------------------
app.use((req, res, next) => next(createError(404)));

// ----------------------
// Error Handler
// ----------------------
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;




