const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  imageText: {
    type: String,
    required: true,
    trim: true
  },
  image:{
  type: String,

  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'   // matches user.js
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  likes: [
    {
      type: Array,
      default: [],
    }
  ]
});

// Create model
const Post = mongoose.model("post", postSchema); // 🔥 changed "Post" → "post"

module.exports = Post;



