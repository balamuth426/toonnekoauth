// Universal Chapter Update Manager
// Tüm serileri universal navigation sistemiyle güncelleyen utility

const fs = require('fs').promises;
const path = require('path');

class UniversalChapterUpdater {
  constructor() {
    this.manhwalarPath = path.join(__dirname, '../../client/data/manhwalar.json');
    this.chaptersDir = path.join(__dirname, '../../client/chapters');
  }

  async updateAllSeries() {
    try {
      console.log('🚀 Universal Chapter Update başlatılıyor...');
      
      // manhwalar.json'u oku
      const manhwalarData = await this.loadManhwalarData();
      
      // Array formatında mı kontrol et
      const seriesArray = Array.isArray(manhwalarData) ? manhwalarData : manhwalarData.series;
      
      if (!seriesArray) {
        throw new Error('Seri verisi bulunamadı');
      }
      
      for (const series of seriesArray) {
        await this.updateSeriesNavigation(series);
      }
      
      console.log('✅ Tüm seriler güncellendi!');
      return true;
    } catch (error) {
      console.error('❌ Universal update hatası:', error);
      return false;
    }
  }

  async loadManhwalarData() {
    const data = await fs.readFile(this.manhwalarPath, 'utf8');
    return JSON.parse(data);
  }

  async updateSeriesNavigation(series) {
    try {
      const seriesId = series.seriesId || series.id;
      const seriesName = series.title || series.name;
      const totalChapters = series.chapterCount || 0;
      
      console.log(`🔄 ${seriesName} serisi güncelleniyor...`);
      
      // Seri klasörünü bul
      const possibleFolderNames = [
        `${seriesId} chapters`,
        `${seriesId.toLowerCase()} chapters`,
        `${seriesId.replace('-', '')} chapters`,
        `${seriesId.replace('-', ' ')} chapters`
      ];
      
      let seriesFolderPath = null;
      for (const folderName of possibleFolderNames) {
        const testPath = path.join(this.chaptersDir, folderName);
        try {
          await fs.access(testPath);
          seriesFolderPath = testPath;
          break;
        } catch (error) {
          // Klasör bulunamadı, devam et
        }
      }
      
      if (!seriesFolderPath) {
        console.log(`⚠️ Klasör bulunamadı: ${seriesId}`);
        return;
      }
      
      console.log(`📁 Klasör bulundu: ${path.basename(seriesFolderPath)}`);
      
      // Bölüm dosyalarını güncelle
      for (let i = 1; i <= totalChapters; i++) {
        const chapterFile = path.join(seriesFolderPath, `bölüm${i}.html`);
        
        try {
          await fs.access(chapterFile);
          await this.updateChapterFile(chapterFile, series, i, totalChapters);
        } catch (error) {
          console.log(`⚠️ Bölüm ${i} dosyası bulunamadı: ${seriesName}`);
        }
      }
      
      console.log(`✅ ${seriesName} güncellendi (${totalChapters} bölüm)`);
    } catch (error) {
      console.error(`❌ ${series.title || series.name} güncellenirken hata:`, error);
    }
  }

