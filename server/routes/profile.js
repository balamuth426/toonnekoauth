const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// Kullanıcı profil bilgilerini getir
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json({
      success: true,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      favorites: user.favorites || [],
      avatar: user.avatar || '',
      ratings: user.ratings || []
    });
  } catch (error) {
    console.error('Profil bilgileri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Profil bilgilerini güncelle
router.post('/update', verifyToken, async (req, res) => {
  try {
    console.log('=== AVATAR UPDATE REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body));
    console.log('User ID:', req.userId);
    const { username, email, avatar } = req.body;
    console.log('Extracted avatar:', avatar);

    // Sadece avatar güncellemesi yapılacaksa username/email zorunlu olmasın
    if (!username && !email && avatar) {
      console.log('Avatar-only update detected');
      // Sadece avatar güncelle
      const allowedAvatars = [
        'bunnygirl.png',
        'catboy.png',
        'foxboy.png',
        'mangagirl.png',
        'witchelf.png',
        'wizardboy.png'
      ];
      console.log('Allowed avatars:', allowedAvatars);
      console.log('Avatar check:', avatar, 'in allowed?', allowedAvatars.includes(avatar));
      
      if (!allowedAvatars.includes(avatar)) {
        console.log('Avatar validation failed!');
        return res.status(400).json({ message: 'Geçersiz avatar seçimi' });
      }
      
      console.log('Updating user avatar...');
      const updatedUser = await User.findByIdAndUpdate(
        req.userId,
        { avatar },
        { new: true }
      ).select('-password');
      
      console.log('Update successful, returning response');
      return res.json({
        success: true,
        message: 'Avatar güncellendi',
        user: {
          username: updatedUser.username,
          email: updatedUser.email,
          createdAt: updatedUser.createdAt,
          avatar: updatedUser.avatar || ''
        }
      });
    }

    // Eğer username/email güncelleniyorsa eski validasyonlar devam etsin
    if (!username || !email) {
      return res.status(400).json({ message: 'Kullanıcı adı ve e-posta gerekli' });
    }

    // E-posta zaten kullanılıyor mu kontrol et (kendi e-postası hariç)
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: req.userId } 
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor' });
    }
    // Kullanıcı adı zaten kullanılıyor mu kontrol et (kendi kullanıcı adı hariç)
    const existingUsername = await User.findOne({ 
      username, 
      _id: { $ne: req.userId } 
    });
    if (existingUsername) {
      return res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
    }
    // Avatar kontrolü (isteğe bağlı, sadece 6 avatar)
    const allowedAvatars = [
      'bunnygirl.png',
      'catboy.png',
      'foxboy.png',
      'mangagirl.png',
      'witchelf.png',
      'wizardboy.png'
    ];
    let avatarToSet = undefined;
    if (avatar && allowedAvatars.includes(avatar)) {
      avatarToSet = avatar;
    }
    // Kullanıcı bilgilerini güncelle
    const updateFields = { username, email };
    if (avatarToSet) updateFields.avatar = avatarToSet;
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      updateFields,
      { new: true }
    ).select('-password');
    res.json({
      success: true,
      message: 'Profil bilgileri güncellendi',
      user: {
        username: updatedUser.username,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt,
        avatar: updatedUser.avatar || ''
      }
    });
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Hesabı sil
router.delete('/delete', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    await User.findByIdAndDelete(req.userId);

    res.json({
      success: true,
      message: 'Hesap başarıyla silindi'
    });
  } catch (error) {
    console.error('Hesap silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
