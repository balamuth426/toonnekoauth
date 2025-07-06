const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const verifyToken = require('../middleware/verifyToken');
const User = require('../models/User');
const { convertDriveLinkToDirectAccess, validateImageUrl, createThumbnailUrl, createMultiQualityUrls } = require('../utils/imageUrlHelper');
const adminController = require('../controllers/adminController');
const ChapterUpdateManager = require('../utils/chapter-update-manager');
const { 
  getSeriesFolderName, 
  getSeriesDisplayName, 
  isValidSeriesId, 
  validateSeriesData, 
  validateChapterData, 
  normalizeSeriesId 
} = require('../utils/seriesHelper');

// Admin middleware - sadece admin kullanıcıları
const verifyAdmin = async (req, res, next) => {
  try {
    // TEST MODU kontrolü - geçici olarak test için açık
    const testMode = false; // Production mode - gerçek admin kontrolü
    
    if (testMode) {
      console.log('Admin middleware: TEST MODU - tüm kullanıcılar admin kabul ediliyor');
      req.adminUser = { username: 'test-admin', isAdmin: true };
      next();
      return;
    }
    
    // Production modu: Gerçek kullanıcı kontrolü
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
    
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Admin yetkisi gerekli' });
    }
    
    req.adminUser = user;
    next();
  } catch (error) {
    console.error('Admin doğrulama hatası:', error);
    res.status(500).json({ error: 'Admin doğrulama hatası' });
  }
};

// Chapter oluşturma endpoint'i
router.post('/create-chapter', async (req, res) => {
  try {
    const { seriesId, chapterNumber, content } = req.body;
    
    if (!seriesId || !chapterNumber || !content) {
      return res.status(400).json({ error: 'Eksik veri' });
    }

    // Seri ID validasyonu
    if (!isValidSeriesId(seriesId)) {
      return res.status(400).json({ 
        error: 'Geçersiz seri ID', 
        validIds: require('../utils/seriesHelper').getAllSeriesIds() 
      });
    }

    const folderName = getSeriesFolderName(seriesId);

    // Create chapter file path
    const clientPath = path.join(__dirname, '../../client');
    const chapterDir = path.join(clientPath, 'chapters', folderName);
    const chapterFile = path.join(chapterDir, `bölüm${chapterNumber}.html`);

    // Ensure directory exists
    try {
      await fs.access(chapterDir);
    } catch (error) {
      await fs.mkdir(chapterDir, { recursive: true });
    }

    // Write chapter file
    await fs.writeFile(chapterFile, content, 'utf8');

    // Create images directory if not exists
    const imagesDir = path.join(clientPath, 'images', 'bölümler', folderName.replace(' chapters', ''), `bölüm${chapterNumber}`);
    try {
      await fs.access(imagesDir);
    } catch (error) {
      await fs.mkdir(imagesDir, { recursive: true });
      // Create placeholder images
      const placeholderPath = path.join(clientPath, 'images', 'default-cover.jpg');
      for (let i = 1; i <= 10; i++) {
        const imagePath = path.join(imagesDir, `${i}.jpg`);
        try {
          await fs.copyFile(placeholderPath, imagePath);
        } catch (err) {
          console.log(`Could not create placeholder image ${i}.jpg`);
        }
      }
    }

    // 🚀 YENİ ÖZELLİK: manhwalar.json'ı güncelle ve seriyi en başa taşı
    try {
      console.log(`🔍 Manhwalar.json güncelleme başlıyor - seriesId: ${seriesId}, chapterNumber: ${chapterNumber}`);
      const dataPath = path.join(clientPath, 'data', 'manhwalar.json');
      const data = await fs.readFile(dataPath, 'utf8');
      const manhwalar = JSON.parse(data);
      
      const seriesIndex = manhwalar.findIndex(s => s.seriesId === seriesId);
      console.log(`🔍 Series index: ${seriesIndex}`);
      if (seriesIndex !== -1) {
        const series = manhwalar[seriesIndex];
        console.log(`🔍 Series bulundu: ${series.title}, mevcut bölüm sayısı: ${series.chapters ? series.chapters.length : 0}`);
        
        // Yeni bölümü ekle
        const newChapter = {
          number: parseInt(chapterNumber),
          title: `Bölüm ${chapterNumber}`, // Varsayılan başlık
          content: content,
          addedBy: 'admin',
          addedAt: new Date().toISOString()
        };
        
        if (!series.chapters) {
          series.chapters = [];
          console.log(`🔍 Chapters array oluşturuldu`);
        }
        
        // Bölüm zaten var mı kontrol et
        const existingChapter = series.chapters.find(c => c.number === parseInt(chapterNumber));
        console.log(`🔍 Existing chapter: ${existingChapter ? 'VAR' : 'YOK'}`);
        if (!existingChapter) {
          console.log(`🔍 Yeni bölüm ekleniyor...`);
          series.chapters.push(newChapter);
          
          // Chapter details güncelle (eski format uyumluluğu için)
          if (!series.chapterDetails) {
            series.chapterDetails = [];
          }
          
          const chapterDetail = {
            number: parseInt(chapterNumber),
            title: `Bölüm ${chapterNumber}`,
            date: new Date().toLocaleDateString('tr-TR'),
            path: `chapters/${folderName}/bölüm${chapterNumber}.html`
          };
          
          series.chapterDetails.push(chapterDetail);
          series.chapterDetails.sort((a, b) => a.number - b.number);
          
          // Seriyi en başa taşı (Son Yüklenenler için)
          const updatedSeries = manhwalar.splice(seriesIndex, 1)[0];
          manhwalar.unshift(updatedSeries);
          console.log(`📌 ${series.title} serisi listenin en başına taşındı (Admin)`);
          
          // JSON dosyasını kaydet
          await fs.writeFile(dataPath, JSON.stringify(manhwalar, null, 2));
          console.log(`💾 Manhwalar.json kaydedildi`);
        } else {
          console.log(`⚠️ Bölüm ${chapterNumber} zaten mevcut, JSON güncellenmedi`);
        }
      } else {
        console.log(`❌ Series bulunamadı: ${seriesId}`);
      }
    } catch (jsonError) {
      console.warn('manhwalar.json güncellenemedi:', jsonError.message);
    }

    res.json({ 
      success: true, 
      message: 'Bölüm başarıyla oluşturuldu',
      chapterPath: `chapters/${folderName}/bölüm${chapterNumber}.html`
    });

    // Navigation güncelleme (async olarak arka planda)
    ChapterUpdateManager.refreshNavigationForSeries(seriesId)
      .then(success => {
        if (success) {
          console.log(`✅ ${seriesId} navigation güncellendi`);
        } else {
          console.log(`⚠️ ${seriesId} navigation güncellenemedi`);
        }
      })
      .catch(error => {
        console.error(`❌ ${seriesId} navigation güncelleme hatası:`, error);
      });

  } catch (error) {
    console.error('Chapter creation error:', error);
    res.status(500).json({ error: 'Bölüm oluşturulurken hata oluştu' });
  }
});

// Bölümleri standartlaştırma endpoint'i
router.post('/standardize-chapters', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const clientPath = path.join(__dirname, '../../client');
    
    // Solo Leveling template'ini al
    const templatePath = path.join(clientPath, 'chapters', 'solo leveling chapters', 'bölüm1.html');
    const template = await fs.readFile(templatePath, 'utf8');

    // Tüm seri klasörlerini tara
    const chaptersDir = path.join(clientPath, 'chapters');
    const seriesFolders = await fs.readdir(chaptersDir);

    const results = [];

    for (const folder of seriesFolders) {
      if (folder.includes('chapters') && folder !== 'solo leveling chapters') {
        const folderPath = path.join(chaptersDir, folder);
        const stats = await fs.stat(folderPath);
        
        if (stats.isDirectory()) {
          // Bu klasördeki tüm bölümleri standardize et
          const chapterFiles = await fs.readdir(folderPath);
          
          for (const file of chapterFiles) {
            if (file.endsWith('.html') && file.startsWith('bölüm')) {
              try {
                await standardizeChapter(template, folderPath, file, folder);
                results.push(`${folder}/${file} - Başarılı`);
              } catch (err) {
                results.push(`${folder}/${file} - Hata: ${err.message}`);
              }
            }
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Standartlaştırma tamamlandı',
      results: results
    });

  } catch (error) {
    console.error('Standardization error:', error);
    res.status(500).json({ error: 'Standartlaştırma sırasında hata oluştu' });
  }
});

