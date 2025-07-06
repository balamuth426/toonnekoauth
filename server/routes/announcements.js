const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const verifyToken = require('../middleware/verifyToken');

// --- RESTful API ---

// Test endpoint
router.get('/test', (req, res) => {
  console.log('🧪 TEST endpoint called!');
  res.json({ success: true, message: 'Test endpoint works!' });
});

// Aktif duyuruyu tekil döndür (herkese açık) - önce tanımlanmalı
router.get('/active', async (req, res) => {
  console.log('🎯 /active endpoint called - FIRST DEFINITION');
  console.log('🔍 Request URL:', req.url);
  console.log('🔍 Request path:', req.path);
  try {
    const list = await Announcement.getActiveAnnouncements();
    console.log('✅ Active announcements found:', list.length);
    res.json({ success: true, announcement: list[0] || null });
  } catch (error) {
    console.error('❌ Active announcement error:', error);
    res.status(500).json({ success: false, message: 'Aktif duyuru alınamadı.' });
  }
});

// Tüm duyuruları getir (admin)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, filter = 'all' } = req.query;
    const query = {};
    if (filter === 'active') query.isActive = true;
    if (filter === 'inactive') query.isActive = false;
    const total = await Announcement.countDocuments(query);
    const announcements = await Announcement.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    res.json({
      success: true,
      announcements,
      pagination: {
        total,
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Duyurular yüklenemedi.' });
  }
});

// Tek duyuru getir (admin)
router.get('/:id', verifyToken, async (req, res) => {
  console.log('🎯 /:id endpoint called with id:', req.params.id);
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: 'Duyuru bulunamadı.' });
    res.json({ success: true, announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Duyuru getirilemedi.' });
  }
});

// Yeni duyuru oluştur (admin)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, content, type, isActive } = req.body;
    const User = require('../models/User');
    const user = await User.findById(req.user.id || req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
    const announcement = new Announcement({
      title,
      content,
      type: type || 'info',
      isActive: isActive !== undefined ? isActive : true,
      createdBy: user.username
    });
    await announcement.save();
    res.status(201).json({ success: true, announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Duyuru oluşturulamadı.' });
  }
});

// Duyuru güncelle (admin)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { title, content, type, isActive } = req.body;
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { title, content, type, isActive, updatedAt: new Date() },
      { new: true }
    );
    if (!announcement) return res.status(404).json({ success: false, message: 'Duyuru bulunamadı.' });
    res.json({ success: true, announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Duyuru güncellenemedi.' });
  }
});

// Duyuru sil (admin)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: 'Duyuru bulunamadı.' });
    res.json({ success: true, message: 'Duyuru silindi.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Duyuru silinemedi.' });
  }
});

// Duyuru aktif/pasif toggle (admin)
router.patch('/:id/toggle', verifyToken, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: 'Duyuru bulunamadı.' });
    announcement.isActive = !announcement.isActive;
    announcement.updatedAt = new Date();
    await announcement.save();
    res.json({ success: true, announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Duyuru durumu değiştirilemedi.' });
  }
});

module.exports = router;
