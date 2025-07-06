const User = require('../models/User');

// Moderatör doğrulama middleware'i
const verifyModerator = async (req, res, next) => {
  try {
    // TEST MODU kontrolü
    const testMode = false; // Production mode - gerçek moderatör kontrolü
    
    if (testMode) {
      console.log('Moderatör middleware: TEST MODU - admin olarak geçiliyor');
      req.moderatorUser = { 
        _id: 'test-moderator-id',
        username: 'test-moderator', 
        email: 'test@moderator.com',
        isAdmin: true,
        isModerator: true,
        moderatorSeries: ['blackcrow', 'sololeveling'],
        createdAt: new Date()
      };
      req.user = { userId: 'test-moderator-id' };
      next();
      return;
    }
    
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    if (user.isBlocked) {
      return res.status(403).json({ error: 'Hesabınız engellenmiş' });
    }
    
    // Admin veya moderatör olmalı
    if (!user.isAdmin && !user.isModerator) {
      return res.status(403).json({ error: 'Moderatör veya admin yetkisi gerekli' });
    }
    
    req.moderatorUser = user;
    next();
  } catch (error) {
    console.error('Moderatör doğrulama hatası:', error);
    res.status(500).json({ error: 'Moderatör doğrulama hatası' });
  }
};

// Belirli seri için moderatör yetkisi kontrolü
const verifySeriesModerator = (seriesId) => {
  return async (req, res, next) => {
    try {
      if (!req.moderatorUser) {
        return res.status(401).json({ error: 'Moderatör doğrulaması gerekli' });
      }
      
      const user = req.moderatorUser;
      
      // Admin her seriye erişebilir
      if (user.isAdmin) {
        next();
        return;
      }
      
      // Moderatör sadece atanmış serilerine erişebilir
      if (!user.isModerator) {
        return res.status(403).json({ error: 'Moderatör yetkisi gerekli' });
      }
      
      // req.params'dan seriesId alınabilir
      const targetSeriesId = seriesId || req.params.seriesId || req.body.seriesId;
      
      if (!targetSeriesId) {
        return res.status(400).json({ error: 'Seri ID gerekli' });
      }
      
      if (!user.moderatorSeries.includes(targetSeriesId)) {
        return res.status(403).json({ error: 'Bu seri için moderatör yetkiniz yok' });
      }
      
      next();
    } catch (error) {
      console.error('Seri moderatör doğrulama hatası:', error);
      res.status(500).json({ error: 'Seri moderatör doğrulama hatası' });
    }
  };
};

module.exports = {
  verifyModerator,
  verifySeriesModerator
};