// Chapter standartlaştırma yardımcı fonksiyonu
async function standardizeChapter(template, folderPath, fileName, folderName) {
  const chapterPath = path.join(folderPath, fileName);
  const currentContent = await fs.readFile(chapterPath, 'utf8');
  
  // Mevcut içerikten bilgileri çıkar
  const chapterNumber = fileName.match(/bölüm(\d+)\.html/)?.[1];
  if (!chapterNumber) return;

  // Seri bilgilerini belirle
  const seriesInfo = getSeriesInfoFromFolder(folderName);
  
  // Template'i güncelle
  let newContent = template
    .replace(/Solo Leveling/g, seriesInfo.displayName)
    .replace(/sololeveling/g, seriesInfo.id)
    .replace(/Bölüm 1/g, `Bölüm ${chapterNumber}`)
    .replace(/chapter-1/g, `chapter-${chapterNumber}`)
    .replace(/currentChapter: 1/g, `currentChapter: ${chapterNumber}`)
    .replace(/seriesUrl: '..\/..\/series\/sololeveling\/sololevelingseri.html'/g, `seriesUrl: '../../series/${seriesInfo.id}/${seriesInfo.id}seri.html'`)
    .replace(/sololeveling-chapter-1/g, `${seriesInfo.id}-chapter-${chapterNumber}`);

  // Mevcut içerikteki özel kısımları koru (eğer varsa)
  // Örneğin: özel resim yolları, sayfa sayısı vb.
  
  // Yeni içeriği yaz
  await fs.writeFile(chapterPath, newContent, 'utf8');
}

// Folder adından seri bilgilerini çıkar
function getSeriesInfoFromFolder(folderName) {
  const folderMap = {
    'nanomachine chapters': { id: 'nanomachine', displayName: 'Nano Machine' },
    'omniscient reader chapters': { id: 'omniscientreader', displayName: 'Omniscient Reader' },
    'damn reincarnation chapters': { id: 'damnreincarnation', displayName: 'Damn Reincarnation' },
    'martial god regressed to level 2 chapters': { id: 'martialgodregressed', displayName: 'Martial God Regressed to Level 2' }
  };
  
  return folderMap[folderName] || { id: 'unknown', displayName: 'Unknown Series' };
}

// Seri bilgilerini getir
router.get('/series', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const clientPath = path.join(__dirname, '../../client');
    const chaptersDir = path.join(clientPath, 'chapters');
    const seriesFolders = await fs.readdir(chaptersDir);

    const series = [];

    for (const folder of seriesFolders) {
      if (folder.includes('chapters')) {
        const folderPath = path.join(chaptersDir, folder);
        const stats = await fs.stat(folderPath);
        
        if (stats.isDirectory()) {
          const chapterFiles = await fs.readdir(folderPath);
          const chapterCount = chapterFiles.filter(file => 
            file.endsWith('.html') && file.startsWith('bölüm')
          ).length;

          const seriesInfo = getSeriesInfoFromFolder(folder);
          series.push({
            id: seriesInfo.id,
            name: seriesInfo.displayName,
            folder: folder,
            chapters: chapterCount
          });
        }
      }
    }

    res.json(series);
  } catch (error) {
    console.error('Error getting series:', error);
    res.status(500).json({ error: 'Seri bilgileri alınırken hata oluştu' });
  }
});

// İstatistikleri getir
router.get('/stats', verifyToken, verifyAdmin, async (req, res) => {
  try {
    // Bu endpoint'ler için model'ları import etmemiz gerekiyor
    // Şimdilik mock data döndürüyoruz
    const stats = {
      totalSeries: 5,
      totalChapters: 6,
      totalUsers: 156,
      totalComments: 342
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'İstatistikler alınırken hata oluştu' });
  }
});

// Old user management endpoints - removed duplicate (using newer implementation below)

// Comment management endpoints
router.get('/comments', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const Comment = require('../models/Comment');
    const comments = await Comment.find({})
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(100);
    
    const commentStats = {
      total: await Comment.countDocuments(),
      pending: await Comment.countDocuments({ status: 'pending' }),
      approved: await Comment.countDocuments({ status: 'approved' }),
      spam: await Comment.countDocuments({ status: 'spam' })
    };

    res.json({ comments, stats: commentStats });
  } catch (error) {
    console.error('Comments fetch error:', error);
    res.status(500).json({ error: 'Yorumlar getirilemedi' });
  }
});

router.put('/comments/:id/status', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const Comment = require('../models/Comment');
    
    if (!['approved', 'pending', 'spam'].includes(status)) {
      return res.status(400).json({ error: 'Geçersiz status' });
    }

    const comment = await Comment.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    ).populate('user', 'username avatar');

    if (!comment) {
      return res.status(404).json({ error: 'Yorum bulunamadı' });
    }

    res.json({ message: 'Yorum durumu güncellendi', comment });
  } catch (error) {
    console.error('Comment status update error:', error);
    res.status(500).json({ error: 'Yorum durumu güncellenemedi' });
  }
});

router.delete('/comments/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const Comment = require('../models/Comment');
    const comment = await Comment.findByIdAndDelete(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: 'Yorum bulunamadı' });
    }

    res.json({ message: 'Yorum başarıyla silindi' });
  } catch (error) {
    console.error('Comment delete error:', error);
    res.status(500).json({ error: 'Yorum silinemedi' });
  }
});

router.post('/series', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id, name, description, genre, cover } = req.body;
    
    if (!id || !name) {
      return res.status(400).json({ error: 'Seri ID ve adı gereklidir' });
    }

    // Create series directory
    const clientPath = path.join(__dirname, '../../client');
    const seriesDir = path.join(clientPath, 'series', id);
    const chaptersDir = path.join(clientPath, 'chapters', `${id} chapters`);
    
    await fs.mkdir(seriesDir, { recursive: true });
    await fs.mkdir(chaptersDir, { recursive: true });

    // Update manhwalar.json
    const dataPath = path.join(clientPath, 'data', 'manhwalar.json');
    let series = [];
    
    try {
      const data = await fs.readFile(dataPath, 'utf8');
      series = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start with empty array
    }

    // Yeni seri objesi
    const newSeries = {
      id: manhwaData.length + 1,
      title,
      summary: description || summary || '',
      seriesId,
      image: proxyImageUrl,
      status,
      rating,
      year,
      author,
      artist: req.body.artist || '',
      publisher: req.body.publisher || '',
      genres: Array.isArray(req.body.genres) ? req.body.genres : (typeof req.body.genres === 'string' ? req.body.genres.split(',').map(g => g.trim()) : []),
      chapters: [],
      chapterCount: 0,
      lastUpdate: new Date().toISOString()
    };

    // Seriyi listenin en başına ekle
    manhwaData.unshift(newSeries);

    // Dosyayı güncelle
    await fs.writeFile(manhwaPath, JSON.stringify(manhwaData, null, 2), 'utf8');

    res.json({ message: 'Seri başarıyla oluşturuldu', series: newSeries });
  } catch (error) {
    console.error('Series creation error:', error);
    res.status(500).json({ error: 'Seri oluşturulamadı' });
  }
});

router.delete('/series/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const seriesId = req.params.id;
    const clientPath = path.join(__dirname, '../../client');
    
    // Remove series directories
    const seriesDir = path.join(clientPath, 'series', seriesId);
    const chaptersDir = path.join(clientPath, 'chapters', `${seriesId} chapters`);
    
    try {
      await fs.rmdir(seriesDir, { recursive: true });
    } catch (error) {
      console.log('Series directory not found:', seriesDir);
    }
    
    try {
      await fs.rmdir(chaptersDir, { recursive: true });
    } catch (error) {
      console.log('Chapters directory not found:', chaptersDir);
    }

    // Update manhwalar.json
    const dataPath = path.join(clientPath, 'data', 'manhwalar.json');
    try {
      const data = await fs.readFile(dataPath, 'utf8');
      let series = JSON.parse(data);
      series = series.filter(s => s.id !== seriesId);
      await fs.writeFile(dataPath, JSON.stringify(series, null, 2), 'utf8');
    } catch (error) {
      console.log('manhwalar.json not found or invalid');
    }

    res.json({ message: 'Seri başarıyla silindi' });
  } catch (error) {
    console.error('Series deletion error:', error);
    res.status(500).json({ error: 'Seri silinemedi' });
  }
});

// Settings endpoints
router.get('/settings', verifyToken, verifyAdmin, async (req, res) => {
  try {
    // Mock settings - gerçek uygulamada database'den gelecek
    const settings = {
      general: {
        siteTitle: 'ToonNeko',
        siteDescription: 'En iyi manhwa okuma deneyimi',
        maintenanceMode: false
      },
      comments: {
        moderation: true,
        guestComments: false,
        maxLength: 500
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: 24
      },
      announcement: {
        active: false,
        text: '',
        type: 'info'
      }
    };

    res.json({ settings });
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ error: 'Ayarlar getirilemedi' });
  }
});

router.put('/settings', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { section, settings } = req.body;
    
    if (!section || !settings) {
      return res.status(400).json({ error: 'Eksik veri' });
    }

    // Mock save - gerçek uygulamada database'e kaydedilecek
    console.log(`Saving ${section} settings:`, settings);

    res.json({ message: 'Ayarlar başarıyla kaydedildi' });
  } catch (error) {
    console.error('Settings save error:', error);
    res.status(500).json({ error: 'Ayarlar kaydedilemedi' });
  }
});

