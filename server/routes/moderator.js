const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { verifyModerator, verifySeriesModerator } = require('../middleware/verifyModerator');
const fs = require('fs').promises;
const path = require('path');
const { 
  getSeriesFolderName, 
  getSeriesDisplayName, 
  isValidSeriesId, 
  validateChapterData 
} = require('../utils/seriesHelper');

// Moderatörün yönettiği serileri getir
router.get('/my-series', verifyToken, verifyModerator, async (req, res) => {
  try {
    const user = req.moderatorUser;
    
    if (user.isAdmin) {
      // Admin tüm serileri görebilir
      const dataPath = path.join(__dirname, '../../client/data/manhwalar.json');
      const data = await fs.readFile(dataPath, 'utf8');
      const manhwalar = JSON.parse(data);
      
      return res.json({
        userType: 'admin',
        series: manhwalar.map(series => ({
          id: series.seriesId,
          title: series.title || series.name,
          status: series.status,
          author: series.author,
          artist: series.artist,
          publisher: series.publisher,
          summary: series.summary,
          genres: series.genres,
          image: series.image,
          label: series.label,
          chapters: series.chapters || []
        }))
      });
    }
    
    if (user.isModerator) {
      // Moderatör sadece atanmış serileri görebilir
      const dataPath = path.join(__dirname, '../../client/data/manhwalar.json');
      const data = await fs.readFile(dataPath, 'utf8');
      const manhwalar = JSON.parse(data);
      
      const moderatorSeries = manhwalar.filter(series => 
        user.moderatorSeries.includes(series.seriesId)
      );
      
      return res.json({
        userType: 'moderator',
        assignedSeries: user.moderatorSeries,
        series: moderatorSeries.map(series => ({
          id: series.seriesId,
          title: series.title || series.name,
          status: series.status,
          author: series.author,
          artist: series.artist,
          publisher: series.publisher,
          summary: series.summary,
          genres: series.genres,
          image: series.image,
          label: series.label,
          chapters: series.chapters || []
        }))
      });
    }
    
    res.status(403).json({ error: 'Yetkisiz erişim' });
  } catch (error) {
    console.error('Moderatör serileri getirme hatası:', error);
    res.status(500).json({ error: 'Moderatör serileri getirilemedi' });
  }
});

// Belirli bir seri için moderatör yetkisi kontrolü
router.get('/check-series-permission/:seriesId', verifyToken, verifyModerator, async (req, res) => {
  try {
    const { seriesId } = req.params;
    const user = req.moderatorUser;
    
    let hasPermission = false;
    
    if (user.isAdmin) {
      hasPermission = true;
    } else if (user.isModerator && user.moderatorSeries.includes(seriesId)) {
      hasPermission = true;
    }
    
    res.json({ hasPermission, seriesId });
  } catch (error) {
    console.error('Seri yetkisi kontrol hatası:', error);
    res.status(500).json({ error: 'Yetki kontrolü başarısız' });
  }
});

// Belirli bir seriyi getir
router.get('/series/:seriesId', verifyToken, verifyModerator, async (req, res) => {
  try {
    const { seriesId } = req.params;
    const user = req.moderatorUser;
    
    // Yetkiyi kontrol et
    if (!user.isAdmin && (!user.isModerator || !user.moderatorSeries.includes(seriesId))) {
      return res.status(403).json({ error: 'Bu seri için yetkiniz yok' });
    }
    
    const dataPath = path.join(__dirname, '../../client/data/manhwalar.json');
    const data = await fs.readFile(dataPath, 'utf8');
    const manhwalar = JSON.parse(data);
    
    const series = manhwalar.find(s => s.seriesId === seriesId);
    if (!series) {
      return res.status(404).json({ error: 'Seri bulunamadı' });
    }
    
    res.json(series);
  } catch (error) {
    console.error('Seri getirme hatası:', error);
    res.status(500).json({ error: 'Seri getirilemedi' });
  }
});

