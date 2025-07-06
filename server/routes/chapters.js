const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Belirli bir serinin bölümlerini getir
router.get('/:seriesId', async (req, res) => {
  try {
    const { seriesId } = req.params;
    console.log(`📚 API: Getting chapters for series: ${seriesId}`);
    
    // Önce manhwalar.json'dan seri bilgisini al
    const manhwalarPath = path.join(__dirname, '../../client/data/manhwalar.json');
    
    if (!fs.existsSync(manhwalarPath)) {
      return res.status(404).json({ error: 'Manhwalar dosyası bulunamadı.' });
    }
    
    const manhwalarData = JSON.parse(fs.readFileSync(manhwalarPath, 'utf8'));
    
    // Seriyi bul
    const series = manhwalarData.find(s => s.seriesId === seriesId);
    
    if (!series) {
      return res.status(404).json({ error: 'Seri bulunamadı.' });
    }
    
    // Eğer seri manhwalar.json'da chapters alanına sahipse, oradan al
    if (series.chapters && Array.isArray(series.chapters) && series.chapters.length > 0) {
      // Klasör adı mapping'i
      const seriesFolderMap = {
        'sololeveling': 'solo leveling chapters',
        'nanomachine': 'nanomachine chapters', 
        'damnreincarnation': 'damn reincarnation chapters',
        'martialgodregressedtolevel2': 'martial god regressed to level 2 chapters',
        'omniscientreader': 'omniscient reader chapters',
        'blackcrow': 'blackcrow chapters'
      };
      
      const folderName = seriesFolderMap[seriesId] || `${seriesId} chapters`;
      
      const chapters = series.chapters.map(chapter => ({
        number: chapter.number,
        title: chapter.title || `Bölüm ${chapter.number}`,
        filename: chapter.filename,
        url: chapter.url || `chapters/${folderName}/${chapter.filename}`
      }));
      
      return res.json({ 
        series: seriesId,
        totalChapters: chapters.length,
        chapters: chapters 
      });
    }
    
    // Fallback: Eski sistem - klasörden dosyaları oku
    const seriesFolderMap = {
      'sololeveling': 'solo leveling chapters',
      'nanomachine': 'nanomachine chapters', 
      'damnreincarnation': 'damn reincarnation chapters',
      'martialgodregressedtolevel2': 'martial god regressed to level 2 chapters',
      'omniscientreader': 'omniscient reader chapters',
      'blackcrow': 'blackcrow chapters'
    };
    
    const folderName = seriesFolderMap[seriesId] || `${seriesId} chapters`;
    const chaptersPath = path.join(__dirname, '../../client/chapters', folderName);
    
    // Klasör var mı kontrol et
    if (!fs.existsSync(chaptersPath)) {
      return res.json({ chapters: [], totalChapters: 0 }); // Boş liste döndür
    }
    
    // Klasördeki HTML dosyalarını listele
    const files = fs.readdirSync(chaptersPath);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    // Bölüm numaralarını extract et ve sırala
    const chapters = htmlFiles.map(file => {
      const match = file.match(/bölüm(\d+)\.html/);
      if (match) {
        const chapterNum = parseInt(match[1]);
        return {
          number: chapterNum,
          title: `Bölüm ${chapterNum}`,
          filename: file,
          url: `chapters/${folderName}/${file}`
        };
      }
      return null;
    }).filter(chapter => chapter !== null);
    
    // Bölüm numarasına göre sırala
    chapters.sort((a, b) => a.number - b.number);
    
    res.json({ 
      series: seriesId,
      totalChapters: chapters.length,
      chapters: chapters 
    });
    
  } catch (err) {
    console.error('Chapters API error:', err);
    res.status(500).json({ error: 'Bölümler alınamadı.' });
  }
});

module.exports = router;