// Google Drive link validation endpoint
router.post('/validate-drive-link', async (req, res) => {
  try {
    const { driveUrl, quality = 'high' } = req.body;
    
    if (!driveUrl) {
      return res.status(400).json({ error: 'Drive URL gerekli' });
    }

    console.log('Validating drive URL:', driveUrl);

    // Çoklu kalite URL'leri oluştur
    const qualityUrls = createMultiQualityUrls(driveUrl);
    console.log('Quality URLs generated:', qualityUrls);
    
    const directUrl = convertDriveLinkToDirectAccess(driveUrl, quality);
    console.log('Direct URL for validation:', directUrl);
    
    const isValid = await validateImageUrl(directUrl);
    console.log('Validation result:', isValid);
    
    res.json({ 
      isValid,
      directUrl,
      qualityUrls,
      thumbnailUrl: createThumbnailUrl(driveUrl, 's1600'),
      recommendedUrl: qualityUrls.high, // En kaliteli seçenek
      debug: {
        originalUrl: driveUrl,
        extractedFileId: driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ? driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)[1] : 'not found'
      }
    });
  } catch (error) {
    console.error('Drive link validation error:', error);
    res.status(500).json({ error: 'Link doğrulama hatası: ' + error.message });
  }
});

// Yeni seri ekleme (Google Drive görsellerle)
router.post('/create-series', async (req, res) => {
  try {
    const { 
      title, 
      summary,
      seriesId, 
      coverImageUrl, 
      status = 'Devam Ediyor',
      rating = 0,
      year = new Date().getFullYear(),
      author = '',
      artist = '',
      publisher = '',
      genres = []
    } = req.body;
    
    // Seri verisi validasyonu
    const seriesData = { title, seriesId, image: coverImageUrl };
    const validation = validateSeriesData(seriesData);
    
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Validasyon hatası', 
        details: validation.errors 
      });
    }

    // Seri ID'yi normalize et
    let normalizedSeriesId;
    try {
      normalizedSeriesId = normalizeSeriesId(seriesId);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    // Mevcut seri kontrolü
    const manhwaPath = path.join(__dirname, '../../client/data/manhwalar.json');
    let manhwaData = [];
    
    try {
      const data = await fs.readFile(manhwaPath, 'utf8');
      manhwaData = JSON.parse(data);
      
      // Aynı ID'li seri var mı kontrolü
      const existingSeries = manhwaData.find(s => s.seriesId === normalizedSeriesId);
      if (existingSeries) {
        return res.status(409).json({ 
          error: 'Bu seri ID zaten mevcut', 
          existingTitle: existingSeries.title 
        });
      }
    } catch (error) {
      console.log('Manhwalar.json dosyası bulunamadı, yeni dosya oluşturuluyor');
    }

    // Google Drive linkinden file ID'yi çıkar ve proxy URL oluştur
    const fileIdMatch = coverImageUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (!fileIdMatch) {
      return res.status(400).json({ error: 'Geçersiz Google Drive link formatı' });
    }
    
    const fileId = fileIdMatch[1];
    const proxyImageUrl = `http://localhost:5506/api/image/proxy-image/${fileId}`;
    
    console.log('Creating series with proxy URL:', proxyImageUrl);

    // Yeni seri objesi
    const newSeries = {
      title,
      seriesId: normalizedSeriesId,
      date: new Date().toISOString().split('T')[0],
      image: proxyImageUrl,
      chapterCount: 0,
      lastChapter: "Henüz bölüm yok",
      lastUpdated: new Date().toISOString().split('T')[0],
      link: `series/${normalizedSeriesId}/${normalizedSeriesId}seri.html`,
      genres: Array.isArray(genres) ? genres : (typeof genres === 'string' ? genres.split(',').map(g => g.trim()) : []),
      status,
      author,
      artist,
      publisher,
      summary: summary || '',
      availableChapters: [],
      chapterDetails: [],
      chapters: []
    };

    // Seriyi listenin en başına ekle
    manhwaData.unshift(newSeries);

    // Dosyayı güncelle
    await fs.writeFile(manhwaPath, JSON.stringify(manhwaData, null, 2), 'utf8');

    // Seri klasörlerini oluştur
    const clientPath = path.join(__dirname, '../../client');
    const chapterDir = path.join(clientPath, 'chapters', `${seriesId} chapters`);
    const seriesDir = path.join(clientPath, 'series', seriesId);
    
    // Klasörleri oluştur
    await fs.mkdir(chapterDir, { recursive: true });
    await fs.mkdir(seriesDir, { recursive: true });

    // Generic template kullanarak seri sayfası oluştur
    const templatePath = path.join(__dirname, '../templates/series-template.html');
    const seriesPagePath = path.join(seriesDir, `${seriesId}seri.html`);
    
    console.log('Template path:', templatePath);
    console.log('Series page path:', seriesPagePath);
    
    try {
      // Template dosyasının varlığını kontrol et
      await fs.access(templatePath);
      console.log('Generic template dosyası bulundu');
      
      let template = await fs.readFile(templatePath, 'utf8');
      console.log('Template dosyası okundu, uzunluk:', template.length);
      
      // Template'i yeni seri için özelleştir
      const genresString = Array.isArray(genres) ? genres.join(', ') : (typeof genres === 'string' ? genres : '');
      
      template = template
        .replace(/\{\{SERIES_TITLE\}\}/g, title)
        .replace(/\{\{SERIES_ID\}\}/g, seriesId)
        .replace(/\{\{SERIES_IMAGE\}\}/g, proxyImageUrl)
        .replace(/\{\{SERIES_STATUS\}\}/g, status)
        .replace(/\{\{SERIES_GENRES\}\}/g, genresString)
        .replace(/\{\{SERIES_AUTHOR\}\}/g, author)
        .replace(/\{\{SERIES_ARTIST\}\}/g, artist)
        .replace(/\{\{SERIES_PUBLISHER\}\}/g, publisher)
        .replace(/\{\{SERIES_SUMMARY\}\}/g, summary || 'Bu seri için henüz özet eklenmemiş.');
      
      console.log('Template özelleştirildi');
      
      await fs.writeFile(seriesPagePath, template, 'utf8');
      console.log('Seri sayfası başarıyla oluşturuldu:', seriesPagePath);
    } catch (error) {
      console.error('Seri sayfası template oluşturma hatası:', error);
      // Hata oluşursa işlemi durdur ve kullanıcıya bildir
      return res.status(500).json({ error: 'Seri sayfası oluşturulamadı: ' + error.message });
    }

    res.json({ 
      success: true, 
      message: 'Seri başarıyla oluşturuldu',
      series: newSeries,
      seriesPageCreated: true
    });

  } catch (error) {
    console.error('Series creation error:', error);
    res.status(500).json({ error: 'Seri oluşturulurken hata oluştu' });
  }
});

