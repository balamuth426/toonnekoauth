const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Manhwa bilgilerini getir
router.get('/', (req, res) => {
  try {
    const manhwaPath = path.join(__dirname, '../../client/data/manhwalar.json');
    const manhwaData = JSON.parse(fs.readFileSync(manhwaPath, 'utf8'));
    res.json(manhwaData);
  } catch (error) {
    console.error('Manhwa data read error:', error);
    res.status(500).json({ error: 'Manhwa verileri okunamadı' });
  }
});

// Tüm serilerin bölüm sayılarını senkronize et (SADECE MANUEL ÇAĞRILMALI)
router.post('/sync-chapters', async (req, res) => {
  try {
    console.log('⚠️ SYNC-CHAPTERS çağrıldı - Bu işlem dikkatli kullanılmalı!');
    const { forceSync } = req.body;
    
    // Güvenlik önlemi: Sadece force parametresi ile çalışsın
    if (!forceSync) {
      return res.status(400).json({ 
        error: 'Bu endpoint sadece manuel senkronizasyon için kullanılmalıdır. forceSync: true parametresi gerekli.' 
      });
    }
    
    const manhwaPath = path.join(__dirname, '../../client/data/manhwalar.json');
    const manhwaData = JSON.parse(fs.readFileSync(manhwaPath, 'utf8'));
    
    // Her seri için bölüm sayısını kontrol et ve güncelle
    for (let manhwa of manhwaData) {
      if (manhwa.seriesId) {
        const seriesFolderMap = {
          'sololeveling': 'solo leveling chapters',
          'nanomachine': 'nanomachine chapters', 
          'damnreincarnation': 'damn reincarnation chapters',
          'martialgodregressedtolevel2': 'martial god regressed to level 2 chapters',
          'omniscientreader': 'omniscient reader chapters'
        };
        
        const folderName = seriesFolderMap[manhwa.seriesId];
        if (folderName) {
          const chaptersPath = path.join(__dirname, '../../client/chapters', folderName);
          
          if (fs.existsSync(chaptersPath)) {
            const files = fs.readdirSync(chaptersPath);
            const htmlFiles = files.filter(file => file.endsWith('.html'));
            
            // Bölüm numaralarını extract et ve detaylı bilgi oluştur
            const chapters = htmlFiles.map(file => {
              const match = file.match(/bölüm(\d+)\.html/);
              if (match) {
                const chapterNum = parseInt(match[1]);
                return {
                  number: chapterNum,
                  filename: file,
                  url: `chapters/${encodeURIComponent(folderName)}/${file}`
                };
              }
              return null;
            }).filter(chapter => chapter !== null).sort((a, b) => b.number - a.number); // Büyükten küçüğe sırala
            
            // Manhwa bilgilerini güncelle
            manhwa.chapterCount = chapters.length;
            manhwa.lastChapter = chapters.length > 0 ? `Bölüm ${chapters[0].number}` : null;
            manhwa.availableChapters = chapters.map(ch => ch.number); // Sadece numaralar
            manhwa.chapterDetails = chapters; // ✅ YENİ: Detaylı bölüm bilgileri (URL'ler dahil)
            manhwa.lastUpdated = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            
            console.log(`Updated ${manhwa.title}: chapterDetails =`, chapters);
          } else {
            manhwa.chapterCount = 0;
            manhwa.lastChapter = null;
            manhwa.availableChapters = []; // ✅ YENİ: Boş liste
            manhwa.chapterDetails = []; // ✅ YENİ: Boş detay listesi
          }
        }
      }
    }
    
    // Güncellenmiş veriyi dosyaya yaz
    fs.writeFileSync(manhwaPath, JSON.stringify(manhwaData, null, 2), 'utf8');
    
    res.json({ 
      message: 'Manhwa chapter counts synchronized successfully',
      data: manhwaData 
    });
    
  } catch (error) {
    console.error('Manhwa sync error:', error);
    res.status(500).json({ error: 'Manhwa senkronizasyonu başarısız' });
  }
});

