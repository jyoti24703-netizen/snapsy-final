// users.js
const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/nayaappforgolus", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  fullname: { type: String, required: true, trim: true },
  dp: { type: String },
  bio: { type: String, default: "" },   // <-- ADDED: bio field
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post'   // user has many posts
  }],
}, { timestamps: true });

userSchema.plugin(plm);

module.exports = mongoose.model('user', userSchema);