// Bölüm ekleme (Google Drive görseller ile)
router.post('/create-chapter-with-images', async (req, res) => {
  try {
    const { seriesId, chapterNumber, title, imageUrls, quality = 'high' } = req.body;
    
    // Bölüm verisi validasyonu
    const chapterData = { seriesId, chapterNumber, imageUrls };
    const validation = validateChapterData(chapterData);
    
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Validasyon hatası', 
        details: validation.errors 
      });
    }

    // Seri ID kontrolü
    if (!isValidSeriesId(seriesId)) {
      return res.status(400).json({ 
        error: 'Geçersiz seri ID', 
        validIds: require('../utils/seriesHelper').getAllSeriesIds() 
      });
    }

    // Proxy URL'leri oluştur
    const proxyImageUrls = imageUrls.map(url => {
      const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        return `http://localhost:5506/api/image/proxy-image/${fileId}`;
      }
      return url;
    });

    // Mevcut bölümleri ve seri bilgilerini al
    const manhwaPath = path.join(__dirname, '../../client/data/manhwalar.json');
    const manhwaData = JSON.parse(await fs.readFile(manhwaPath, 'utf8'));
    const seriesIndex = manhwaData.findIndex(s => s.seriesId === seriesId);
    const series = manhwaData[seriesIndex];
    
    if (!series || seriesIndex === -1) {
      return res.status(404).json({ error: 'Seri bulunamadı' });
    }

    const allChapters = series.chapters || [];
    const sortedChapters = [...allChapters, { number: parseInt(chapterNumber) }]
      .sort((a, b) => a.number - b.number);
    
    const currentIndex = sortedChapters.findIndex(ch => ch.number === parseInt(chapterNumber));
    const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
    const nextChapter = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

    // Template dosyasını oku (güvenli template)
    const templatePath = path.join(__dirname, '../templates/chapter-template.html');
    let template = await fs.readFile(templatePath, 'utf8');

    // Dinamik alanlar
    const chapterTitle = title || `Bölüm ${chapterNumber}`;
    const seriesDisplayName = series.title || seriesId.charAt(0).toUpperCase() + seriesId.slice(1);
    const seriesUrl = `../../series/${seriesId}/${seriesId}seri.html`;
    const imagesHtml = proxyImageUrls.map((url, index) => `<img src="${url}" alt="${chapterTitle} - Sayfa ${index + 1}" class="okuma-img" data-page="${index + 1}">`).join('\n    ');
    
    // Bölüm seçici için tüm bölümleri listele
    const chapterOptions = sortedChapters
      .map(ch => `<option value="${ch.number}" ${ch.number === parseInt(chapterNumber) ? 'selected' : ''}>Bölüm ${ch.number}</option>`)
      .join('\n');

    // Resim listesi seçenekleri
    const resimListesiOptions = proxyImageUrls
      .map((_, i) => `<option value="${i+1}">${i+1} / ${proxyImageUrls.length}</option>`)
      .join('\n');

    // Navigasyon butonlarını güncelle
    const prevBtnStyle = prevChapter ? '' : 'style="display: none;"';
    const nextBtnStyle = nextChapter ? '' : 'style="display: none;"';

    // Template üzerinde değişiklikler
    template = template
      // Önce placeholder'ları değiştir
      .replace(/{{SERIES_TITLE}}/g, seriesDisplayName)
      .replace(/{{SERIES_ID}}/g, seriesId)
      .replace(/{{CHAPTER_TITLE}}/g, chapterTitle)
      .replace(/{{CHAPTER_NUMBER}}/g, chapterNumber)
      .replace(/{{SERIES_URL}}/g, seriesUrl)
      // Eski placeholder'ları da değiştir (backward compatibility)
      .replace(/TEMPLATE_SERIES_TITLE/g, seriesDisplayName)
      .replace(/TEMPLATE_SERIES_ID/g, seriesId)
      .replace(/TEMPLATE_CHAPTER_TITLE/g, chapterTitle)
      .replace(/TEMPLATE_CHAPTER_NUMBER/g, chapterNumber)
      // Sonra diğer replacement'lar
      .replace(/<title>.*?<\/title>/, `<title>${seriesDisplayName} - ${chapterTitle} | ToonNeko</title>`)
      .replace(/<span id="chapterTitle">.*?<\/span>/, `<span id="chapterTitle">${chapterTitle}</span>`)
      .replace(/<select id="resimListesi" class="custom-select">[\s\S]*?<\/select>/, `<select id="resimListesi" class="custom-select">${resimListesiOptions}</select>`)
      .replace(/<select id="bolumSec" class="custom-select">[\s\S]*?<\/select>/, `<select id="bolumSec" class="custom-select">${chapterOptions}</select>`)
      .replace(/<div class="okuma-alani" id="okumaAlani">[\s\S]*?<\/div>/, `<div class="okuma-alani" id="okumaAlani">\n    ${imagesHtml}\n  </div>`)
      .replace(/Damn Reincarnation/g, seriesDisplayName)
      .replace(/damnreincarnation/g, seriesId)
      .replace(/const CHAPTER_CONFIG = {[\s\S]*?};/, `const CHAPTER_CONFIG = {
    seriesName: '${seriesId}',
    seriesDisplayName: '${seriesDisplayName}',
    currentChapter: ${chapterNumber},
    totalChapters: ${sortedChapters.length},
    availableChapters: [${sortedChapters.join(', ')}],
    seriesUrl: '${seriesUrl}',
    chapterUrlPattern: '../${seriesId} chapters/bölüm{chapter}.html'
  };`)
      .replace(/<button id="navPrevBtn".*?button>/, `<button id="navPrevBtn" ${prevBtnStyle}><i class="fa-solid fa-chevron-left"></i> <span id="prevBtnText">Önceki Bölüm</span></button>`)
      .replace(/<button id="navNextBtn".*?button>/, `<button id="navNextBtn" ${nextBtnStyle}><i class="fa-solid fa-chevron-right"></i> <span id="nextBtnText">Sonraki Bölüm</span></button>`)
      .replace(/<button id="navPrevBtn2".*?button>/, `<button id="navPrevBtn2" ${prevBtnStyle}><i class="fa-solid fa-chevron-left"></i> <span id="prevBtnText2">Önceki Bölüm</span></button>`)
      .replace(/<button id="navNextBtn2".*?button>/, `<button id="navNextBtn2" ${nextBtnStyle}><i class="fa-solid fa-chevron-right"></i> <span id="nextBtnText2">Sonraki Bölüm</span></button>`)
      .replace(/document\.addEventListener\('DOMContentLoaded',function\(\)\{if\(typeof CommentsUI!=='undefined'\)\{new CommentsUI\([^)]+\);\}\}\);/, `document.addEventListener('DOMContentLoaded',function(){if(typeof CommentsUI!=='undefined'){new CommentsUI('${seriesId}', ${chapterNumber});}});`)
      .replace(/const seriesName = 'damnreincarnation';\s*const chapterNumber = 1;/, `const seriesName = '${seriesId}'; const chapterNumber = ${chapterNumber};`)
      .replace(/console\.log\('🔥 Damn Reincarnation Bölüm 1[^']*'\);/, `console.log('🔥 ${seriesDisplayName} Bölüm ${chapterNumber} - CommentsUI başlatılıyor...');`)
      .replace(/console\.log\('✅ Damn Reincarnation Bölüm 1[^']*'\);/, `console.log('✅ ${seriesDisplayName} Bölüm ${chapterNumber} CommentsUI created');`)
      .replace(/comments-damnreincarnation-1/, `comments-${seriesId}-${chapterNumber}`)
      .replace(/new CommentsUI\('damnreincarnation', 1\)/, `new CommentsUI('${seriesId}', ${chapterNumber})`)

    // Klasör ve dosya yolu
    const folderName = getSeriesFolderName(seriesId);
    const clientPath = path.join(__dirname, '../../client');
    const chapterDir = path.join(clientPath, 'chapters', folderName);
    const chapterFile = path.join(chapterDir, `bölüm${chapterNumber}.html`);
    await fs.mkdir(chapterDir, { recursive: true });
    await fs.writeFile(chapterFile, template, 'utf8');

    // manhwalar.json'u güncelle
    if (!series.chapters) {
      series.chapters = [];
    }
    
    const newChapter = {
      number: parseInt(chapterNumber),
      title: chapterTitle,
      filename: `bölüm${chapterNumber}.html`,
      imageCount: proxyImageUrls.length,
      uploadDate: new Date().toISOString(),
      imageUrls: proxyImageUrls
    };
    
    series.chapters.push(newChapter);
    series.chapters.sort((a, b) => a.number - b.number);
    
    // availableChapters ve chapterDetails güncelle
    if (!series.availableChapters) {
      series.availableChapters = [];
    }
    if (!series.chapterDetails) {
      series.chapterDetails = [];
    }
    
    // Eğer bu bölüm numarası zaten yoksa ekle
    if (!series.availableChapters.includes(parseInt(chapterNumber))) {
      series.availableChapters.push(parseInt(chapterNumber));
      series.availableChapters.sort((a, b) => a - b);
    }
    
    // chapterDetails güncelle
    const chapterDetailExists = series.chapterDetails.find(ch => ch.number === parseInt(chapterNumber));
    if (!chapterDetailExists) {
      series.chapterDetails.push({
        number: parseInt(chapterNumber),
        filename: `bölüm${chapterNumber}.html`,
        url: `chapters/${folderName}/bölüm${chapterNumber}.html`
      });
      series.chapterDetails.sort((a, b) => a.number - b.number);
    }
    
    // Genel bilgileri güncelle
    series.chapterCount = series.chapters.length;
    
    // lastChapter'ı güvenli şekilde güncelle
    if (series.availableChapters && series.availableChapters.length > 0) {
      series.lastChapter = `Bölüm ${Math.max(...series.availableChapters)}`;
    } else if (series.chapters && series.chapters.length > 0) {
      const maxChapter = Math.max(...series.chapters.map(ch => ch.number));
      series.lastChapter = `Bölüm ${maxChapter}`;
    } else {
      series.lastChapter = 'Bölüm 0';
    }
    
    series.lastUpdated = new Date().toISOString().split('T')[0];
    series.lastUpdate = new Date().toISOString();

    // 🚀 YENİ ÖZELLİK: Seriyi en başa getir (Son Yüklenenler için)
    // Güncellenen seriyi diziden çıkar ve en başa ekle
    const updatedSeries = manhwaData.splice(seriesIndex, 1)[0];
    manhwaData.unshift(updatedSeries);
    console.log(`📌 ${series.title} serisi listenin en başına taşındı`);

    await fs.writeFile(manhwaPath, JSON.stringify(manhwaData, null, 2), 'utf8');

    // Navigation güncelleme
    await ChapterUpdateManager.refreshNavigationForSeries(seriesId);

    res.json({ 
      success: true, 
      message: 'Bölüm başarıyla oluşturuldu',
      chapterPath: `chapters/${folderName}/bölüm${chapterNumber}.html`,
      imageCount: proxyImageUrls.length
    });
  } catch (error) {
    console.error('Chapter with images creation error:', error);
    res.status(500).json({ error: 'Bölüm oluşturulurken hata oluştu' });
  }
});

