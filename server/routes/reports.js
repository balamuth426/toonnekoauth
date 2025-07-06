const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Comment = require('../models/Comment');
const verifyToken = require('../middleware/verifyToken');

// Yorum rapor et
router.post('/report-comment', verifyToken, async (req, res) => {
  try {
    const { commentId, replyId, reason, description, seriesId, chapterNumber } = req.body;
    
    // User bilgisini veritabanından al
    const User = require('../models/User');
    const user = await User.findById(req.user.id || req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }
    
    const reportedBy = user.username;

    // Aynı kullanıcının aynı yorumu zaten rapor edip etmediğini kontrol et
    const existingReport = await Report.findOne({
      commentId,
      replyId: replyId || null,
      reportedBy
    });

    if (existingReport) {
      return res.status(400).json({ error: 'Bu yorumu zaten rapor ettiniz.' });
    }

    // Yeni rapor oluştur
    const report = new Report({
      commentId,
      replyId: replyId || null,
      reportedBy,
      reason,
      description,
      seriesId,
      chapterNumber
    });

    await report.save();

    // Yorum veya yanıttaki rapor sayısını artır
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Yorum bulunamadı.' });
    }

    if (replyId) {
      // Yanıt raporlandıysa
      const reply = comment.replies.id(replyId);
      if (reply) {
        reply.reportCount = (reply.reportCount || 0) + 1;
        reply.reported = true;
      }
    } else {
      // Ana yorum raporlandıysa
      comment.reportCount = (comment.reportCount || 0) + 1;
      comment.reported = true;
    }

    await comment.save();

    res.json({ 
      success: true, 
      message: 'Rapor başarıyla gönderildi. Moderatörlerimiz en kısa sürede inceleyecek.' 
    });

  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Rapor gönderilirken hata oluştu.' });
  }
});

// Admin: Tüm raporları getir
router.get('/admin/reports', verifyToken, async (req, res) => {
  try {
    // Admin kontrolü burada yapılabilir
    // if (req.user.role !== 'admin') return res.status(403).json({ error: 'Yetkisiz' });

    const { status = 'pending', seriesId, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status !== 'all') filter.status = status;
    if (seriesId) filter.seriesId = seriesId;

    const reports = await Report.find(filter)
      .populate('commentId')
      .sort({ reportDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(filter);

    // Seri bilgilerini ekle
    const manhwaPath = require('path').join(__dirname, '../../client/data/manhwalar.json');
    const fs = require('fs').promises;
    let manhwaData = [];
    try {
      const data = await fs.readFile(manhwaPath, 'utf8');
      manhwaData = JSON.parse(data);
    } catch (error) {
      console.error('manhwalar.json okunamadı:', error);
    }

    const reportsWithDetails = reports.map(report => {
      const series = manhwaData.find(s => s.seriesId === report.seriesId);
      return {
        ...report.toObject(),
        seriesTitle: series ? series.title : report.seriesId
      };
    });

    res.json({
      reports: reportsWithDetails,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Raporlar alınamadı.' });
  }
});

// Admin: Rapor durumunu güncelle
router.put('/admin/reports/:reportId', verifyToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, action } = req.body;
    const reviewedBy = req.user.username;

    const report = await Report.findByIdAndUpdate(
      reportId,
      {
        status,
        action,
        reviewedBy,
        reviewedAt: new Date()
      },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ error: 'Rapor bulunamadı.' });
    }

    res.json({ success: true, report });

  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ error: 'Rapor güncellenemedi.' });
  }
});

// Admin: Yorum sil
router.delete('/admin/comment/:commentId', verifyToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { replyId } = req.query;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Yorum bulunamadı.' });
    }

    if (replyId) {
      // Yanıt sil
      const reply = comment.replies.id(replyId);
      if (reply) {
        reply.deleted = true;
        reply.text = '[Bu yanıt moderatör tarafından silindi]';
        await comment.save();
        res.json({ success: true, message: 'Yanıt silindi.' });
      } else {
        res.status(404).json({ error: 'Yanıt bulunamadı.' });
      }
    } else {
      // Ana yorum sil
      comment.deleted = true;
      comment.text = '[Bu yorum moderatör tarafından silindi]';
      await comment.save();
      res.json({ success: true, message: 'Yorum silindi.' });
    }

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Yorum silinemedi.' });
  }
});

// Admin: Seri bazında yorumları getir (hem ana seri hem de bölüm yorumları)
router.get('/admin/comments/:seriesId', verifyToken, async (req, res) => {
  try {
    const { seriesId } = req.params;
    const { page = 1, limit = 10, showDeleted = false } = req.query;

    // Hem ana seri yorumlarını hem de bölüm yorumlarını bul
    // Örn: seriesId = "sololeveling" 
    // Ana seri: seriesId = "sololeveling" VE chapterNumber = null
    // Bölüm yorumları: seriesId = "sololeveling" VE chapterNumber != null
    // VEYA (eski sistem için): seriesId.startsWith("sololeveling-chapter-")
    
    const filter = {
      $or: [
        { seriesId: seriesId }, // Ana seri ve yeni bölüm formatı
        { seriesId: { $regex: `^${seriesId}-chapter-` } } // Eski bölüm formatı
      ]
    };
    
    if (!showDeleted) filter.deleted = false;

    const comments = await Comment.find(filter)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Comment.countDocuments(filter);

    res.json({
      comments,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get admin comments error:', error);
    res.status(500).json({ error: 'Yorumlar alınamadı.' });
  }
});

// Rapor istatistikleri
router.get('/admin/stats', verifyToken, async (req, res) => {
  try {
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const totalReports = await Report.countDocuments();
    const reportedComments = await Comment.countDocuments({ reported: true, deleted: false });
    
    res.json({
      pendingReports,
      totalReports,
      reportedComments
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'İstatistikler alınamadı.' });
  }
});

module.exports = router;
