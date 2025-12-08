// routes/users.js — ✅ FINAL FIXED VERSION

const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

// ✅ ✅ ✅ ONLY ONE MONGO CONNECTION — USING ENV (WORKS ON VERCEL + LOCAL)
if (!mongoose.connection.readyState) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected (users.js)"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));
}

// ✅ USER SCHEMA
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  fullname: { type: String, required: true, trim: true },
  dp: { type: String },
  bio: { type: String, default: "" },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post'
  }],
}, { timestamps: true });

// ✅ PASSPORT LOCAL
userSchema.plugin(plm);

module.exports = mongoose.model('user', userSchema);

