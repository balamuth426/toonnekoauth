const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  readingProgress: [{
    seriesId: String,
    chapter: Number,
  }],
  ratings: [
    {
      seriesId: String,
      score: Number // 1 - 5 arasında
    }
  ],
  readSeries: [
    {
      seriesId: String,
      lastChapter: Number,
      updatedAt: { type: Date, default: Date.now }
    }
  ],
  favorites: [{
    type: String
  }],
  avatar: {
    type: String,
    default: '' // Kayıt sırasında atanacak
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isModerator: {
    type: Boolean,
    default: false
  },
  moderatorSeries: [{
    type: String // Moderatöre atanan seri ID'leri
  }],
  isBlocked: {
    type: Boolean,
    default: false
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
