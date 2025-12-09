var express = require("express");
var router = express.Router();

require("dotenv").config();
const nodemailer = require("nodemailer");

const userModel = require("../models/users");
const postModel = require("../models/posts");
const commentModel = require("../models/comments");
const Contact = require("../models/contact");

const passport = require("passport");
const upload = require("./multer"); // correct path

// ----------------------
// HOME PAGE
// ----------------------
router.get("/", (req, res) => {
  res.render("index", { user: req.user || null });
});

// ----------------------
// LOGIN PAGE
// ----------------------
router.get("/login", (req, res) => {
  res.render("login", { error: req.flash("error") });
});

// ----------------------
// REGISTER USER
// ----------------------
router.post("/register", async (req, res) => {
  try {
    const { username, email, fullname } = req.body;
    const userData = new userModel({ username, email, fullname });

    await userModel.register(userData, req.body.password);

    passport.authenticate("local")(req, res, () => {
      res.redirect("/profile");
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).send("Error registering user");
  }
});

// ----------------------
// LOGIN USER
// ----------------------
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    res.redirect("/profile");
  }
);

// ----------------------
// LOGOUT USER
// ----------------------
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) console.log(err);
    res.redirect("/login");
  });
});

// ----------------------
// PROFILE PAGE
// ----------------------
router.get("/profile", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel
      .findById(req.user._id)
      .populate({ path: "posts", options: { sort: { createdAt: -1 } } });

    res.render("profile", { user });
  } catch (err) {
    res.status(500).send("Error loading profile");
  }
});

// ----------------------
// FEED
// ----------------------
router.get("/feed", isLoggedIn, async (req, res) => {
  const posts = await postModel
    .find({})
    .populate("user", "username fullname dp")
    .sort({ createdAt: -1 });

  res.render("feed", { posts, user: req.user });
});

// ----------------------
// UPLOAD POST
// ----------------------
router.post("/upload", isLoggedIn, upload.single("file"), async (req, res) => {
  try {
    const post = await postModel.create({
      user: req.user._id,
      image: req.file?.filename || null,
      imageText: req.body.filecaption || "",
    });

    req.user.posts.push(post._id);
    await req.user.save();

    res.redirect("/profile");
  } catch (err) {
    res.status(500).send("Upload failed");
  }
});

// ----------------------
// CONTACT FORM (POST)
// ----------------------
router.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    await Contact.create({ name, email, message });

    res.render("contact-success", { name });
  } catch (err) {
    res.status(500).send("Error submitting contact form");
  }
});

// ----------------------
// STATIC PAGES
// ----------------------
router.get("/about", (req, res) => {
  res.render("about", { user: req.user || null });
});

router.get("/projects", (req, res) => {
  res.render("projects", { user: req.user || null });
});

router.get("/contact", (req, res) => {
  res.render("contact", { user: req.user || null });
});

// ----------------------
// AUTH MIDDLEWARE
// ----------------------
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

module.exports = router;







