const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// Kullanıcının favorilerini getir
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json({ 
      success: true, 
      favorites: user.favorites || [] 
    });
  } catch (error) {
    console.error('Favoriler getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Favorilere seri ekle
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { seriesName } = req.body;
    
    if (!seriesName) {
      return res.status(400).json({ message: 'Seri adı gerekli' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Favoriler listesi yoksa oluştur
    if (!user.favorites) {
      user.favorites = [];
    }

    // Zaten favorilerde var mı kontrol et
    if (user.favorites.includes(seriesName)) {
      return res.status(400).json({ message: 'Seri zaten favorilerde' });
    }

    // Favorilere ekle
    user.favorites.push(seriesName);
    await user.save();

    res.json({ 
      success: true, 
      message: 'Seri favorilere eklendi',
      favorites: user.favorites
    });
  } catch (error) {
    console.error('Favorilere ekleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Favorilerden seri çıkar
router.post('/remove', verifyToken, async (req, res) => {
  try {
    const { seriesName } = req.body;
    
    if (!seriesName) {
      return res.status(400).json({ message: 'Seri adı gerekli' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Favoriler listesi yoksa boş liste oluştur
    if (!user.favorites) {
      user.favorites = [];
    }

    // Favorilerden çıkar
    const index = user.favorites.indexOf(seriesName);
    if (index > -1) {
      user.favorites.splice(index, 1);
      await user.save();
      
      res.json({ 
        success: true, 
        message: 'Seri favorilerden çıkarıldı',
        favorites: user.favorites
      });
    } else {
      res.status(400).json({ message: 'Seri favorilerde bulunamadı' });
    }
  } catch (error) {
    console.error('Favorilerden çıkarma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Favorileri toggle et (ekle/çıkar)
router.post('/toggle', verifyToken, async (req, res) => {
  try {
    const { seriesName } = req.body;
    
    if (!seriesName) {
      return res.status(400).json({ message: 'Seri adı gerekli' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Favoriler listesi yoksa oluştur
    if (!user.favorites) {
      user.favorites = [];
    }

    const index = user.favorites.indexOf(seriesName);
    let isAdded = false;
    
    if (index > -1) {
      // Favorilerden çıkar
      user.favorites.splice(index, 1);
      isAdded = false;
    } else {
      // Favorilere ekle
      user.favorites.push(seriesName);
      isAdded = true;
    }

    await user.save();

    res.json({ 
      success: true, 
      isAdded,
      message: isAdded ? 'Seri favorilere eklendi' : 'Seri favorilerden çıkarıldı',
      favorites: user.favorites
    });
  } catch (error) {
    console.error('Favori toggle hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
