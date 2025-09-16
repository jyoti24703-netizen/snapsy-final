const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path =require("path");



// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads'); // Destination folder for uploads
  },
  filename: function (req, file, cb) {
    const uniquename = uuidv4(); // Generate unique filename using UUID
    cb(null, uniquename+path.extname(file.originalname)); // Save the file with the unique name
  }
});

// Initialize upload
const upload = multer({ storage: storage });

module.exports = upload;
