const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token eksik' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token geçersiz' });
    req.user = user;
    next();
  });
}

// ✅ Seriyi okundu olarak işaretle
router.post('/mark', authenticate, async (req, res) => {
  const { seriesId, lastChapter } = req.body;

  try {
    const user = await User.findById(req.user.id);

    const existing = user.readSeries.find(r => r.seriesId === seriesId);
    if (existing) {
      existing.lastChapter = lastChapter;
      existing.updatedAt = new Date();
    } else {
      user.readSeries.push({ seriesId, lastChapter });
    }

    await user.save();
    res.json({ message: 'Seri okundu olarak işaretlendi', readSeries: user.readSeries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kullanıcının okuduğu serileri getir
router.get('/my-series', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ readSeries: user.readSeries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