// Moderatör profil bilgisi
router.get('/profile', verifyToken, verifyModerator, async (req, res) => {
  try {
    const user = req.moderatorUser;
    res.json({
      username: user.username,
      isAdmin: user.isAdmin,
      isModerator: user.isModerator,
      moderatorSeries: user.moderatorSeries || []
    });
  } catch (error) {
    console.error('Moderatör profil hatası:', error);
    res.status(500).json({ error: 'Profil bilgisi alınamadı' });
  }
});

// Seri güncelle
router.put('/update-series/:seriesId', verifyToken, verifyModerator, async (req, res) => {
  try {
    const { seriesId } = req.params;
    const user = req.moderatorUser;
    
    // Yetkiyi kontrol et
    if (!user.isAdmin && (!user.isModerator || !user.moderatorSeries.includes(seriesId))) {
      return res.status(403).json({ error: 'Bu seri için yetkiniz yok' });
    }
    
    const { title, author, artist, summary, genres, status, image } = req.body;
    
    const dataPath = path.join(__dirname, '../../client/data/manhwalar.json');
    const data = await fs.readFile(dataPath, 'utf8');
    const manhwalar = JSON.parse(data);
    
    const seriesIndex = manhwalar.findIndex(s => s.seriesId === seriesId);
    if (seriesIndex === -1) {
      return res.status(404).json({ error: 'Seri bulunamadı' });
    }
    
    // Güncelle
    if (title) manhwalar[seriesIndex].title = title;
    if (author) manhwalar[seriesIndex].author = author;
    if (artist) manhwalar[seriesIndex].artist = artist;
    if (summary) manhwalar[seriesIndex].summary = summary;
    if (genres) manhwalar[seriesIndex].genres = genres;
    if (status) manhwalar[seriesIndex].status = status;
    if (image) manhwalar[seriesIndex].image = image;
    
    // Kaydet
    await fs.writeFile(dataPath, JSON.stringify(manhwalar, null, 2));
    
    res.json({ success: true, message: 'Seri başarıyla güncellendi' });
  } catch (error) {
    console.error('Seri güncelleme hatası:', error);
    res.status(500).json({ error: 'Seri güncellenemedi' });
  }
});

