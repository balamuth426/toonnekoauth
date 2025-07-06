const mongoose = require('mongoose');

// Bölüm okuma istatistikleri
const readingStatsSchema = new mongoose.Schema({
  seriesId: {
    type: String,
    required: true,
    index: true
  },
  chapterNumber: {
    type: Number,
    required: true,
    index: true
  },
  seriesTitle: {
    type: String,
    required: true
  },
  chapterTitle: String,
  totalReads: {
    type: Number,
    default: 0
  },
  weeklyReads: {
    type: Number,
    default: 0
  },
  dailyReads: {
    type: Number,
    default: 0
  },
  lastRead: {
    type: Date,
    default: Date.now
  },
  // Haftalık okuma verilerini sıfırlamak için
  weeklyResetDate: {
    type: Date,
    default: Date.now
  },
  // Günlük okuma verilerini sıfırlamak için
  dailyResetDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Seri + bölüm kombinasyonu için unique index
readingStatsSchema.index({ seriesId: 1, chapterNumber: 1 }, { unique: true });

// Popüler seriler için compound index'ler
readingStatsSchema.index({ totalReads: -1, lastRead: -1 });
readingStatsSchema.index({ weeklyReads: -1, weeklyResetDate: -1 });
readingStatsSchema.index({ dailyReads: -1, dailyResetDate: -1 });

module.exports = mongoose.model('ReadingStats', readingStatsSchema);
