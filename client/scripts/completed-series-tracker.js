// Completed Series Tracker
// Bu dosya kullanıcının tamamladığı serileri yönetir

class CompletedSeriesTracker {
  constructor() {
    this.storageKey = 'toonNeko_completedSeries';
    this.completedSeries = this.loadCompletedSeries();
    this.seriesData = this.loadSeriesData();
    this.init();
  }

  init() {
    console.log('CompletedSeriesTracker initialized');
    console.log('Current completed series:', this.completedSeries);
  }

  loadCompletedSeries() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {
        manuallyCompleted: [],
        completionDates: {},
        ratings: {},
        reviews: {}
      };
    } catch (error) {
      console.error('Error loading completed series:', error);
      return {
        manuallyCompleted: [],
        completionDates: {},
        ratings: {},
        reviews: {}
      };
    }
  }

  // Seri verilerini yükle (toplam bölüm sayıları vs)
  loadSeriesData() {
    return {
      'sololeveling': {
        title: 'Solo Leveling',
        totalChapters: 2, // Şu an sistemde bulunan
        image: 'images/kapaklar/sololeveling.jpg'
      },
      'nanomachine': {
        title: 'Nano Machine',
        totalChapters: 3,
        image: 'images/kapaklar/NanoMachine.png'
      },
      'omniscientreader': {
        title: 'Omniscient Reader',
        totalChapters: 1,
        image: 'images/kapaklar/omniscient.jpg.webp'
      },
      'damnreincarnation': {
        title: 'Damn Reincarnation',
        totalChapters: 0,
        image: 'images/kapaklar/DamnReincarnation.png'
      },
      'martialgodregressedtolevel2': {
        title: 'Martial God Regressed to Level 2',
        totalChapters: 0,
        image: 'images/kapaklar/martialGodRegressedToLevel2.webp'
      }
      // Daha fazla seri eklenebilir
    };
  }

  saveCompletedSeries() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.completedSeries));
      console.log('Completed series saved:', this.completedSeries);
    } catch (error) {
      console.error('Error saving completed series:', error);
    }
  }

  // Seriyi manuel olarak tamamlanmış işaretle
  markSeriesAsCompleted(seriesKey, rating = null, review = null) {
    if (!this.completedSeries.manuallyCompleted.includes(seriesKey)) {
      this.completedSeries.manuallyCompleted.push(seriesKey);
      this.completedSeries.completionDates[seriesKey] = new Date().toISOString();
      
      if (rating) {
        this.completedSeries.ratings[seriesKey] = rating;
      }
      
      if (review) {
        this.completedSeries.reviews[seriesKey] = review;
      }
      
      this.saveCompletedSeries();
      console.log(`Series marked as completed: ${seriesKey}`);
      return true;
    }
    return false;
  }

  // Seriyi tamamlanmış listesinden kaldır
  unmarkSeriesAsCompleted(seriesKey) {
    const index = this.completedSeries.manuallyCompleted.indexOf(seriesKey);
    if (index > -1) {
      this.completedSeries.manuallyCompleted.splice(index, 1);
      delete this.completedSeries.completionDates[seriesKey];
      delete this.completedSeries.ratings[seriesKey];
      delete this.completedSeries.reviews[seriesKey];
      
      this.saveCompletedSeries();
      console.log(`Series unmarked as completed: ${seriesKey}`);
      return true;
    }
    return false;
  }

  // Serinin tamamlanmış olup olmadığını kontrol et
  isSeriesCompleted(seriesKey) {
    return this.completedSeries.manuallyCompleted.includes(seriesKey);
  }

  // Tamamlanmış tüm serileri getir
  getAllCompletedSeries() {
    return this.completedSeries.manuallyCompleted.map(seriesKey => {
      const seriesInfo = this.seriesData[seriesKey];
      return {
        key: seriesKey,
        title: seriesInfo?.title || seriesKey,
        image: seriesInfo?.image || 'images/default-cover.jpg',
        totalChapters: seriesInfo?.totalChapters || 0,
        completionDate: this.completedSeries.completionDates[seriesKey],
        rating: this.completedSeries.ratings[seriesKey],
        review: this.completedSeries.reviews[seriesKey],
        readProgress: this.getSeriesReadProgress(seriesKey)
      };
    });
  }

  // Kullanıcının bu seriyi ne kadar okuduğunu hesapla
  getSeriesReadProgress(seriesKey) {
    if (!window.readingProgressTracker) return { read: 0, total: 0, percentage: 0 };
    
    const readChapters = window.readingProgressTracker.getSeriesProgress(seriesKey);
    const totalChapters = this.seriesData[seriesKey]?.totalChapters || 0;
    const readCount = readChapters.length;
    const percentage = totalChapters > 0 ? Math.round((readCount / totalChapters) * 100) : 0;
    
    return {
      read: readCount,
      total: totalChapters,
      percentage: percentage
    };
  }

  // Seri için tamamlanma önerisi yap
  suggestCompletionForSeries(seriesKey) {
    const progress = this.getSeriesReadProgress(seriesKey);
    const seriesInfo = this.seriesData[seriesKey];
    
    if (!seriesInfo) return { shouldSuggest: false };
    
    // Zaten tamamlanmış mı kontrol et
    if (this.isSeriesCompleted(seriesKey)) {
      return { shouldSuggest: false, reason: 'already_completed' };
    }
    
    // Toplam bölüm sayısı 0 ise veya okunan bölüm 0 ise öneri yok
    if (seriesInfo.totalChapters === 0 || progress.read === 0) {
      return { shouldSuggest: false, reason: 'no_chapters_or_not_read' };
    }
    
    // En az 1 bölüm okunmuş olmalı
    if (progress.read < 1) {
      return { shouldSuggest: false, reason: 'not_started_reading' };
    }
    
    // Eğer tüm bölümleri okumuşsa kesinlikle öner
    if (progress.read >= seriesInfo.totalChapters && seriesInfo.totalChapters > 0) {
      return {
        shouldSuggest: true,
        priority: 'high',
        message: `🎉 ${seriesInfo.title} serisini tamamen okumuşsun! Tamamladın olarak işaretlemek ister misin?`,
        progress: progress
      };
    }
    
    // Eğer %90'dan fazla okumuşsa ve en az 2 bölüm varsa öner
    if (progress.percentage >= 90 && seriesInfo.totalChapters >= 2 && progress.read >= 2) {
      return {
        shouldSuggest: true,
        priority: 'medium',
        message: `${seriesInfo.title} serisinin %${progress.percentage}'ini okumuşsun. Bu seriyi tamamladın mı?`,
        progress: progress
      };
    }
    
    return { shouldSuggest: false };
  }

  // Tüm seriler için tamamlanma önerilerini kontrol et
  checkAllSeriesForCompletion() {
    const suggestions = [];
    
    for (const seriesKey in this.seriesData) {
      const suggestion = this.suggestCompletionForSeries(seriesKey);
      if (suggestion.shouldSuggest) {
        suggestions.push({
          seriesKey,
          ...suggestion,
          seriesInfo: this.seriesData[seriesKey]
        });
      }
    }
    
    // Önceliğe göre sırala (high önce)
    suggestions.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return b.progress.percentage - a.progress.percentage;
    });
    
    return suggestions;
  }

  // Seri için rating ekle/güncelle
  updateSeriesRating(seriesKey, rating) {
    if (this.isSeriesCompleted(seriesKey)) {
      this.completedSeries.ratings[seriesKey] = rating;
      this.saveCompletedSeries();
      return true;
    }
    return false;
  }

  // Seri için review ekle/güncelle
  updateSeriesReview(seriesKey, review) {
    if (this.isSeriesCompleted(seriesKey)) {
      this.completedSeries.reviews[seriesKey] = review;
      this.saveCompletedSeries();
      return true;
    }
    return false;
  }

  // İstatistikleri getir
  getCompletionStats() {
    const completed = this.completedSeries.manuallyCompleted;
    const totalRated = Object.keys(this.completedSeries.ratings).length;
    const averageRating = this.calculateAverageRating();
    
    return {
      totalCompleted: completed.length,
      totalRated: totalRated,
      averageRating: averageRating,
      completionDates: this.completedSeries.completionDates
    };
  }

  // Ortalama rating hesapla
  calculateAverageRating() {
    const ratings = Object.values(this.completedSeries.ratings);
    if (ratings.length === 0) return 0;
    
    const sum = ratings.reduce((total, rating) => total + rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  }

  // En son tamamlanan seriyi getir
  getLastCompletedSeries() {
    const dates = this.completedSeries.completionDates;
    if (Object.keys(dates).length === 0) return null;
    
    const lastSeriesKey = Object.keys(dates).reduce((latest, current) => {
      return new Date(dates[current]) > new Date(dates[latest]) ? current : latest;
    });
    
    return this.seriesData[lastSeriesKey];
  }

  // Tüm verileri temizle
  clearAllData() {
    this.completedSeries = {
      manuallyCompleted: [],
      completionDates: {},
      ratings: {},
      reviews: {}
    };
    this.saveCompletedSeries();
    console.log('All completed series data cleared');
  }

  // Veriyi dışa aktar
  exportData() {
    return JSON.stringify(this.completedSeries, null, 2);
  }

  // Veriyi içe aktar
  importData(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      this.completedSeries = imported;
      this.saveCompletedSeries();
      console.log('Completed series data imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing completed series data:', error);
      return false;
    }
  }

  // Manuel olarak tamamlama butonunu göster (global fonksiyon)
  showManualCompletionDialog(seriesKey) {
    const seriesInfo = this.seriesData[seriesKey];
    if (!seriesInfo) {
      alert('Bu seri için bilgi bulunamadı.');
      return;
    }

    const isAlreadyCompleted = this.isSeriesCompleted(seriesKey);
    
    if (isAlreadyCompleted) {
      alert(`${seriesInfo.title} zaten tamamlananlar listenizde!`);
      return;
    }

    const progress = this.getSeriesReadProgress(seriesKey);
    const confirmMessage = `${seriesInfo.title} serisini tamamlananlar listesine eklemek istediğinizden emin misiniz?\n\nMevcut ilerleme: ${progress.read}/${progress.total} bölüm (%${progress.percentage})`;
    
    const userConfirmed = confirm(confirmMessage);
    
    if (userConfirmed) {
      let rating = null;
      let review = null;
      
      const ratingInput = prompt('Bu seri için puanınız (1-5, isteğe bağlı):');
      if (ratingInput) {
        const numericRating = parseInt(ratingInput);
        if (numericRating >= 1 && numericRating <= 5) {
          rating = numericRating;
        }
      }
      
      const reviewInput = prompt('Kısa bir yorum eklemek ister misiniz? (isteğe bağlı):');
      if (reviewInput && reviewInput.trim()) {
        review = reviewInput.trim();
      }
      
      const success = this.markSeriesAsCompleted(seriesKey, rating, review);
      
      if (success) {
        alert('🎉 Seri tamamlananlar listesine eklendi! Profil sayfanızdan görebilirsiniz.');
      } else {
        alert('Bir hata oluştu.');
      }
    }
  }

  // Manuel tamamlama butonu ekle (seri sayfalarından)
  addManualCompletionButton(seriesKey, seriesTitle, container) {
    if (!container) return;

    // Zaten tamamlanan seri kontrol et
    if (this.isSeriesCompleted(seriesKey)) {
      return; // Zaten tamamlanmış
    }

    const button = document.createElement('button');
    button.className = 'manual-completion-btn';
    button.innerHTML = `
      <i class="fas fa-check-circle"></i>
      Tamamladım
    `;
    button.title = `${seriesTitle} serisini tamamlandı olarak işaretle`;
    
    button.addEventListener('click', () => {
      this.showManualCompletionDialog(seriesKey);
    });

    // Butonu ekle
    container.appendChild(button);
    
    return button;
  }

  // Seri sayfasında tamamlama durumunu göster
  showCompletionStatus(seriesKey, container) {
    if (!container) return;

    if (this.isSeriesCompleted(seriesKey)) {
      const status = document.createElement('div');
      status.className = 'completion-status completed';
      status.innerHTML = `
        <i class="fas fa-trophy"></i>
        <span>Tamamlandı</span>
      `;
      container.appendChild(status);
    } else {
      // Progress göster
      const progress = this.getSeriesReadProgress(seriesKey);
      if (progress.read > 0) {
        const status = document.createElement('div');
        status.className = 'completion-status in-progress';
        status.innerHTML = `
          <i class="fas fa-book-reader"></i>
          <span>%${progress.percentage} tamamlandı (${progress.read}/${progress.total})</span>
        `;
        container.appendChild(status);
      }
    }
  }

  // Global erişim için fonksiyon
  static showCompletionDialog(seriesKey) {
    if (window.completedSeriesTracker) {
      window.completedSeriesTracker.showManualCompletionDialog(seriesKey);
    } else {
      alert('Tamamlama sistemi henüz yüklenmedi. Lütfen sayfayı yenileyin.');
    }
  }
}

// Global instance oluştur
window.completedSeriesTracker = null;

// DOM yüklendiğinde başlat
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
  });
} else {
}

console.log('completed-series-tracker.js loaded successfully!');
