// Bölüm okuma takibi için fonksiyonlar
class ReadingTracker {
  constructor() {
    this.baseUrl = getApiBase();
    this.tracked = new Set(); // Aynı session'da birden fazla track edilmesini önle
  }

  // Bölüm okunduğunda istatistikleri güncelle
  async trackReading(seriesId, chapterNumber, seriesTitle, chapterTitle) {
    // Aynı bölümü tekrar tekrar track etmeyi önle
    const key = `${seriesId}-${chapterNumber}`;
    if (this.tracked.has(key)) {
      console.log('📖 Reading already tracked for this session:', key);
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/stats/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          seriesId: seriesId,
          chapterNumber: parseInt(chapterNumber),
          seriesTitle: seriesTitle,
          chapterTitle: chapterTitle
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.tracked.add(key);
        console.log('📈 Reading tracked successfully:', {
          series: seriesTitle,
          chapter: chapterNumber,
          totalReads: data.totalReads,
          weeklyReads: data.weeklyReads
        });
        
        // Okuma sayısını sayfada göster (varsa)
        this.displayReadingStats(data);
      } else {
        console.error('❌ Failed to track reading:', data.error);
      }
    } catch (error) {
      console.error('❌ Reading tracking error:', error);
    }
  }

  // Okuma sayısını sayfada göster
  displayReadingStats(stats) {
    // Okuma sayısı elementi varsa güncelle
    const readingStatsElement = document.getElementById('reading-stats');
    if (readingStatsElement) {
      readingStatsElement.innerHTML = `
        <div class="reading-stats">
          <span class="stat-item">
            <i class="fas fa-eye"></i> ${this.formatNumber(stats.totalReads)} okuma
          </span>
          <span class="stat-item">
            <i class="fas fa-calendar-week"></i> ${this.formatNumber(stats.weeklyReads)} haftalık
          </span>
        </div>
      `;
    }
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // URL'den seri ve bölüm bilgilerini çıkar
  extractChapterInfo() {
    const path = window.location.pathname;
    const url = window.location.href;
    
    // Farklı URL formatlarını destekle
    let seriesId = null;
    let chapterNumber = null;
    let seriesTitle = null;
    let chapterTitle = null;

    // URL'den bilgileri çıkarmaya çalış
    // Örnek: /chapters/solo-leveling-chapters/bolum-1.html
    const chapterMatch = path.match(/\/chapters\/([^\/]+)\/.*?(\d+)/);
    if (chapterMatch) {
      const folderName = chapterMatch[1];
      chapterNumber = parseInt(chapterMatch[2]);
      
      // Klasör adından seri ID'sini çıkar
      const seriesMapping = {
        'solo leveling chapters': 'sololeveling',
        'nanomachine chapters': 'nanomachine',
        'damn reincarnation chapters': 'damnreincarnation',
        'omniscient reader chapters': 'omniscientreader',
        'martial god regressed to level 2 chapters': 'martialgodregressedtolevel2',
        'blackcrow chapters': 'blackcrow'
      };
      
      seriesId = seriesMapping[folderName] || folderName.replace(/\s+chapters?/i, '').replace(/\s+/g, '').toLowerCase();
      
      // Seri başlığını klasör adından çıkar
      seriesTitle = folderName.replace(/\s+chapters?$/i, '').replace(/^\w/, c => c.toUpperCase());
      chapterTitle = `Bölüm ${chapterNumber}`;
    }

    // HTML sayfa başlığından bilgi çıkarmaya çalış
    const pageTitle = document.title;
    if (pageTitle && !seriesTitle) {
      const titleMatch = pageTitle.match(/(.+?)\s*-\s*Bölüm\s*(\d+)/i);
      if (titleMatch) {
        seriesTitle = titleMatch[1].trim();
        chapterNumber = parseInt(titleMatch[2]);
        chapterTitle = `Bölüm ${chapterNumber}`;
        
        // Seri ID'sini başlıktan tahmin et
        if (!seriesId) {
          seriesId = seriesTitle.toLowerCase().replace(/\s+/g, '');
        }
      }
    }

    return {
      seriesId,
      chapterNumber,
      seriesTitle,
      chapterTitle
    };
  }

  // Sayfa yüklendiğinde otomatik tracking
  autoTrack() {
    // Sadece bölüm sayfalarında çalış
    if (!window.location.pathname.includes('/chapters/')) {
      return;
    }

    const chapterInfo = this.extractChapterInfo();
    
    if (chapterInfo.seriesId && chapterInfo.chapterNumber && chapterInfo.seriesTitle) {
      console.log('🎯 Auto-tracking chapter:', chapterInfo);
      
      // Biraz gecikme ile track et (sayfa tam yüklensin)
      setTimeout(() => {
        this.trackReading(
          chapterInfo.seriesId,
          chapterInfo.chapterNumber,
          chapterInfo.seriesTitle,
          chapterInfo.chapterTitle
        );
      }, 2000);
    } else {
      console.log('⚠️ Could not extract chapter info for tracking:', chapterInfo);
    }
  }

  // Manuel tracking için (buton click vs.)
  manualTrack(seriesId, chapterNumber, seriesTitle, chapterTitle) {
    if (!seriesId || !chapterNumber || !seriesTitle) {
      console.error('❌ Missing required information for manual tracking');
      return;
    }

    this.trackReading(seriesId, chapterNumber, seriesTitle, chapterTitle);
  }
}

// Global instance
window.readingTracker = new ReadingTracker();

// Sayfa yüklendiğinde otomatik tracking başlat
document.addEventListener('DOMContentLoaded', () => {
  // Sayfa tam yüklendikten sonra tracking başlat
  setTimeout(() => {
    window.readingTracker.autoTrack();
  }, 1000);
});

// Visibility API ile sayfa focus durumunu track et
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Sayfa tekrar görünür olduğunda tracking yap
    setTimeout(() => {
      window.readingTracker.autoTrack();
    }, 1000);
  }
});

function getApiBase() {
  return window.APP_CONFIG?.API_BASE || '/api';
}