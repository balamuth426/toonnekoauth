const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: true },
  replyId: { type: String }, // Eğer yanıt raporlanıyorsa
  reportedBy: { type: String, required: true }, // Rapor eden kullanıcı
  reason: { type: String, required: true }, // Rapor nedeni
  description: { type: String }, // Ek açıklama
  seriesId: { type: String, required: true }, // Hangi seride
  chapterNumber: { type: Number }, // Hangi bölümde (opsiyonel)
  reportDate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending' 
  },
  reviewedBy: { type: String }, // Admin kullanıcısı
  reviewedAt: { type: Date },
  action: { 
    type: String,
    enum: ['none', 'warning', 'comment_deleted', 'user_warned']
  }
});

module.exports = mongoose.model('Report', ReportSchema);