// Bölüm ekle
router.post('/add-chapter/:seriesId', verifyToken, verifyModerator, async (req, res) => {
  try {
    const { seriesId } = req.params;
    const { chapterNumber, title, content, imageFolder } = req.body;
    const user = req.moderatorUser;
    
    console.log(`📝 Moderatör ${user.username} ${seriesId} serisine bölüm ${chapterNumber} ekliyor`);
    
    // Yetkiyi kontrol et
    if (!user.isAdmin && (!user.isModerator || !user.moderatorSeries.includes(seriesId))) {
      return res.status(403).json({ error: 'Bu seri için yetkiniz yok' });
    }
    
    // Validasyon
    if (!chapterNumber || !title || !content) {
      return res.status(400).json({ error: 'Eksik bölüm bilgileri' });
    }
    
    const dataPath = path.join(__dirname, '../../client/data/manhwalar.json');
    const data = await fs.readFile(dataPath, 'utf8');
    const manhwalar = JSON.parse(data);
    
    const seriesIndex = manhwalar.findIndex(s => s.seriesId === seriesId);
    if (seriesIndex === -1) {
      return res.status(404).json({ error: 'Seri bulunamadı' });
    }
    
    const series = manhwalar[seriesIndex];
    
    // Bölüm zaten var mı kontrol et
    const existingChapter = series.chapters.find(c => c.number === parseInt(chapterNumber));
    if (existingChapter) {
      return res.status(400).json({ error: 'Bu bölüm zaten mevcut' });
    }
    
    // Yeni bölümü ekle
    const newChapter = {
      number: parseInt(chapterNumber),
      title: title,
      content: content,
      addedBy: user.username,
      addedAt: new Date().toISOString()
    };
    
    if (imageFolder) {
      newChapter.imageFolder = imageFolder;
    }
    
    series.chapters.push(newChapter);
    
    // Chapter details güncelle (eski format uyumluluğu için)
    if (!series.chapterDetails) {
      series.chapterDetails = [];
    }
    
    const chapterDetail = {
      number: parseInt(chapterNumber),
      title: title,
      date: new Date().toLocaleDateString('tr-TR'),
      path: `chapters/${getSeriesFolderName(seriesId)}/bölüm${chapterNumber}.html`
    };
    
    series.chapterDetails.push(chapterDetail);
    
    // Chapter details'i sırala
    series.chapterDetails.sort((a, b) => a.number - b.number);
    
    // 🚀 YENİ ÖZELLİK: Seriyi en başa getir (Son Yüklenenler için)
    // Güncellenen seriyi diziden çıkar ve en başa ekle
    const updatedSeries = manhwalar.splice(seriesIndex, 1)[0];
    manhwalar.unshift(updatedSeries);
    console.log(`📌 ${series.title} serisi listenin en başına taşındı (Moderator)`);
    
    // Fiziksel HTML dosyasını oluştur
    const folderName = getSeriesFolderName(seriesId);
    const chapterDir = path.join(__dirname, '../../client/chapters', folderName);
    const chapterFile = path.join(chapterDir, `bölüm${chapterNumber}.html`);
    
    // Klasör yoksa oluştur
    try {
      await fs.access(chapterDir);
    } catch (error) {
      await fs.mkdir(chapterDir, { recursive: true });
      console.log(`📁 Bölüm klasörü oluşturuldu: ${chapterDir}`);
    }
    
    // HTML dosyasını oluştur
    await fs.writeFile(chapterFile, content, 'utf8');
    console.log(`📄 Bölüm dosyası oluşturuldu: ${chapterFile}`);
    
    // Resim klasörünü oluştur
    if (imageFolder) {
      const imagesDir = path.join(__dirname, '../../client/images/bölümler', 
        folderName.replace(' chapters', ''), `bölüm${chapterNumber}`);
      try {
        await fs.mkdir(imagesDir, { recursive: true });
        console.log(`🖼️  Resim klasörü oluşturuldu: ${imagesDir}`);
      } catch (error) {
        console.warn(`⚠️  Resim klasörü oluşturulamadı: ${error.message}`);
      }
    }
    
    // Dosyaya kaydet
    await fs.writeFile(dataPath, JSON.stringify(manhwalar, null, 2));
    
    res.json({
      success: true,
      message: `Bölüm ${chapterNumber} başarıyla eklendi`,
      chapter: newChapter
    });
  } catch (error) {
    console.error('Bölüm ekleme hatası:', error);
    res.status(500).json({ error: 'Bölüm eklenemedi: ' + error.message });
  }
});

// Bölüm güncelle
router.put('/update-chapter/:seriesId/:chapterNumber', verifyToken, verifyModerator, async (req, res) => {
  try {
    const { seriesId, chapterNumber } = req.params;
    const { title, content } = req.body;
    const user = req.moderatorUser;
    
    // Yetkiyi kontrol et
    if (!user.isAdmin && (!user.isModerator || !user.moderatorSeries.includes(seriesId))) {
      return res.status(403).json({ error: 'Bu seri için yetkiniz yok' });
    }
    
    const dataPath = path.join(__dirname, '../../client/data/manhwalar.json');
    const data = await fs.readFile(dataPath, 'utf8');
    const manhwalar = JSON.parse(data);
    
    const series = manhwalar.find(s => s.seriesId === seriesId);
    if (!series) {
      return res.status(404).json({ error: 'Seri bulunamadı' });
    }
    
    const chapterIndex = series.chapters.findIndex(c => c.number === parseInt(chapterNumber));
    if (chapterIndex === -1) {
      return res.status(404).json({ error: 'Bölüm bulunamadı' });
    }
    
    // Güncelle
    if (title) series.chapters[chapterIndex].title = title;
    if (content) {
      series.chapters[chapterIndex].content = content;
      
      // Fiziksel dosyayı da güncelle
      const folderName = getSeriesFolderName(seriesId);
      const chapterFile = path.join(__dirname, '../../client/chapters', folderName, `bölüm${chapterNumber}.html`);
      await fs.writeFile(chapterFile, content, 'utf8');
    }
    
    // Chapter details'i de güncelle
    if (series.chapterDetails) {
      const chapterDetailIndex = series.chapterDetails.findIndex(c => c.number === parseInt(chapterNumber));
      if (chapterDetailIndex !== -1 && title) {
        series.chapterDetails[chapterDetailIndex].title = title;
      }
    }
    
    // Kaydet
    await fs.writeFile(dataPath, JSON.stringify(manhwalar, null, 2));
    
    res.json({ success: true, message: 'Bölüm başarıyla güncellendi' });
  } catch (error) {
    console.error('Bölüm güncelleme hatası:', error);
    res.status(500).json({ error: 'Bölüm güncellenemedi' });
  }
});

