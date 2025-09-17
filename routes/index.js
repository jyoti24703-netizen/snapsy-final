var express = require('express'); 
var router = express.Router();

const fs = require("fs");
const path = require("path");

const userModel = require("./users");
const postModel = require("./posts");
const commentModel = require("./comments"); // ✅
const Contact = require("./contact");       // 🆕 contact model

const passport = require('passport');
const upload = require("./multer");
const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

// ---------- Routes ----------
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/login', function (req, res, next) {
  res.render('login', { error: req.flash('error') });
});

router.get('/feed', function(req, res, next) {
  res.render('feed');
});

// ✅ Upload route (image OR video)
router.post('/upload', isLoggedIn, upload.single("file"), async function(req, res, next) {
  if (!req.file) return res.status(404).send("no files were given");

  const user = await userModel.findOne({ username: req.session.passport.user });
  let postData = { imageText: req.body.filecaption, user: user._id };

  if (req.file.mimetype.startsWith("image")) postData.image = req.file.filename;
  else if (req.file.mimetype.startsWith("video")) postData.video = req.file.filename;

  const post = await postModel.create(postData);
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});

router.get('/profile', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate("posts");
  res.render("profile", { user });
});

router.post("/register", function(req, res) {
  const { username, email, fullname } = req.body;
  const userData = new userModel({ username, email, fullname });

  userModel.register(userData, req.body.password)
    .then(function() {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/profile");
      });
    });
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash: true
}), function(req, res) { });

router.get("/logout", function(req, res) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// Delete route
router.post("/delete/:id", isLoggedIn, async function(req, res, next) {
  try {
    const postId = req.params.id;
    await postModel.findByIdAndDelete(postId);
    await userModel.updateOne({ username: req.session.passport.user }, { $pull: { posts: postId } });
    res.redirect("/profile");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting post");
  }
});

// Comment route
router.post('/comment/:id', isLoggedIn, async function(req, res, next) {
  try {
    const postId = req.params.id;
    const user = await userModel.findOne({ username: req.session.passport.user });
    const comment = await commentModel.create({ post: postId, user: user._id, text: req.body.text });

    res.json({ success: true, comment: { text: comment.text, user: user.username, createdAt: comment.createdAt } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Error adding comment" });
  }
});

// Edit page
router.get("/edit/:id", isLoggedIn, async function(req, res) {
  const post = await postModel.findById(req.params.id);
  res.render("edit", { post });
});

// Update route
router.post("/update/:id", isLoggedIn, upload.single("file"), async function(req, res) {
  try {
    const post = await postModel.findById(req.params.id);
    post.imageText = req.body.filecaption;

    if (req.file) {
      if (post.image || post.video) {
        const oldPath = path.join(__dirname, "public", "images", "uploads", post.image || post.video);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      if (req.file.mimetype.startsWith("image")) { post.image = req.file.filename; post.video = undefined; }
      else if (req.file.mimetype.startsWith("video")) { post.video = req.file.filename; post.image = undefined; }
    }

    await post.save();
    res.redirect("/profile");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating post");
  }
});

// About, Contact, Projects routes
router.get("/about", (req, res) => res.render("about"));
router.get("/contact", (req, res) => res.render("contact"));
router.get("/projects", (req, res) => res.render("projects"));

// ---------- Contact form submission (MongoDB + Gmail) ----------
router.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;
  const nodemailer = require("nodemailer");

  try {
    // Save message to MongoDB
    await Contact.create({ name, email, message });

    // Send email
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "jyoti24703@gmail.com",       // <-- Replace with your Gmail
        pass: "sqxdocrrlqdocnom"
         // <-- Replace with Gmail App Password
      }
    });

    await transporter.sendMail({
      from: email,                         // sender is user
      to: "yourgmail@gmail.com",           // receive in your Gmail
      subject: "New Contact Message",
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    });

    // Thank-you page
    res.render("contact-success", { name });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing your message");
  }
});

// ---------- Middleware ----------
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

module.exports = router;
