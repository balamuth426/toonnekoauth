// ToonNeko Chapter Update Utility
// Bu script yeni bölüm eklendiğinde tüm mevcut bölümlerin navigation'ını günceller

const fs = require('fs').promises;
const path = require('path');

class ChapterUpdateManager {
  constructor() {
    this.manhwalarPath = path.join(__dirname, '../../client/data/manhwalar.json');
  }

  async updateAllChapterNavigation(seriesId) {
    try {
      console.log(`🔄 ${seriesId} serisi için tüm bölümler güncelleniyor...`);
      
      // manhwalar.json'dan güncel bilgileri al
      const manhwalarData = await this.loadManhwalarData();
      const seriesData = manhwalarData.find(series => series.seriesId === seriesId);
      
      if (!seriesData) {
        throw new Error(`Seri bulunamadı: ${seriesId}`);
      }
      
      const totalChapters = seriesData.chapterCount || seriesData.availableChapters?.length || 0;
      const availableChapters = seriesData.availableChapters || [];
      
      console.log(`📊 ${seriesData.title}: ${totalChapters} toplam bölüm`);
      
      // Tüm mevcut bölüm dosyalarını güncelle
      await this.updateChapterFiles(seriesId, totalChapters, availableChapters);
      
      console.log(`✅ ${seriesData.title} navigation'ı başarıyla güncellendi`);
      return true;
      
    } catch (error) {
      console.error(`❌ Navigation güncelleme hatası:`, error);
      return false;
    }
  }

  async loadManhwalarData() {
    const data = await fs.readFile(this.manhwalarPath, 'utf8');
    return JSON.parse(data);
  }

  async updateChapterFiles(seriesId, totalChapters, availableChapters) {
    const chaptersDir = path.join(__dirname, `../../client/chapters/${seriesId} chapters`);
    
    try {
      const files = await fs.readdir(chaptersDir);
      const chapterFiles = files.filter(file => file.endsWith('.html'));
      
      for (const file of chapterFiles) {
        const filePath = path.join(chaptersDir, file);
        await this.updateSingleChapterFile(filePath, totalChapters, availableChapters);
      }
      
      console.log(`📁 ${chapterFiles.length} bölüm dosyası güncellendi`);
    } catch (error) {
      console.error(`❌ Bölüm dosyaları güncellenemedi:`, error);
    }
  }

  async updateSingleChapterFile(filePath, totalChapters, availableChapters) {
    try {
      let content = await fs.readFile(filePath, 'utf8');
      
      // Dosya adından bölüm numarasını çıkar
      const fileName = path.basename(filePath);
      const chapterMatch = fileName.match(/bölüm(\d+)\.html/);
      const chapterNumber = chapterMatch ? parseInt(chapterMatch[1]) : 1;
      
      // CHAPTER_CONFIG içindeki totalChapters değerini güncelle
      const totalChaptersRegex = /totalChapters:\s*\d+/g;
      content = content.replace(totalChaptersRegex, `totalChapters: ${totalChapters}`);
      
      // CHAPTER_CONFIG içindeki currentChapter değerini güncelle
      const currentChapterRegex = /currentChapter:\s*\d+/g;
      content = content.replace(currentChapterRegex, `currentChapter: ${chapterNumber}`);
      
      // Eski availableChapters array'ini kaldır (artık dynamic olarak manhwalar.json'dan çekiliyor)
      const availableChaptersRegex = /,?\s*availableChapters:\s*\[[^\]]*\][,\s]*/g;
      content = content.replace(availableChaptersRegex, ',\n    ');
      
      // CommentsUI çağrılarını düzelt - her bölüm kendi numarasını kullanmalı
      const commentsUIRegex = /new CommentsUI\('([^']+)',\s*\d+\)/g;
      content = content.replace(commentsUIRegex, `new CommentsUI('$1', ${chapterNumber})`);
      
      // ReadingTracker çağrılarını düzelt
      const readingTrackerRegex = /readingTracker\.trackReading\('([^']+)',\s*\d+,\s*'([^']+)',\s*'[^']+'\)/g;
      content = content.replace(readingTrackerRegex, `readingTracker.trackReading('$1', ${chapterNumber}, '$2', 'Bölüm ${chapterNumber}')`);
      
      await fs.writeFile(filePath, content, 'utf8');
      
      console.log(`✅ ${fileName} güncellendi (totalChapters: ${totalChapters}, currentChapter: ${chapterNumber}, comments: ${chapterNumber})`);
      
    } catch (error) {
      console.error(`❌ Dosya güncellenemedi ${filePath}:`, error);
    }
  }

  // Admin panel'den çağrılabilir
  static async refreshNavigationForSeries(seriesId) {
    const manager = new ChapterUpdateManager();
    return await manager.updateAllChapterNavigation(seriesId);
  }
}

module.exports = ChapterUpdateManager;
