const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');

// Tüm kullanıcıları getir (admin paneli için)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error('Kullanıcıları getirme hatası:', error);
    res.status(500).json({ error: 'Kullanıcıları getirme hatası' });
  }
};

// Kullanıcıyı moderatör yap
const makeModerator = async (req, res) => {
  try {
    const { userId, seriesIds } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Kullanıcı ID gerekli' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    if (user.isAdmin) {
      return res.status(400).json({ error: 'Admin kullanıcılar moderatör yapılamaz' });
    }
    
    // Kullanıcıyı moderatör yap ve serileri ata
    user.isModerator = true;
    user.moderatorSeries = seriesIds || [];
    
    await user.save();
    
    res.json({ 
      message: 'Kullanıcı başarıyla moderatör yapıldı',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isModerator: user.isModerator,
        moderatorSeries: user.moderatorSeries
      }
    });
  } catch (error) {
    console.error('Moderatör yapma hatası:', error);
    res.status(500).json({ error: 'Moderatör yapma hatası' });
  }
};

// Moderatör yetkilerini güncelle
const updateModeratorSeries = async (req, res) => {
  try {
    const { userId, seriesIds } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Kullanıcı ID gerekli' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    if (!user.isModerator) {
      return res.status(400).json({ error: 'Bu kullanıcı moderatör değil' });
    }
    
    user.moderatorSeries = seriesIds || [];
    await user.save();
    
    res.json({ 
      message: 'Moderatör serileri başarıyla güncellendi',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isModerator: user.isModerator,
        moderatorSeries: user.moderatorSeries
      }
    });
  } catch (error) {
    console.error('Moderatör serileri güncelleme hatası:', error);
    res.status(500).json({ error: 'Moderatör serileri güncelleme hatası' });
  }
};

// Moderatör yetkilerini kaldır
const removeModerator = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Kullanıcı ID gerekli' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    user.isModerator = false;
    user.moderatorSeries = [];
    
    await user.save();
    
    res.json({ 
      message: 'Moderatör yetkileri başarıyla kaldırıldı',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isModerator: user.isModerator,
        moderatorSeries: user.moderatorSeries
      }
    });
  } catch (error) {
    console.error('Moderatör kaldırma hatası:', error);
    res.status(500).json({ error: 'Moderatör kaldırma hatası' });
  }
};

// Tüm moderatörleri getir
const getModerators = async (req, res) => {
  try {
    const moderators = await User.find({ isModerator: true }, '-password')
      .sort({ createdAt: -1 });
    
    res.json(moderators);
  } catch (error) {
    console.error('Moderatörleri getirme hatası:', error);
    res.status(500).json({ error: 'Moderatörleri getirme hatası' });
  }
};

// Mevcut serileri getir (moderatör atama için)
const getAvailableSeries = async (req, res) => {
  try {
    const dataPath = path.join(__dirname, '../../client/data/manhwalar.json');
    const data = await fs.readFile(dataPath, 'utf8');
    const manhwalar = JSON.parse(data);
    
    // Sadece seri adı ve ID'sini döndür
    const seriesList = manhwalar.map(series => ({
      id: series.seriesId,
      title: series.title || series.name,
      status: series.status
    }));
    
    res.json(seriesList);
  } catch (error) {
    console.error('Serileri getirme hatası:', error);
    res.status(500).json({ error: 'Serileri getirme hatası' });
  }
};

module.exports = {
  getAllUsers,
  makeModerator,
  updateModeratorSeries,
  removeModerator,
  getModerators,
  getAvailableSeries
};