  async updateChapterFile(filePath, series, chapterNumber, totalChapters) {
    try {
      let content = await fs.readFile(filePath, 'utf8');
      
      const seriesId = series.seriesId || series.id;
      const seriesName = series.title || series.name;
      
      // CHAPTER_CONFIG'i güncelle
      const newConfig = `const CHAPTER_CONFIG = {
      seriesName: '${seriesId}',
      seriesDisplayName: '${seriesName}',
      currentChapter: ${chapterNumber},
      totalChapters: ${totalChapters},
      seriesUrl: '../../series/${seriesId}/${seriesId}seri.html',
      chapterUrlPattern: '../${path.basename(path.dirname(filePath))}/bölüm{chapter}.html'
    };`;
      
      // Eski CHAPTER_CONFIG'i değiştir
      content = content.replace(
        /const CHAPTER_CONFIG = \{[\s\S]*?\};/,
        newConfig
      );
      
      // Universal navigation script'ini ekle/güncelle
      if (!content.includes('tooneko-navigation-universal.js')) {
        // Eski navigation script'lerini değiştir
        content = content.replace(
          /src="[^"]*tooneko-navigation[^"]*\.js"/g,
          'src="../../scripts/tooneko-navigation-universal.js"'
        );
        
        // Eğer hiç navigation script'i yoksa ekle
        if (!content.includes('tooneko-navigation')) {
          content = content.replace(
            /(<script src="[^"]*chapter-selector\.js"[^>]*>)/,
            '<script src="../../scripts/tooneko-navigation-universal.js" defer></script>\n  $1'
          );
        }
      }
      
      // DOMContentLoaded fonksiyonunu güncelle
      const newDOMContent = `document.addEventListener('DOMContentLoaded', function() {
      console.log('🔍 ${seriesName} Chapter ${chapterNumber} - Universal Navigation başlatılıyor');
      console.log('CHAPTER_CONFIG:', CHAPTER_CONFIG);
      
      // Universal navigation'ı başlat
      if (typeof ToonNekoNavigationUniversal !== 'undefined') {
        window.toonNekoNav = new ToonNekoNavigationUniversal(CHAPTER_CONFIG);
        console.log('✅ ${seriesName} ToonNekoNavigationUniversal başlatıldı');
      } else if (typeof ToonNekoNavigation !== 'undefined') {
        window.toonNekoNav = new ToonNekoNavigation(CHAPTER_CONFIG);
        console.log('✅ ${seriesName} ToonNekoNavigation (fallback) başlatıldı');
      } else {
        console.error('❌ Navigation bulunamadı, fallback kullanılıyor');
        if (typeof updateNavigationButtons === 'function') {
          updateNavigationButtons();
        }
      }
    });`;
      
      // Eski DOMContentLoaded'ı değiştir
      content = content.replace(
        /document\.addEventListener\('DOMContentLoaded',\s*function\(\)\s*\{[\s\S]*?\}\);/,
        newDOMContent
      );
      
      // CommentsUI'yi güncelle
      content = content.replace(
        /new CommentsUI\('[^']+',\s*\d+\)/g,
        `new CommentsUI('${seriesId}', ${chapterNumber})`
      );
      
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`  ✅ ${seriesName} Bölüm ${chapterNumber} güncellendi`);
      
    } catch (error) {
      console.error(`  ❌ ${filePath} güncellenirken hata:`, error);
    }
  }

  // Silinen bölüm referanslarını temizle
  async cleanupDeletedChapters() {
    try {
      console.log('🧹 Silinen bölüm referansları temizleniyor...');
      
      const manhwalarData = await this.loadManhwalarData();
      const seriesArray = Array.isArray(manhwalarData) ? manhwalarData : manhwalarData.series;
      
      for (const series of seriesArray) {
        const seriesId = series.seriesId || series.id;
        const totalChapters = series.chapterCount || 0;
        
        // Seri klasörünü bul
        const possibleFolderNames = [
          `${seriesId} chapters`,
          `${seriesId.toLowerCase()} chapters`,
          `${seriesId.replace('-', '')} chapters`,
          `${seriesId.replace('-', ' ')} chapters`
        ];
        
        for (const folderName of possibleFolderNames) {
          const seriesFolderPath = path.join(this.chaptersDir, folderName);
          
          try {
            await fs.access(seriesFolderPath);
            
            // Fazla bölüm dosyalarını sil
            for (let i = totalChapters + 1; i <= 20; i++) {
              const chapterFile = path.join(seriesFolderPath, `bölüm${i}.html`);
              
              try {
                await fs.access(chapterFile);
                await fs.unlink(chapterFile);
                console.log(`🗑️ Silindi: ${series.title || series.name} Bölüm ${i}`);
              } catch (error) {
                // Dosya zaten yok
              }
            }
            
            break;
          } catch (error) {
            // Klasör bulunamadı
          }
        }
      }
      
      console.log('✅ Cleanup tamamlandı');
    } catch (error) {
      console.error('❌ Cleanup hatası:', error);
    }
  }

  // Belirli bir seri için güncelleme
  async updateSingleSeries(seriesId) {
    try {
      const manhwalarData = await this.loadManhwalarData();
      const seriesArray = Array.isArray(manhwalarData) ? manhwalarData : manhwalarData.series;
      
      const series = seriesArray.find(s => (s.seriesId || s.id) === seriesId);
      
      if (!series) {
        console.error(`❌ Seri bulunamadı: ${seriesId}`);
        return false;
      }
      
      await this.updateSeriesNavigation(series);
      return true;
    } catch (error) {
      console.error(`❌ ${seriesId} güncellenirken hata:`, error);
      return false;
    }
  }
}

module.exports = UniversalChapterUpdater;
