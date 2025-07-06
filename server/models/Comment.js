const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  author: { type: String, required: true },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  edited: { type: Boolean, default: false },
  editedAt: { type: Date },
  reported: { type: Boolean, default: false },
  reportCount: { type: Number, default: 0 }
});

const CommentSchema = new mongoose.Schema({
  seriesId: { type: String, required: true, index: true },
  chapterNumber: { type: Number }, // Hangi bölüme ait (opsiyonel, yoksa ana seri sayfası)
  author: { type: String, required: true },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  dislikedBy: [{ type: String }],
  replies: [ReplySchema],
  deleted: { type: Boolean, default: false },
  edited: { type: Boolean, default: false },
  editedAt: { type: Date },
  reported: { type: Boolean, default: false },
  reportCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('Comment', CommentSchema);