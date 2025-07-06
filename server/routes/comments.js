const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');

// Bölüm-özel yorumları getir
router.get('/:seriesId/:chapterNumber', async (req, res) => {
  try {
    const { seriesId, chapterNumber } = req.params;
    const chapterNum = parseInt(chapterNumber);
    
    console.log(`🔍 [DEBUG] Chapter-specific comments request: seriesId="${seriesId}", chapterNumber=${chapterNum}`);
    
    const comments = await Comment.find({ 
      seriesId: seriesId, 
      chapterNumber: chapterNum,
      deleted: false 
    }).sort({ date: -1 });
    
    console.log(`📊 [DEBUG] Found ${comments.length} comments for ${seriesId}/chapter${chapterNum}`);
    
    // Her yorum için kullanıcının güncel avatarını ekle
    const commentsWithAvatars = await Promise.all(comments.map(async (comment) => {
      const user = await User.findOne({ username: comment.author });
      const commentObj = comment.toObject();
      commentObj.avatar = user ? user.avatar : null;
      
      // Replies için de güncel avatar ekle ve silinmiş yanıtları filtrele
      if (commentObj.replies && commentObj.replies.length > 0) {
        commentObj.replies = await Promise.all(
          commentObj.replies
            .filter(reply => !reply.deleted)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(async (reply) => {
              const replyUser = await User.findOne({ username: reply.author });
              return {
                ...reply,
                avatar: replyUser ? replyUser.avatar : null
              };
            })
        );
      }
      
      return commentObj;
    }));
    
    res.json(commentsWithAvatars);
  } catch (error) {
    console.error('Chapter comments fetch error:', error);
    res.status(500).json({ error: 'Yorumlar getirilemedi' });
  }
});

// Tüm seri yorumlarını getir (eski endpoint)
router.get('/:seriesId', async (req, res) => {
  try {
    console.log(`🔍 [DEBUG] Series-wide comments request: seriesId="${req.params.seriesId}"`);
    
    const comments = await Comment.find({ seriesId: req.params.seriesId, deleted: false })
      .sort({ date: -1 });
    
    console.log(`📊 [DEBUG] Found ${comments.length} series-wide comments for ${req.params.seriesId}`);
    
    // Her yorum için kullanıcının güncel avatarını ekle
    const commentsWithAvatars = await Promise.all(comments.map(async (comment) => {
      const user = await User.findOne({ username: comment.author });
      const commentObj = comment.toObject();
      commentObj.avatar = user ? user.avatar : null;
      
      // Replies için de güncel avatar ekle ve silinmiş yanıtları filtrele
      if (commentObj.replies && commentObj.replies.length > 0) {
        commentObj.replies = await Promise.all(
          commentObj.replies
            .filter(reply => !reply.deleted) // Silinmiş yanıtları filtrele
            .sort((a, b) => new Date(a.date) - new Date(b.date)) // Yanıtları tarih sırasına göre sırala (eski -> yeni)
            .map(async (reply) => {
              const replyUser = await User.findOne({ username: reply.author });
              return {
                ...reply,
                avatar: replyUser ? replyUser.avatar : null
              };
            })
        );
      }
      
      return commentObj;
    }));
    
    res.json(commentsWithAvatars);
  } catch (err) {
    res.status(500).json({ error: 'Yorumlar alınamadı.' });
  }
});

// Yorum ekle
router.post('/', verifyToken, async (req, res) => {
  try {
    const { seriesId, text, chapterNumber } = req.body; // chapterNumber eklendi
    if (!text || !seriesId) {
      return res.status(400).json({ error: 'Eksik veri.' });
    }
    
    // Token'dan gelen user ID ile kullanıcı bilgilerini çek
    const user = await User.findById(req.user.id || req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }
    
    const comment = new Comment({
      seriesId,
      chapterNumber: chapterNumber || null, // Opsiyonel
      author: user.username,
      text
    });
    
    await comment.save();
    
    // Response'a güncel avatar ekle
    const commentResponse = comment.toObject();
    commentResponse.avatar = user.avatar;
    
    res.status(201).json(commentResponse);
  } catch (err) {
    console.error('POST /api/comments - Error:', err);
    res.status(500).json({ error: 'Yorum eklenemedi.', details: err.message });
  }
});

// Yorum sil (sadece sahibi)
router.delete('/:commentId', verifyToken, async (req, res) => {
  try {
    // Token'dan kullanıcı bilgilerini çek
    const user = await User.findById(req.user.id || req.userId);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Yorum bulunamadı.' });
    if (comment.author !== user.username) return res.status(403).json({ error: 'Yetkisiz.' });
    comment.deleted = true;
    await comment.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Yorum silinemedi.' });
  }
});