// Serilerin listesini getir
router.get('/series-list', async (req, res) => {
  try {
    const manhwaPath = path.join(__dirname, '../../client/data/manhwalar.json');
    let manhwaData = [];
    
    try {
      const data = await fs.readFile(manhwaPath, 'utf8');
      manhwaData = JSON.parse(data);
    } catch (error) {
      return res.json([]);
    }

    // Otomatik senkronizasyon: chapters ve availableChapters tutarsızlığını düzelt
    let needsUpdate = false;
    manhwaData.forEach(series => {
      if (series.chapters && Array.isArray(series.chapters)) {
        const chaptersFromArray = series.chapters
          .map(ch => ch.number)
          .filter(num => typeof num === 'number')
          .sort((a, b) => a - b);
        
        const correctChapterCount = series.chapters.length;
        
        // availableChapters tutarsızsa düzelt
        if (JSON.stringify(series.availableChapters || []) !== JSON.stringify(chaptersFromArray)) {
          series.availableChapters = chaptersFromArray;
          needsUpdate = true;
        }
        
        // chapterCount tutarsızsa düzelt
        if (series.chapterCount !== correctChapterCount) {
          series.chapterCount = correctChapterCount;
          needsUpdate = true;
        }
        
        // lastChapter'ı güncelle
        if (chaptersFromArray.length > 0) {
          const expectedLastChapter = `Bölüm ${Math.max(...chaptersFromArray)}`;
          if (series.lastChapter !== expectedLastChapter) {
            series.lastChapter = expectedLastChapter;
            needsUpdate = true;
          }
        }
      }
    });
    
    // Değişiklik varsa dosyayı güncelle
    if (needsUpdate) {
      try {
        await fs.writeFile(manhwaPath, JSON.stringify(manhwaData, null, 2), 'utf8');
        console.log('📊 manhwalar.json otomatik senkronize edildi');
      } catch (error) {
        console.error('Otomatik senkronizasyon hatası:', error);
      }
    }

    const seriesList = manhwaData.map(series => ({
      seriesId: series.seriesId,
      title: series.title,
      chapterCount: series.chapters ? series.chapters.length : 0
    }));

    res.json(seriesList);
  } catch (error) {
    console.error('Series list error:', error);
    res.status(500).json({ error: 'Seriler listelenemedi' });
  }
});

// Belirli bir serinin bölümlerini getir
router.get('/series/:seriesId/chapters', async (req, res) => {
  try {
    const { seriesId } = req.params;
    const manhwaPath = path.join(__dirname, '../../client/data/manhwalar.json');
    
    const data = await fs.readFile(manhwaPath, 'utf8');
    const manhwaData = JSON.parse(data);
    
    const series = manhwaData.find(s => s.seriesId === seriesId);
    
    if (!series) {
      return res.status(404).json({ error: 'Seri bulunamadı' });
    }

    const chapters = series.chapters || [];
    
    res.json({
      success: true,
      chapters: chapters.sort((a, b) => a.number - b.number)
    });
    
  } catch (error) {
    console.error('Get chapters error:', error);
    res.status(500).json({ error: 'Bölümler getirilemedi' });
  }
});

// Belirli bir bölümün detaylarını getir
router.get('/series/:seriesId/chapters/:chapterNumber', async (req, res) => {
  try {
    const { seriesId, chapterNumber } = req.params;
    const manhwaPath = path.join(__dirname, '../../client/data/manhwalar.json');
    
    const data = await fs.readFile(manhwaPath, 'utf8');
    const manhwaData = JSON.parse(data);
    
    const series = manhwaData.find(s => s.seriesId === seriesId);
    
    if (!series) {
      return res.status(404).json({ error: 'Seri bulunamadı' });
    }

    const chapter = series.chapters?.find(c => c.number === parseInt(chapterNumber));
    
    if (!chapter) {
      return res.status(404).json({ error: 'Bölüm bulunamadı' });
    }

    // Bölüm HTML dosyasından görsel URL'lerini çıkar
    const chapterDir = path.join(__dirname, '../../client/chapters', `${seriesId} chapters`);
    const chapterFile = path.join(chapterDir, chapter.filename);
    
    let imageUrls = [];
    try {
      const htmlContent = await fs.readFile(chapterFile, 'utf8');
      const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
      let match;
      while ((match = imgRegex.exec(htmlContent)) !== null) {
        imageUrls.push(match[1]);
      }
    } catch (error) {
      console.log('Could not read chapter file:', error.message);
    }

    res.json({
      success: true,
      chapter: {
        ...chapter,
        imageUrls
      }
    });
    
  } catch (error) {
    console.error('Get chapter error:', error);
    res.status(500).json({ error: 'Bölüm detayları getirilemedi' });
  }
});

