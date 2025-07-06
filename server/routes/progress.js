const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware: Token kontrolü
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// API: Kullanıcının kaldığı bölümü kaydet
router.post('/save', authenticateToken, async (req, res) => {
  const { seriesId, chapter } = req.body;

  try {
    const user = await User.findById(req.user.id);

    const existingProgress = user.readingProgress.find(p => p.seriesId === seriesId);
    
    if (existingProgress) {
      existingProgress.chapter = chapter; // güncelle
    } else {
      user.readingProgress.push({ seriesId, chapter }); // yeni ekle
    }

    await user.save();
    res.json({ message: 'Kaldığın bölüm kaydedildi!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kullanıcının bir seride kaldığı bölümü getir
router.get('/get/:seriesId', authenticateToken, async (req, res) => {
  const { seriesId } = req.params;

  try {
    const user = await User.findById(req.user.id);
    const progress = user.readingProgress.find(p => p.seriesId === seriesId);
    if (progress) {
      res.json({ seriesId, chapter: progress.chapter });
    } else {
      res.json({ message: 'Henüz bu seride ilerleme kaydedilmedi.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kullanıcının okuduğu tüm serileri listele
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const list = user.readingProgress.map(p => ({
      seriesId: p.seriesId,
      chapter: p.chapter
    }));
    res.json({ readingList: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