// Yorum düzenle (sadece sahibi)
router.put('/:commentId', verifyToken, async (req, res) => {
  try {
    // Token'dan kullanıcı bilgilerini çek
    const userData = await User.findById(req.user.id || req.userId);
    if (!userData) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Yorum metni boş olamaz.' });
    
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Yorum bulunamadı.' });
    if (comment.author !== userData.username) return res.status(403).json({ error: 'Bu yorumu düzenleme yetkiniz yok.' });
    
    comment.text = text;
    comment.edited = true;
    comment.editedAt = new Date();
    await comment.save();
    
    // Response'a güncel avatar ekle
    const commentResponse = comment.toObject();
    commentResponse.avatar = userData.avatar;
    
    res.json(commentResponse);
  } catch (err) {
    res.status(500).json({ error: 'Yorum düzenlenemedi.' });
  }
});

// Yorum beğen/dislike
router.post('/:commentId/like', verifyToken, async (req, res) => {
  try {
    // Token'dan kullanıcı bilgilerini çek
    const userData = await User.findById(req.user.id || req.userId);
    if (!userData) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    
    const { like } = req.body; // like: true (beğen), false (dislike)
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Yorum bulunamadı.' });
    const user = userData.username;
    if (like) {
      if (!comment.likedBy.includes(user)) {
        comment.likedBy.push(user);
        comment.likes++;
        // Dislike varsa kaldır
        comment.dislikedBy = comment.dislikedBy.filter(u => u !== user);
        comment.dislikes = Math.max(0, comment.dislikes - 1);
      }
    } else {
      if (!comment.dislikedBy.includes(user)) {
        comment.dislikedBy.push(user);
        comment.dislikes++;
        // Like varsa kaldır
        comment.likedBy = comment.likedBy.filter(u => u !== user);
        comment.likes = Math.max(0, comment.likes - 1);
      }
    }
    await comment.save();
    res.json({ likes: comment.likes, dislikes: comment.dislikes });
  } catch (err) {
    res.status(500).json({ error: 'İşlem başarısız.' });
  }
});

// Yorumlara cevap ekle
router.post('/:commentId/reply', verifyToken, async (req, res) => {
  try {
    // Token'dan kullanıcı bilgilerini çek
    const userData = await User.findById(req.user.id || req.userId);
    if (!userData) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    
    const { text } = req.body; // avatar artık gerekli değil
    if (!text) return res.status(400).json({ error: 'Cevap boş olamaz.' });
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Yorum bulunamadı.' });
    
    const newReply = {
      author: userData.username,
      text
    };
    
    comment.replies.push(newReply); // unshift yerine push - yeni yanıtlar en alta
    await comment.save();
    
    // Response'a güncel avatar ekle
    const replyResponse = {
      ...newReply,
      avatar: userData.avatar,
      date: new Date()
    };
    
    res.status(201).json(replyResponse);
  } catch (err) {
    res.status(500).json({ error: 'Cevap eklenemedi.' });
  }
});

// Yanıt sil (sadece sahibi)
router.delete('/:commentId/reply/:replyId', verifyToken, async (req, res) => {
  try {
    // Token'dan kullanıcı bilgilerini çek
    const userData = await User.findById(req.user.id || req.userId);
    if (!userData) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Yorum bulunamadı.' });
    
    const reply = comment.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ error: 'Yanıt bulunamadı.' });
    
    // Sadece yanıt sahibi silebilir
    if (reply.author !== userData.username) {
      return res.status(403).json({ error: 'Bu yanıtı silme yetkiniz yok.' });
    }
    
    reply.deleted = true;
    await comment.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Yanıt silinemedi.' });
  }
});

// Yanıt düzenle (sadece sahibi)
router.put('/:commentId/reply/:replyId', verifyToken, async (req, res) => {
  try {
    // Token'dan kullanıcı bilgilerini çek
    const userData = await User.findById(req.user.id || req.userId);
    if (!userData) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Yanıt metni boş olamaz.' });
    
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Yorum bulunamadı.' });
    
    const reply = comment.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ error: 'Yanıt bulunamadı.' });
    
    // Sadece yanıt sahibi düzenleyebilir
    if (reply.author !== userData.username) {
      return res.status(403).json({ error: 'Bu yanıtı düzenleme yetkiniz yok.' });
    }
    
    reply.text = text;
    reply.edited = true;
    reply.editedAt = new Date();
    await comment.save();
    
    // Response'a güncel avatar ekle
    const replyResponse = {
      ...reply.toObject(),
      avatar: userData.avatar
    };
    
    res.json(replyResponse);
  } catch (err) {
    res.status(500).json({ error: 'Yanıt düzenlenemedi.' });
  }
});

module.exports = router;
