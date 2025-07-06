// Duplicate loading guard
if (window.ReadingProgressTracker) {
  console.log('ReadingProgressTracker already loaded, skipping...');
} else {
  // Reading Progress Tracker
  // Bu dosya kullanıcının okuma ilerlemesini takip eder

  class ReadingProgressTracker {
  constructor() {
    this.storageKey = 'toonNeko_readingProgress';
    this.readingHistory = this.loadReadingHistory();
    this.init();
  }

  init() {
    console.log('ReadingProgressTracker initialized');
    console.log('Current reading history:', this.readingHistory);
  }

  loadReadingHistory() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {
        chaptersRead: [],
        totalChapters: 0,
        seriesProgress: {},
        readingDates: {}
      };
    } catch (error) {
      console.error('Error loading reading history:', error);
      return {
        chaptersRead: [],
        totalChapters: 0,
        seriesProgress: {},
        readingDates: {}
      };
    }
  }

  saveReadingHistory() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.readingHistory));
      console.log('Reading history saved:', this.readingHistory);
    } catch (error) {
      console.error('Error saving reading history:', error);
    }
  }

  // Bölüm okundu olarak işaretler
  markChapterAsRead(series, chapter) {
    const chapterKey = `${series}_${chapter}`;
    
    // Eğer daha önce okunmamışsa ekle
    if (!this.readingHistory.chaptersRead.includes(chapterKey)) {
      this.readingHistory.chaptersRead.push(chapterKey);
      this.readingHistory.totalChapters++;
      
      // Seri progress'ini güncelle
      if (!this.readingHistory.seriesProgress[series]) {
        this.readingHistory.seriesProgress[series] = [];
      }
      if (!this.readingHistory.seriesProgress[series].includes(chapter)) {
        this.readingHistory.seriesProgress[series].push(chapter);
        this.readingHistory.seriesProgress[series].sort((a, b) => a - b);
      }
      
      // Okuma tarihini kaydet
      this.readingHistory.readingDates[chapterKey] = new Date().toISOString();
      
      this.saveReadingHistory();
      console.log(`Chapter marked as read: ${series} - Chapter ${chapter}`);
      
      return true; // Yeni bölüm okundu
    }
    
    return false; // Zaten okunmuştu
  }

  // Belirli bir bölümün okunup okunmadığını kontrol eder
  isChapterRead(series, chapter) {
    const chapterKey = `${series}_${chapter}`;
    return this.readingHistory.chaptersRead.includes(chapterKey);
  }

  // Toplam okunan bölüm sayısını döndürür
  getTotalChaptersRead() {
    return this.readingHistory.totalChapters;
  }

  // Belirli bir serinin progress'ini döndürür
  getSeriesProgress(series) {
    return this.readingHistory.seriesProgress[series] || [];
  }

  // Tüm serilerin progress'ini döndürür
  getAllSeriesProgress() {
    return this.readingHistory.seriesProgress;
  }

  // Bu hafta okunan bölüm sayısını döndürür
  getChaptersReadThisWeek() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    let weeklyCount = 0;
    
    for (const [chapterKey, dateStr] of Object.entries(this.readingHistory.readingDates)) {
      const readDate = new Date(dateStr);
      if (readDate >= oneWeekAgo) {
        weeklyCount++;
      }
    }
    
    return weeklyCount;
  }

  // Son okuma aktivitesini döndürür
  getLastReadingActivity() {
    const dates = Object.values(this.readingHistory.readingDates);
    if (dates.length === 0) return null;
    
    const latestDate = dates.reduce((latest, current) => {
      return new Date(current) > new Date(latest) ? current : latest;
    });
    
    return new Date(latestDate);
  }

  // Okuma istatistiklerini döndürür
  getReadingStats() {
    return {
      totalChapters: this.getTotalChaptersRead(),
      weeklyChapters: this.getChaptersReadThisWeek(),
      totalSeries: Object.keys(this.readingHistory.seriesProgress).length,
      lastActivity: this.getLastReadingActivity(),
      averagePerWeek: this.calculateWeeklyAverage()
    };
  }

  // Haftalık ortalama hesaplar
  calculateWeeklyAverage() {
    if (this.readingHistory.totalChapters === 0) return 0;
    
    const dates = Object.values(this.readingHistory.readingDates);
    if (dates.length === 0) return 0;
    
    const firstRead = new Date(Math.min(...dates.map(d => new Date(d))));
    const now = new Date();
    const weeksPassed = Math.max(1, Math.ceil((now - firstRead) / (7 * 24 * 60 * 60 * 1000)));
    
    return Math.round((this.readingHistory.totalChapters / weeksPassed) * 10) / 10;
  }

  // Tüm verileri temizler
  clearAllData() {
    this.readingHistory = {
      chaptersRead: [],
      totalChapters: 0,
      seriesProgress: {},
      readingDates: {}
    };
    this.saveReadingHistory();
    console.log('All reading history cleared');
  }

  // Veriyi dışa aktarır
  exportData() {
    return JSON.stringify(this.readingHistory, null, 2);
  }

  // Veriyi içe aktarır
  importData(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      this.readingHistory = imported;
      this.saveReadingHistory();
      console.log('Reading history imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing reading history:', error);
      return false;
    }
  }
}

  // Global instance oluştur
  window.readingProgressTracker = null;

  // DOM yüklendiğinde başlat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
    });
  } else {
  }

  console.log('reading-progress-tracker.js loaded successfully!');
}
