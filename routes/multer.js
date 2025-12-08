// multer.js  (READY TO PASTE)

const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require("path");
const fs = require("fs");

// Make sure uploads folder exists
const uploadPath = "./public/images/uploads";
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Sanitize user-given image names
function safeName(name) {
  if (!name) return null;
  return name
    .replace(/[^a-zA-Z0-9-_ ]/g, "_")  // remove unsafe chars
    .replace(/\s+/g, "-")             // space → hyphen
    .slice(0, 50);                     // max 50 chars
}

// Storage settings
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    let userName = req.body?.imagename ? safeName(req.body.imagename) : null;

    const ext = path.extname(file.originalname).toLowerCase();
    const unique = uuidv4();

    let finalName;

    if (userName) {
      // Example → sunsetphoto-uuid.jpg
      finalName = `${userName}-${unique}${ext}`;
    } else {
      // Example → originalfile-uuid.jpg
      const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
      finalName = `${base}-${unique}${ext}`;
    }

    cb(null, finalName);
  }
});

// Allow only images + videos
function fileFilter(req, file, cb) {
  const allowed = /image|video/;
  if (allowed.test(file.mimetype)) return cb(null, true);
  cb(new Error("Only images and videos are allowed"));
}

// Multer upload settings
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB max
  }
});

module.exports = upload;
