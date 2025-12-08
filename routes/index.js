var express = require('express');
var router = express.Router();

require("dotenv").config();  
const nodemailer = require("nodemailer");

const fs = require("fs");
const path = require("path");

const userModel = require("./users");
const postModel = require("./posts");
const commentModel = require("./comments");
const Contact = require("./contact");

const passport = require('passport');
const upload = require("./multer");
const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

// ------------------ HOME ------------------
router.get('/', function(req, res) {
  res.render('index');
});

// ------------------ LOGIN ------------------
router.get('/login', function (req, res) {
  res.render('login', { error: req.flash('error') });
});

// ------------------ FEED ------------------
router.get('/feed', async (req, res) => {
  try {
    const posts = await postModel.find({})
      .populate('user', 'username fullname dp')
      .sort({ createdAt: -1 })
      .lean();

    res.render('feed', { posts, user: req.user });
  } catch (err) {
    console.error("Feed error:", err);
    res.status(500).send("Error loading feed");
  }
});

// ------------------ UPLOAD ------------------
router.post('/upload', isLoggedIn, upload.single("file"), async function(req, res) {
  try {
    if (!req.file) return res.status(400).send("No file uploaded");

    const user = await userModel.findOne({ username: req.session.passport.user });
    if (!user) return res.status(404).send("User not found");

    let postData = {
      imageText: req.body.filecaption || "",
      imageName: req.body.imagename || "",
      user: user._id,
      memory: ""
    };

    if (req.file.mimetype.startsWith("image")) postData.image = req.file.filename;
    else if (req.file.mimetype.startsWith("video")) postData.video = req.file.filename;

    const post = await postModel.create(postData);
    user.posts.push(post._id);
    await user.save();

    res.redirect("/profile");
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).send("Error uploading file");
  }
});

// ------------------ PROFILE ------------------
router.get('/profile', isLoggedIn, async function(req, res) {
  try {
    const user = await userModel
      .findOne({ username: req.session.passport.user })
      .populate({
        path: "posts",
        options: { sort: { createdAt: -1 } }
      });

    if (!user) return res.redirect('/login');
    res.render("profile", { user });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).send("Error loading profile");
  }
});

// ------------------ REGISTER ------------------
router.post("/register", async function(req, res) {
  try {
    const { username, email, fullname } = req.body;
    const userData = new userModel({ username, email, fullname });

    await userModel.register(userData, req.body.password);
    passport.authenticate("local")(req, res, function() {
      res.redirect("/profile");
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).send("Error registering user");
  }
});

// ------------------ LOGIN POST ------------------
router.post("/login", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash: true
}));

// ------------------ LOGOUT ------------------
router.get("/logout", function(req, res, next) {
  req.logout(function(err) {
    if (err) return next(err);
    res.redirect('/');
  });
});

// ------------------ DELETE ------------------
router.post("/delete/:id", isLoggedIn, async function(req, res) {
  try {
    const postId = req.params.id;

    const post = await postModel.findByIdAndDelete(postId);

    if (post) {
      const oldMedia = post.image || post.video;
      if (oldMedia) {
        const oldPath = path.join(__dirname, "../public/images/uploads", oldMedia);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    await userModel.updateOne(
      { username: req.session.passport.user },
      { $pull: { posts: postId } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false });
  }
});

// ------------------ SAVE MEMORY ------------------
router.post('/memory/:id', isLoggedIn, async function(req, res) {
  try {
    const postId = req.params.id;
    const { memory } = req.body;

    await postModel.findByIdAndUpdate(postId, { memory });
    res.json({ success: true });
  } catch (err) {
    console.error("Memory save error:", err);
    res.status(500).json({ success: false });
  }
});

// ------------------ EDIT ------------------
router.post("/edit/:id", isLoggedIn, async function(req, res) {
  try {
    const { caption, memory } = req.body;

    await postModel.findByIdAndUpdate(req.params.id, {
      imageText: caption,
      memory: memory
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Edit error:", err);
    res.status(500).json({ success: false });
  }
});

// ------------------ UPDATE DP ------------------
router.post("/update-dp", isLoggedIn, upload.single("dp"), async (req, res) => {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    if (req.file) user.dp = req.file.filename;
    await user.save();
    res.redirect("/profile");
  } catch (err) {
    res.status(500).send("Error updating profile picture");
  }
});

// ------------------ UPDATE BIO ------------------
router.post("/update-bio", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    user.bio = req.body.bio || "";
    await user.save();
    res.redirect("/profile");
  } catch (err) {
    res.status(500).send("Error updating bio");
  }
});

// ------------------ PROJECTS ------------------
router.get("/projects", async (req, res) => {
  const latest = await postModel.findOne({}).sort({ createdAt: -1 }).lean();
  res.render("projects", { project: latest || {} });
});

// ------------------ ABOUT & CONTACT ------------------
router.get("/about", (req, res) => res.render("about"));
router.get("/contact", (req, res) => res.render("contact"));

// ====================================================
// ✅ ✅ ✅ CONTACT FORM → SAVE + EMAIL + REDIRECT (FINAL)
// ====================================================
router.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // ✅ Save to MongoDB
    await Contact.create({ name, email, message });

    // ✅ Gmail Transporter (FIXED TO 587)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `📩 New Contact Message from ${name}`,
      html: `
        <h3>New Contact Form Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.render("contact-success", { name });

  } catch (err) {
    console.error("Contact error:", err);
    res.status(500).send("Error submitting contact form");
  }
});

// ------------------ AUTH MIDDLEWARE ------------------
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

module.exports = router;