// Bölüm sil
router.delete('/delete-chapter/:seriesId/:chapterNumber', verifyToken, verifyModerator, async (req, res) => {
  try {
    const { seriesId, chapterNumber } = req.params;
    const user = req.moderatorUser;
    
    console.log(`🗑️ Moderatör ${user.username} ${seriesId} serisinden bölüm ${chapterNumber} siliyor`);
    
    // Yetkiyi kontrol et
    if (!user.isAdmin && (!user.isModerator || !user.moderatorSeries.includes(seriesId))) {
      return res.status(403).json({ error: 'Bu seri için yetkiniz yok' });
    }
    
    const dataPath = path.join(__dirname, '../../client/data/manhwalar.json');
    const data = await fs.readFile(dataPath, 'utf8');
    const manhwalar = JSON.parse(data);
    
    const series = manhwalar.find(s => s.seriesId === seriesId);
    if (!series) {
      return res.status(404).json({ error: 'Seri bulunamadı' });
    }
    
    const chapterIndex = series.chapters.findIndex(c => c.number === parseInt(chapterNumber));
    if (chapterIndex === -1) {
      return res.status(404).json({ error: 'Bölüm bulunamadı' });
    }
    
    // JSON'dan bölümü sil
    const deletedChapter = series.chapters.splice(chapterIndex, 1)[0];
    console.log(`📋 JSON'dan silindi: Bölüm ${chapterNumber}`);
    
    // Chapter details'den de sil
    if (series.chapterDetails) {
      const detailIndex = series.chapterDetails.findIndex(c => c.number === parseInt(chapterNumber));
      if (detailIndex !== -1) {
        series.chapterDetails.splice(detailIndex, 1);
        console.log(`📋 Chapter details'den silindi: Bölüm ${chapterNumber}`);
      }
    }
    
    // Fiziksel dosyaları sil
    const folderName = getSeriesFolderName(seriesId);
    const chapterFile = path.join(__dirname, '../../client/chapters', folderName, `bölüm${chapterNumber}.html`);
    
    try {
      await fs.unlink(chapterFile);
      console.log(`📄 HTML dosyası silindi: ${chapterFile}`);
    } catch (error) {
      console.warn(`⚠️  HTML dosyası silinemedi: ${error.message}`);
    }
    
    // İlgili resim klasörünü sil
    const imagesDir = path.join(__dirname, '../../client/images/bölümler', 
      folderName.replace(' chapters', ''), `bölüm${chapterNumber}`);
    
    try {
      await fs.rmdir(imagesDir, { recursive: true });
      console.log(`🖼️  Resim klasörü silindi: ${imagesDir}`);
    } catch (error) {
      console.warn(`⚠️  Resim klasörü silinemedi: ${error.message}`);
    }
    
    // JSON dosyasını kaydet
    await fs.writeFile(dataPath, JSON.stringify(manhwalar, null, 2));
    console.log(`💾 manhwalar.json güncellendi`);
    
    res.json({
      success: true,
      message: `Bölüm ${chapterNumber} başarıyla silindi`,
      deletedChapter: {
        number: deletedChapter.number,
        title: deletedChapter.title
      }
    });
  } catch (error) {
    console.error('Bölüm silme hatası:', error);
    res.status(500).json({ error: 'Bölüm silinemedi: ' + error.message });
  }
});

module.exports = router;