// Bölüm güncelle
router.put('/update-chapter', async (req, res) => {
  try {
    const { seriesId, originalChapterNumber, newChapterNumber, title, imageUrls } = req.body;
    console.log('=== BÖLÜM GÜNCELLEME İSTEĞİ ===');
    console.log('Series ID:', seriesId);
    console.log('Original Chapter:', originalChapterNumber);
    console.log('New Chapter:', newChapterNumber);
    console.log('Title:', title);
    console.log('Image URLs:', imageUrls);

    if (!seriesId || !originalChapterNumber || !newChapterNumber || !imageUrls || !Array.isArray(imageUrls)) {
      return res.status(400).json({ error: 'Eksik veri' });
    }

    // Proxy URL'leri oluştur (her türlü Google Drive linki için)
    const proxyImageUrls = imageUrls.map(url => {
      const fileId = extractDriveFileId(url);
      if (fileId) {
        return `http://localhost:5506/api/image/proxy-image/${fileId}`;
      }
      return url;
    });

    // manhwalar.json güncelle
    const manhwaPath = path.join(__dirname, '../../client/data/manhwalar.json');
    const data = await fs.readFile(manhwaPath, 'utf8');
    const manhwaData = JSON.parse(data);

    const seriesIndex = manhwaData.findIndex(s => s.seriesId === seriesId);
    if (seriesIndex === -1) {
      return res.status(404).json({ error: 'Seri bulunamadı' });
    }

    const chapterIndex = manhwaData[seriesIndex].chapters?.findIndex(c => c.number === parseInt(originalChapterNumber));
    if (chapterIndex === -1) {
      return res.status(404).json({ error: 'Bölüm bulunamadı' });
    }

    // Yeni dosya adı
    const newFilename = `bölüm${newChapterNumber}.html`;
    const oldFilename = manhwaData[seriesIndex].chapters[chapterIndex].filename;

    // Bölüm bilgilerini güncelle
    manhwaData[seriesIndex].chapters[chapterIndex] = {
      ...manhwaData[seriesIndex].chapters[chapterIndex],
      number: parseInt(newChapterNumber),
      title: title || `Bölüm ${newChapterNumber}`,
      filename: newFilename,
      imageCount: proxyImageUrls.length,
      uploadDate: new Date().toISOString(),
      imageUrls: proxyImageUrls // güncel görsel url'leri kaydet
    };

    // --- Bölümleri numaraya göre sırala ---
    manhwaData[seriesIndex].chapters.sort((a, b) => a.number - b.number);

    manhwaData[seriesIndex].lastUpdate = new Date().toISOString();

    // Mapping ile klasör adı
    const folderName = getChapterFolderName(seriesId);
    const chapterDir = path.join(__dirname, '../../client/chapters', folderName);
    const newChapterFile = path.join(chapterDir, newFilename);
    const oldChapterFile = path.join(chapterDir, oldFilename);

    // Gelişmiş HTML şablonu (bölüm3.html ile birebir uyumlu, dinamik alanlar backend'den)
    const chapterTitle = title || `Bölüm ${newChapterNumber}`;
    // manhwalar.json'u oku ve toplam bölüm sayısını bul
    let totalChapters = 1;
    try {
      const manhwaPath = path.join(__dirname, '../../client/data/manhwalar.json');
      const manhwaData = JSON.parse(await fs.readFile(manhwaPath, 'utf8'));
      const seriesIndex = manhwaData.findIndex(series => series.seriesId === seriesId);
      if (seriesIndex !== -1 && manhwaData[seriesIndex].chapters) {
        totalChapters = manhwaData[seriesIndex].chapters.length + 1; // yeni ekleneni de say
      }
    } catch {}
    const seriesDisplayName = seriesId;
    const seriesUrl = `../../series/${seriesId}/${seriesId}seri.html`;
    const chapterUrlPattern = `../${folderName}/bölüm{chapter}.html`;
    const imagesHtml = proxyImageUrls.map((url, index) => `<img src="${url}" alt="${chapterTitle} - Sayfa ${index + 1}" class="okuma-img" data-page="${index + 1}">`).join('\n    ');
    const resimListesiOptions = proxyImageUrls.map((_, j) => `<option value="${j+1}">${j+1} / ${proxyImageUrls.length}</option>`).join('');

    // --- Bölüm dropdown'u ve toplam bölüm sayısı için ---
    let allChaptersForDropdown = [];
    let bolumSecOptions = '';
    let totalChaptersReal = 1;
    let availableChaptersArray = [parseInt(newChapterNumber)]; // Default olarak current chapter
    
    if (manhwaData && manhwaData[seriesIndex] && Array.isArray(manhwaData[seriesIndex].chapters)) {
      allChaptersForDropdown = manhwaData[seriesIndex].chapters;
      totalChaptersReal = allChaptersForDropdown.length;
      availableChaptersArray = allChaptersForDropdown.map(ch => ch.number).sort((a, b) => a - b); // Mevcut tüm bölümler
      bolumSecOptions = allChaptersForDropdown
        .sort((a, b) => a.number - b.number)
        .map(ch => `<option value="${ch.number}"${ch.number === parseInt(newChapterNumber) ? ' selected' : ''}>Bölüm ${ch.number}</option>`) 
        .join('');
    } else {
      bolumSecOptions = `<option value="${newChapterNumber}" selected>Bölüm ${newChapterNumber}</option>`;
      totalChaptersReal = 1;
      availableChaptersArray = [parseInt(newChapterNumber)]; // Tek bölüm varsa sadece kendisi
    }

    const chapterTemplate = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${seriesDisplayName} - ${chapterTitle} | ToonNeko</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../styles/navbar.css">
  <link rel="stylesheet" href="../../styles/ornek-navbar-ek.css">
  <link rel="stylesheet" href="../../styles/seri.css">
  <link rel="stylesheet" href="../../styles/okuma.css">
  <link rel="stylesheet" href="../../styles/comments.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
  <style>
    body { opacity: 0; transition: opacity 1s ease-in; }
    body.loaded { opacity: 1; }
    button, .section-bar { transition: transform 0.2s, box-shadow 0.2s; }
    button:hover, .section-bar:hover { transform: scale(1.08); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
    #scrollTopBtn { display: none; position: fixed; bottom: 30px; right: 30px; z-index: 99; font-size: 22px; background: #222; color: #fff; border: none; border-radius: 50%; width: 48px; height: 48px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2); transition: background 0.3s, transform 0.2s, opacity 0.2s; opacity: 0.65; }
    #scrollTopBtn:hover { background: #ff6f61; transform: scale(1.1); opacity: 1; }
    .logo-link { display: flex; align-items: center; text-decoration: none !important; color: inherit !important; cursor: pointer; }
    .logo-link:visited, .logo-link:active, .logo-link:hover { color: inherit !important; text-decoration: none !important; }
    .logo-link img { margin-right: 8px; }
    .logo-area img { height: 64px !important; width: auto !important; }
    .logo-area span { font-size: 3.2rem !important; font-weight: bold !important; }
    .desktop-navbar { margin-left: 20px !important; }
    header { padding: 10px 15px !important; }
    @media (max-width: 1366px) {
      .hamburger { display: flex !important; }
      .side-menu, .side-overlay { display: block !important; }
      .desktop-navbar { display: none !important; }
    }
    @media (min-width: 1367px) {
      .hamburger { display: none !important; }
      .desktop-navbar { display: flex !important; }
    }
    .okuma-header { display: flex; align-items: center; justify-content: space-between; max-width: 1000px; margin: 40px auto 0 auto; padding-left: 20px; padding-right: 20px; }
    .okuma-header .seri-link { font-size: 1.2em; color: #ff6f61; text-decoration: none; display: flex; align-items: center; margin: 0 !important; padding: 0 !important; }
    .okuma-header .fav-btn { background: none; border: none; color: #ff6f61; font-size: 1.5em; cursor: pointer; display: flex; align-items: center; margin: 0 !important; padding: 8px 12px !important; position: relative; border-radius: 8px; transition: all 0.3s ease; z-index: 100; }
    .okuma-header .fav-btn i { font-family: 'Font Awesome 6 Free'; font-weight: 900; transition: all 0.3s ease; }
    .okuma-header .fav-btn .fa-bookmark { color: #ff6f61; transition: all 0.3s ease; }
    .okuma-header .fav-btn:hover { background: rgba(255, 111, 97, 0.1); transform: scale(1.1); }
    .okuma-header .fav-btn.bookmarked { color: #ff6f61; background: rgba(255, 111, 97, 0.2); animation: bookmark-pulse 2s ease-in-out; }
    .okuma-header .fav-btn.bookmarked i { color: #ff6f61; text-shadow: 0 0 8px rgba(255, 111, 97, 0.5); animation: bookmark-glow 2s ease-in-out; }
    .okuma-header .fav-btn.has-other-bookmark { color: #ffa500; animation: bookmark-warning 1s ease-in-out; }
    @keyframes bookmark-pulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 111, 97, 0.7); } 50% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(255, 111, 97, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 111, 97, 0); } }
    @keyframes bookmark-glow { 0%, 100% { text-shadow: 0 0 8px rgba(255, 111, 97, 0.5); } 50% { text-shadow: 0 0 15px rgba(255, 111, 97, 0.8), 0 0 25px rgba(255, 111, 97, 0.5); } }
    @keyframes bookmark-warning { 0%, 100% { transform: scale(1); } 25% { transform: scale(1.05) rotate(-2deg); } 75% { transform: scale(1.05) rotate(2deg); } }
    .okuma-header .fav-btn:active { transform: scale(0.95); transition: transform 0.1s ease; }
    .okuma-header .fav-btn.clicked { animation: bookmark-click 0.6s ease-out; }
    @keyframes bookmark-click { 0% { transform: scale(1); } 20% { transform: scale(1.2) rotate(5deg); } 40% { transform: scale(1.1) rotate(-3deg); } 60% { transform: scale(1.05) rotate(2deg); } 80% { transform: scale(1.02) rotate(-1deg); } 100% { transform: scale(1) rotate(0deg); } }
    .okuma-header .fav-btn.has-other-bookmark:hover { background: rgba(255, 165, 0, 0.1); }
    .okuma-header .fav-btn.bookmarked:hover { background: rgba(255, 111, 97, 0.3); }
    .okuma-nav { display: flex; align-items: center; justify-content: center; gap: 18px; margin: 24px 0 16px 0; flex-wrap: wrap; }
    .okuma-nav button, .okuma-nav a { padding: 10px 22px; border-radius: 8px; border: none; background: #222; color: #fff; font-size: 1.1em; cursor: pointer; text-decoration: none; transition: background 0.2s; display: flex; align-items: center; gap: 6px; }
    .okuma-nav button:disabled { background: #888; cursor: not-allowed; }
    .okuma-nav button:hover:not(:disabled) { background: #333; }
    .okuma-nav .info-btn { background: #ff6f61; color: #fff; }
    .okuma-nav .info-btn:hover { background: #e55a4d; }
    .okuma-nav span { font-size: 1.1em; font-weight: 600; color: #ff6f61; width: 100%; text-align: center; margin-bottom: 6px; }
    .okuma-nav-inner { display: flex; gap: 18px; justify-content: center; width: 100%; }
    @media (max-width: 600px) { .okuma-header { flex-direction: column; align-items: flex-start; gap: 8px; } .okuma-nav { flex-direction: column; gap: 0; margin: 18px 0 10px 0; } .okuma-nav span { order: -1; margin-bottom: 8px; } .okuma-nav-inner { flex-direction: row; gap: 10px; justify-content: center, width: 100%; } }
    .okuma-header .fav-btn { margin-left: 24px; margin-right: 0; position: relative; left: 0; right: 0; }
    @media (max-width: 600px) { .okuma-header { align-items: center; } .okuma-header .fav-btn { margin: 12px auto 0 auto; left: 0; right: 0; display: block; } }
    .okuma-alani { background: #181818; border-radius: 12px; padding: 16px; margin-bottom: 32px; display: flex; flex-direction: column; align-items: center; }
    .okuma-alani img { max-width: 100vw; width: 100vw; display: block; margin: 0; border-radius: 0; box-shadow: none; }
    @media (min-width: 601px) { .okuma-alani img { max-width: 700px; width: 80vw; margin: 0 auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); } }
    .comments { margin: 32px 0; }
    @media (max-width: 600px) { .okuma-header { flex-direction: column; align-items: flex-start; gap: 8px; } .okuma-nav { flex-direction: column; gap: 8px; } }
    .custom-select { border-radius: 18px; background: linear-gradient(90deg, #232323 60%, #ff6f61 100%); color: #fff; border: 2px solid #ff6f61; padding: 8px 18px; font-size: 1em; font-weight: 600; margin: 0 6px; outline: none; transition: border 0.2s, background 0.2s, color 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.08); cursor: pointer; }
    .custom-select:focus { border: 2px solid #fff; background: linear-gradient(90deg, #ff6f61 60%, #232323 100%); color: #fff; }
    .custom-select option { background: #232323; color: #ff6f61; border-radius: 12px; }
    body.okuma-sayfasi header { position: static !important; box-shadow: none; }
    body.okuma-sayfasi .search-container { background: rgba(18, 18, 18, 0.95); backdrop-filter: blur(10px); }
    body.okuma-sayfasi .okuma-alani { margin-top: 20px; }
    @media (max-width: 480px) { #scrollTopBtn { bottom: 20px; right: 20px; width: 40px; height: 40px; font-size: 18px; } }
    .okuma-stil-secici { display: flex; justify-content: center; align-items: center; gap: 12px; margin: 16px 0 24px 0; flex-wrap: wrap; }
    @media (max-width: 600px) { .okuma-stil-secici { flex-direction: column; gap: 8px; } .custom-select { margin: 4px 0; width: 200px; } }
    .alert { display: flex; align-items: center; gap: 12px; padding: 12px 16px; margin: 8px 0; border-radius: 8px; font-weight: 500; opacity: 1; transition: opacity 0.3s ease; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); position: relative; z-index: 1000; }
    .alert-success { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; border-left: 4px solid #2e7d32; }
    .alert-info { background: linear-gradient(135deg, #2196F3, #1976d2); color: white; border-left: 4px solid #1565c0; }
    .alert-error { background: linear-gradient(135deg, #f44336, #d32f2f); color: white; border-left: 4px solid #c62828; }
    .alert-close { background: none; border: none; color: inherit; cursor: pointer; padding: 4px; border-radius: 50%; transition: background 0.2s ease; margin-left: auto; }
    .alert-close:hover { background: rgba(255, 255, 255, 0.2); }
    #alert-box { position: fixed; top: 80px; right: 20px; z-index: 10000; max-width: 350px; }
    .chapter-notification { position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%); border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 12px; padding: 15px 20px; display: flex; align-items: center; gap: 10px; color: #333; z-index: 10000; transform: translateX(100%); opacity: 0; transition: all 0.3s ease; max-width: 400px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
    .chapter-notification.show { transform: translateX(0); opacity: 1; }
    .chapter-notification.success { border-left: 4px solid #4CAF50; }
    .chapter-notification.error { border-left: 4px solid #f44336; }
    .chapter-notification .notification-content { display: flex; align-items: center; gap: 10px; flex: 1; }
    .chapter-notification.success .notification-content i { color: #4CAF50; }
    .chapter-notification.error .notification-content i { color: #f44336; }
    .chapter-notification .notification-close { background: none; border: none; color: rgba(0, 0, 0, 0.5); cursor: pointer; padding: 5px; border-radius: 4px; transition: all 0.2s ease; }
    .chapter-notification .notification-close:hover { background: rgba(0, 0, 0, 0.1); color: #333; }
    @media (max-width: 480px) { .chapter-notification { top: 10px; right: 10px; left: 10px; max-width: none; } }
  </style>
</head>
<body class="okuma-sayfasi">
  <header>
    <div class="logo-area">
      <a href="../../index.html" class="logo-link">
        <img src="../../images/ToonNekoLogo.png" alt="Logo" />
        <span>ToonNeko</span>
      </a>
    </div>
    <nav class="desktop-navbar">
      <ul>
        <li><a href="../../index.html" style="text-decoration:none;" class="active">Anasayfa</a></li>
        <li><a href="../../tum-seriler.html" style="text-decoration:none;">Tüm Seriler</a></li>
        <li><a href="../../profile.html" style="text-decoration:none;">Profilim</a></li>
        <li><a href="../../hakkinda.html" style="text-decoration:none;">Hakkında</a></li>
        <li><a href="../../iletisim.html" style="text-decoration:none;">İletişim</a></li>
        <li id="auth-buttons-nav">
          <button id="open-register-modal-navbar" class="auth-btn">Kayıt Ol</button>
        </li>
        <li id="auth-buttons-nav-2">
          <button id="open-login-modal-navbar" class="auth-btn secondary">Giriş Yap</button>
        </li>
        <li id="user-info-nav" style="display: none;">
          <span id="username-display" class="username-display"></span>
        </li>
        <li id="user-info-nav-2" style="display: none;">
          <button id="logout-btn" class="auth-btn secondary">Çıkış Yap</button>
        </li>
      </ul>
    </nav>
    <div class="hamburger" id="hamburger"><span></span><span></span><span></span></div>
  </header>
  <nav class="side-menu" id="sideMenu">
    <button class="close-btn" id="closeMenu">×</button>
    <ul>
      <li><a href="../../index.html" style="text-decoration:none;" class="active">Anasayfa</a></li>
      <li><a href="../../tum-seriler.html" style="text-decoration:none;">Tüm Seriler</a></li>
      <li><a href="../../profile.html" style="text-decoration:none;">Profilim</a></li>
      <li><a href="../../hakkinda.html" style="text-decoration:none;">Hakkında</a></li>
      <li><a href="../../iletisim.html" style="text-decoration:none;">İletişim</a></li>
    </ul>
  </nav>
  <div class="side-overlay" id="sideOverlay"></div>
  <div id="alert-box"></div>
  <div class="search-container">
    <input type="text" id="search-input" placeholder="Manhwa ara...">
    <div id="search-results" class="results-box hidden"></div>
  </div>
  <div class="okuma-header">
    <a href="${seriesUrl}" class="seri-link"><i class="fa-solid fa-arrow-left"></i> ${seriesDisplayName}</a>
    <button class="fav-btn" id="bookmarkBtn" title="Bookmark'a ekle"><i class="fa-regular fa-bookmark"></i></button>
  </div>
  <div class="okuma-nav">
    <span id="chapterTitle">${chapterTitle}</span>
    <div class="okuma-nav-inner">
      <button id="navPrevBtn" style="display: none;"><i class="fa-solid fa-chevron-left"></i> <span id="prevBtnText">Önceki</span></button>
      <button id="navNextBtn"><i class="fa-solid fa-chevron-right"></i> <span id="nextBtnText">Sonraki</span></button>
      <a href="${seriesUrl}" class="info-btn" title="Seri Sayfası"><i class="fa-solid fa-circle-info"></i></a>
    </div>
  </div>
  <div class="okuma-stil-secici">
    <select id="stil" class="custom-select">
      <option value="list">Okuma Stili: Liste</option>
      <option value="page">Okuma Stili: Sayfa Sayfa</option>
    </select>
    <select id="bolumSec" class="custom-select">
      ${bolumSecOptions}
    </select>
    <select id="resimListesi" class="custom-select">
      ${resimListesiOptions}
    </select>
  </div>
  <div class="okuma-alani" id="okumaAlani">
    ${imagesHtml}
  </div>
  <div class="okuma-nav">
    <div class="okuma-nav-inner">
      <button id="navPrevBtn2" style="display: none;"><i class="fa-solid fa-chevron-left"></i> <span id="prevBtnText2">Önceki</span></button>
      <button id="navNextBtn2"><i class="fa-solid fa-chevron-right"></i> <span id="nextBtnText2">Sonraki</span></button>
      <a href="${seriesUrl}" class="info-btn" title="Seri Sayfası"><i class="fa-solid fa-circle-info"></i></a>
    </div>
  </div>
  <div class="comments-section" id="comments-${seriesId}-${newChapterNumber}"></div>
  <button id="scrollTopBtn" title="Yukarı Çık"><i class="fas fa-arrow-up"></i></button>
  <script>const CHAPTER_CONFIG = {seriesName: '${seriesId}', seriesDisplayName: '${seriesDisplayName}', currentChapter: ${newChapterNumber}, totalChapters: ${totalChaptersReal}, availableChapters: [${availableChaptersArray.join(', ')}], seriesUrl: '${seriesUrl}', chapterUrlPattern: '${chapterUrlPattern}'};</script>
  <script src="../../scripts/simple-navigation.js"></script>
  <script src="../../scripts/arama.js"></script>
  <script src="../../scripts/bookmark-manager.js"></script>
  <script src="../../scripts/reading-progress-tracker.js"></script>
  <script src="../../scripts/completed-series-tracker.js"></script>
  <script src="../../scripts/navbar.js"></script>
  <script src="../../scripts/auth-navbar.js"></script>
  <script src="../../scripts/auth-forms.js"></script>
  <script src="../../scripts/comments.js?v=40&unified=true" defer></script>
  <script src="../../scripts/chapters.js"></script>
  <script src="../../scripts/chapter-image-navigator.js"></script>
  <script src="../../scripts/okuma.js"></script>
  <script>
    // Admin Panel - Universal Navigation System
    let currentReadingMode = 'list';
    
    // Sayfa yüklendiğinde universal navigation'ı başlat
    document.addEventListener('DOMContentLoaded', function() {
      console.log('🔍 Admin Panel Chapter - Simple Navigation başlatılıyor');
      
      // Simple navigation otomatik olarak çalışır
      // Script tag ile yüklenmiş olması yeterli
    });
    
    function updateNavigationButtonsLegacy() {
      const { currentChapter, totalChapters, chapterUrlPattern } = CHAPTER_CONFIG;
      
      // Navigation buttons
      const navPrevBtn = document.getElementById('navPrevBtn');
      const navNextBtn = document.getElementById('navNextBtn');
      const navPrevBtn2 = document.getElementById('navPrevBtn2');
      const navNextBtn2 = document.getElementById('navNextBtn2');

      // Simple logic: currentChapter comparison (Solo Leveling style)
      
      // Previous buttons
      if (currentChapter === 1) {
        if (navPrevBtn) navPrevBtn.style.display = 'none';
        if (navPrevBtn2) navPrevBtn2.style.display = 'none';
      } else {
        if (navPrevBtn) {
          navPrevBtn.style.display = 'inline-flex';
          navPrevBtn.onclick = () => {
            const prevUrl = chapterUrlPattern.replace('{chapter}', currentChapter - 1);
            window.location.href = prevUrl;
          };
        }
        if (navPrevBtn2) {
          navPrevBtn2.style.display = 'inline-flex';
          navPrevBtn2.onclick = () => {
            const prevUrl = chapterUrlPattern.replace('{chapter}', currentChapter - 1);
            window.location.href = prevUrl;
          };
        }
      }
      
      // Next buttons
      if (currentChapter === totalChapters) {
        if (navNextBtn) navNextBtn.style.display = 'none';
        if (navNextBtn2) navNextBtn2.style.display = 'none';
      } else {
        if (navNextBtn) {
          navNextBtn.style.display = 'inline-flex';
          navNextBtn.onclick = () => {
            const nextUrl = chapterUrlPattern.replace('{chapter}', currentChapter + 1);
            window.location.href = nextUrl;
          };
        }
        if (navNextBtn2) {
          navNextBtn2.style.display = 'inline-flex';
          navNextBtn2.onclick = () => {
            const nextUrl = chapterUrlPattern.replace('{chapter}', currentChapter + 1);
            window.location.href = nextUrl;
          };
        }
      }
      
      console.log(\`🔄 Admin Navigation: Chapter \${currentChapter}/\${totalChapters} - Prev: \${currentChapter > 1}, Next: \${currentChapter < totalChapters}\`);
    }
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
      console.log('� Admin Panel Chapter Navigation Initialized');
      console.log('CHAPTER_CONFIG:', CHAPTER_CONFIG);
      
      // Navigation will be initialized by ToonNekoNavigation in DOMContentLoaded
      
      // Initialize comments - isolated instance
      if(typeof CommentsUI!=='undefined'){
        console.log('🔥 Admin Panel ${seriesId} Bölüm ${newChapterNumber} - CommentsUI başlatılıyor...');
        
        // Clear any potential shared state
        if(window.commentsUI){
          console.log('⚠️ Cleaning up previous commentsUI instance');
          delete window.commentsUI;
        }
        
        const seriesName='${seriesId}';
        const chapterNumber=${newChapterNumber};
        
        console.log(\`🎯 Creating CommentsUI: \${seriesName}, chapter: \${chapterNumber}\`);
        
        // Create isolated instance
        const commentsInstance=new CommentsUI(seriesName,chapterNumber);
        
        // Store for debugging only
        window.currentCommentsInstance=commentsInstance;
        
        console.log('✅ Admin Panel ${seriesId} Bölüm ${newChapterNumber} CommentsUI created');
      }
    });
    
    window.addEventListener('load',function(){document.body.classList.add('loaded');});
  </script>
</body>
</html>`;

    // Yeni dosyayı yaz
    await fs.writeFile(newChapterFile, chapterTemplate, 'utf8');

    // Eğer dosya adı değiştiyse eski dosyayı sil
    if (oldFilename !== newFilename) {
      try {
        await fs.unlink(oldChapterFile);
        console.log('Old chapter file deleted:', oldFilename);
      } catch (error) {
        console.log('Could not delete old file:', error.message);
      }
    }

    // manhwalar.json kaydet
    await fs.writeFile(manhwaPath, JSON.stringify(manhwaData, null, 2), 'utf8');

    res.json({ 
      success: true, 
      message: 'Bölüm başarıyla güncellendi',
      imageCount: proxyImageUrls.length
    });

  } catch (error) {
    console.error('Update chapter error:', error);
    res.status(500).json({ error: 'Bölüm güncellenirken hata oluştu' });
  }
});

// Unknown reading stats verilerini temizle
router.delete('/cleanup-unknown-stats', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const ReadingStats = require('../models/ReadingStats');
    
    // Unknown serilerini bul ve sil
    const result = await ReadingStats.deleteMany({
      $or: [
        { seriesId: 'unknown' },
        { seriesTitle: 'Unknown' }
      ]
    });
    
    console.log(`🧹 Temizlendi: ${result.deletedCount} adet "unknown" reading stats kaydı silindi`);
    
    res.json({
      success: true,
      message: `${result.deletedCount} adet unknown reading stats kaydı temizlendi`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Unknown stats cleanup error:', error);
    res.status(500).json({ error: 'Unknown stats temizlenemedi' });
  }
});

// Kullanıcı yönetimi endpoint'leri
router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select('username email isAdmin isBlocked createdAt lastLogin role moderatedSeries')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Kullanıcıları getirme hatası:', error);
    res.status(500).json({ error: 'Kullanıcılar getirilemedi' });
  }
});

// Kullanıcının admin durumunu değiştir
router.put('/users/:userId/admin', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { isAdmin: isAdmin },
      { new: true }
    ).select('username email isAdmin isBlocked');
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    res.json({
      success: true,
      message: `Kullanıcı ${isAdmin ? 'admin yapıldı' : 'admin yetkisi kaldırıldı'}`,
      user: user
    });
  } catch (error) {
    console.error('Admin durumu güncelleme hatası:', error);
    res.status(500).json({ error: 'Admin durumu güncellenemedi' });
  }
});

// Kullanıcıyı engelle/engeli kaldır
router.put('/users/:userId/block', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isBlocked } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { isBlocked: isBlocked },
      { new: true }
    ).select('username email isAdmin isBlocked');
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    res.json({
      success: true,
      message: `Kullanıcı ${isBlocked ? 'engellendi' : 'engeli kaldırıldı'}`,
      user: user
    });
  } catch (error) {
    console.error('Engelleme durumu güncelleme hatası:', error);
    res.status(500).json({ error: 'Engelleme durumu güncellenemedi' });
  }
});

// Kullanıcıyı sil
router.delete('/users/:userId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    res.json({
      success: true,
      message: 'Kullanıcı başarıyla silindi'
    });
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    res.status(500).json({ error: 'Kullanıcı silinemedi' });
  }
});

// Yeni kullanıcı oluştur
router.post('/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { username, email, password, isAdmin } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Tüm alanlar gerekli' });
    }
    
    // Kullanıcı adı ve email kontrolü
    const existingUser = await User.findOne({
      $or: [
        { username: username },
        { email: email }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Bu kullanıcı adı veya email zaten kullanılıyor' });
    }
    
    const newUser = new User({
      username,
      email,
      password, // User model'de hash'lenecek
      isAdmin: isAdmin || false
    });
    
    await newUser.save();
    
    res.json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        isBlocked: newUser.isBlocked
      }
    });
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error);
    res.status(500).json({ error: 'Kullanıcı oluşturulamadı' });
  }
});

// Moderatörlük için mevcut serileri getir
router.get('/available-series', verifyToken, verifyAdmin, async (req, res) => {
  try {
    // manhwalar.json dosyasından serileri al
    const clientPath = path.join(__dirname, '../../client');
    const manhwalarPath = path.join(clientPath, 'data', 'manhwalar.json');
    
    let seriesData = [];
    try {
      const manhwalarContent = await fs.readFile(manhwalarPath, 'utf8');
      const manhwalarJson = JSON.parse(manhwalarContent);
      // Dosya doğrudan array formatında
      if (Array.isArray(manhwalarJson)) {
        seriesData = manhwalarJson;
      } else if (manhwalarJson.manhwalar) {
        seriesData = manhwalarJson.manhwalar;
      }
    } catch (error) {
      console.log('manhwalar.json okunamadı, boş liste döndürülüyor');
    }
    
    // Seri listesini format'la
    const availableSeries = seriesData.map(series => ({
      id: series.seriesId || series.id,
      title: series.title || series.name,
      status: series.status || 'Devam Ediyor',
      chapters: series.chapterCount || series.chapters || 0
    }));
    
    res.json({
      success: true,
      series: availableSeries
    });
  } catch (error) {
    console.error('Mevcut serileri getirme hatası:', error);
    res.status(500).json({ error: 'Seriler getirilemedi' });
  }
});

// TEST ENDPOINTS - Geliştirme için geçici
router.get('/test-users', async (req, res) => {
  try {
    const users = await User.find({})
      .select('username email isAdmin isBlocked createdAt lastLogin role moderatedSeries')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Test kullanıcıları getirme hatası:', error);
    res.status(500).json({ error: 'Kullanıcılar getirilemedi' });
  }
});

router.get('/test-available-series', async (req, res) => {
  try {
    // manhwalar.json dosyasından serileri al
    const clientPath = path.join(__dirname, '../../client');
    const manhwalarPath = path.join(clientPath, 'data', 'manhwalar.json');
    
    let seriesData = [];
    try {
      const manhwalarContent = await fs.readFile(manhwalarPath, 'utf8');
      const manhwalarJson = JSON.parse(manhwalarContent);
      // Dosya doğrudan array formatında
      if (Array.isArray(manhwalarJson)) {
        seriesData = manhwalarJson;
      } else if (manhwalarJson.manhwalar) {
        seriesData = manhwalarJson.manhwalar;
      }
    } catch (error) {
      console.log('manhwalar.json okunamadı, boş liste döndürülüyor');
    }
    
    // Seri listesini format'la
    const availableSeries = seriesData.map(series => ({
      id: series.seriesId || series.id,
      title: series.title || series.name,
      status: series.status || 'Devam Ediyor',
      chapters: series.chapterCount || series.chapters || 0
    }));
    
    res.json({
      success: true,
      series: availableSeries
    });
  } catch (error) {
    console.error('Test mevcut serileri getirme hatası:', error);
    res.status(500).json({ error: 'Seriler getirilemedi' });
  }
});

module.exports = router;