// Tek bir manhwa'nın bölüm sayısını güncelle (SADECE MANUEL ÇAĞRILMALI)
router.post('/sync-chapters/:seriesId', async (req, res) => {
  try {
    const { seriesId } = req.params;
    const { forceSync } = req.body;
    
    console.log(`⚠️ SYNC-CHAPTERS çağrıldı: ${seriesId} - Bu işlem dikkatli kullanılmalı!`);
    
    // Güvenlik önlemi: Sadece force parametresi ile çalışsın
    if (!forceSync) {
      return res.status(400).json({ 
        error: 'Bu endpoint sadece manuel senkronizasyon için kullanılmalıdır. forceSync: true parametresi gerekli.' 
      });
    }
    const manhwaPath = path.join(__dirname, '../../client/data/manhwalar.json');
    const manhwaData = JSON.parse(fs.readFileSync(manhwaPath, 'utf8'));
    
    const manhwa = manhwaData.find(m => m.seriesId === seriesId);
    if (!manhwa) {
      return res.status(404).json({ error: 'Manhwa bulunamadı' });
    }
    
    const seriesFolderMap = {
      'sololeveling': 'solo leveling chapters',
      'nanomachine': 'nanomachine chapters', 
      'damnreincarnation': 'damn reincarnation chapters',
      'martialgodregressedtolevel2': 'martial god regressed to level 2 chapters',
      'omniscientreader': 'omniscient reader chapters'
    };
    
    const folderName = seriesFolderMap[seriesId];
    if (!folderName) {
      return res.status(400).json({ error: 'Geçersiz seri ID' });
    }
    
    const chaptersPath = path.join(__dirname, '../../client/chapters', folderName);
    
    if (fs.existsSync(chaptersPath)) {
      const files = fs.readdirSync(chaptersPath);
      const htmlFiles = files.filter(file => file.endsWith('.html'));
      
      const chapters = htmlFiles.map(file => {
        const match = file.match(/bölüm(\d+)\.html/);
        if (match) {
          const chapterNum = parseInt(match[1]);
          return {
            number: chapterNum,
            filename: file,
            url: `chapters/${encodeURIComponent(folderName)}/${file}`
          };
        }
        return null;
      }).filter(chapter => chapter !== null).sort((a, b) => b.number - a.number); // Büyükten küçüğe sırala
      
      manhwa.chapterCount = chapters.length;
      manhwa.lastChapter = chapters.length > 0 ? `Bölüm ${chapters[0].number}` : null;
      manhwa.availableChapters = chapters.map(ch => ch.number); // Sadece numaralar
      manhwa.chapterDetails = chapters; // ✅ YENİ: Detaylı bölüm bilgileri (URL'ler dahil)
      manhwa.lastUpdated = new Date().toISOString().split('T')[0];
    } else {
      manhwa.chapterCount = 0;
      manhwa.lastChapter = null;
      manhwa.availableChapters = []; // ✅ YENİ: Boş liste
      manhwa.chapterDetails = []; // ✅ YENİ: Boş detay listesi
    }
    
    fs.writeFileSync(manhwaPath, JSON.stringify(manhwaData, null, 2), 'utf8');
    
    res.json({ 
      message: `${manhwa.title} chapter count updated successfully`,
      manhwa: manhwa 
    });
    
  } catch (error) {
    console.error('Single manhwa sync error:', error);
    res.status(500).json({ error: 'Manhwa güncelleme başarısız' });
  }
});

// Seri düzenleme endpoint'i
router.put('/edit', async (req, res) => {
  try {
    const { seriesId, title, status, summary, image, author, artist, publisher, genres, label, removeLabel } = req.body;
    
    if (!seriesId || !title || !status || !image) {
      return res.status(400).json({ error: 'Zorunlu alanlar eksik (seriesId, title, status, image)' });
    }

    const manhwaPath = path.join(__dirname, '../../client/data/manhwalar.json');
    const manhwaData = JSON.parse(fs.readFileSync(manhwaPath, 'utf8'));
    
    // Seriyi bul
    const seriesIndex = manhwaData.findIndex(series => series.seriesId === seriesId);
    if (seriesIndex === -1) {
      return res.status(404).json({ error: 'Seri bulunamadı' });
    }

    // Seri bilgilerini güncelle
    const series = manhwaData[seriesIndex];
    series.title = title;
    series.status = status;
    series.summary = summary;
    series.image = image;
    series.author = author || '';
    series.artist = artist || '';
    series.publisher = publisher || '';
    series.genres = Array.isArray(genres) ? genres : [];
    
    // Etiket işleme
    if (removeLabel) {
      // Etiketi tamamen kaldır
      delete series.label;
    } else if (label) {
      // Etiket ekle/güncelle
      series.label = {
        enabled: Boolean(label.enabled),
        text: label.text || 'Yeni',
        color: label.color || '#4CAF50'
      };
    }
    
    series.lastUpdate = new Date().toISOString();

    // JSON dosyasını güncelle
    fs.writeFileSync(manhwaPath, JSON.stringify(manhwaData, null, 2), 'utf8');
    
    res.json({ 
      success: true, 
      message: `${title} başarıyla güncellendi`,
      series: series
    });
    
  } catch (error) {
    console.error('Series edit error:', error);
    res.status(500).json({ error: 'Seri güncelleme başarısız' });
  }
});

module.exports = router;
