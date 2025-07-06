const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');
const { getTopRatedSeries } = require('../controllers/ratingsController');

// Puan verme
router.post('/', verifyToken, async (req, res) => {
  const { seriesId, score } = req.body;

  if (score < 1 || score > 5) {
    return res.status(400).json({ error: 'Puan 1 ile 5 arasında olmalı.' });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }
    
    if (!user.ratings) {
      user.ratings = [];
    }
    
    const existingRating = user.ratings.find(r => r.seriesId === seriesId);

    if (existingRating) {
      existingRating.score = score; // güncelle
    } else {
      user.ratings.push({ seriesId, score });
    }

    await user.save();
    res.json({ message: 'Puan kaydedildi!', ratings: user.ratings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Belirli bir serinin ortalama puanını döndür
router.get('/:seriesId/average', async (req, res) => {
  const { seriesId } = req.params;
  console.log('🎯 BACKEND: Average rating isteği geldi, seriesId:', seriesId);

  try {
    // Tüm kullanıcıları bul ve puanlarını filtrele
    const users = await User.find({ 'ratings.seriesId': seriesId });
    console.log('📊 BACKEND: Kullanıcılar bulundu, sayı:', users.length);

    const allScores = users.flatMap(user => 
      user.ratings
        .filter(r => r.seriesId === seriesId)
        .map(r => r.score)
    );
    console.log('⭐ BACKEND: Puanlar:', allScores);

    if (allScores.length === 0) {
      console.log('⚠️ BACKEND: Hiç puan yok, null döndürülüyor');
      return res.json({ average: null, count: 0 });
    }

    const sum = allScores.reduce((a, b) => a + b, 0);
    const average = (sum / allScores.length).toFixed(2);

    const result = { average: parseFloat(average), count: allScores.length };
    console.log('✅ BACKEND: Sonuç döndürülüyor:', result);
    res.json(result);
  } catch (err) {
    console.error('💥 BACKEND: Hata:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// En yüksek oy ortalamasına göre sıralama
router.get('/top', getTopRatedSeries);

module.exports = router;
