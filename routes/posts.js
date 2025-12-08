const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({

  // Caption / description
  imageText: {
    type: String,
    trim: true,
    default: ""
  },

  // ✅ MEMORY FIELD (THIS WAS MISSING — NOW FIXED)
  memory: {
    type: String,
    default: ""
  },

  // Stored image filename
  image: {
    type: String,
    default: null
  },

  // Stored video filename
  video: {
    type: String,
    default: null
  },

  // User-friendly name given during upload
  imageName: {
    type: String,
    trim: true,
    default: ""
  },

  // User who uploaded the post
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },

  // List of users who liked/reacted
  reactions: [
    {
      emoji: { type: String, default: "❤️" },
      user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
      createdAt: { type: Date, default: Date.now }
    }
  ],

  // Comments references
  comments: [
    { type: mongoose.Schema.Types.ObjectId, ref: "comment" }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Post = mongoose.model("post", postSchema);
module.exports = Post;

