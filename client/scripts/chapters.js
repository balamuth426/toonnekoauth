// API taban URL'sini döndüren yardımcı fonksiyon
function getApiBase() {
  return window.APP_CONFIG?.API_BASE || '/api';
}

// Bölüm listesini dinamik olarak yükleyen sınıf
class ChaptersManager {
  constructor(seriesId) {
    this.seriesId = seriesId;
    this.chapters = [];
    this.chapterStats = new Map(); // Bölüm istatistikleri için map
    this.init();
  }

  async init() {
    await this.loadChapters();
    await this.loadChapterStats(); // İstatistikleri yükle
    await this.renderChaptersList(); // Bu da async oldu
    this.initializeChapterSearch();
    await this.initializeNavigationButtons(); // Bu da async olacak
    this.startAutoRefresh(); // Otomatik güncellemeyi başlat
  }

  // Bölüm istatistiklerini yükle
  async loadChapterStats() {
    try {
      const response = await fetch(`${getApiBase()}/stats/admin/detailed-stats?seriesId=${this.seriesId}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Her bölümün istatistiklerini map'e kaydet
          data.data
            .filter(stat => stat.seriesId === this.seriesId) // Sadece bu serinin bölümlerini al
            .forEach(stat => {
              this.chapterStats.set(stat.chapterNumber, {
                totalReads: stat.totalReads,
                weeklyReads: stat.weeklyReads,
                lastRead: stat.lastRead
              });
            });
          console.log('📊 Chapter stats loaded for', this.seriesId, ':', this.chapterStats.size, 'chapters');
        }
      }
    } catch (error) {
      console.error('❌ Failed to load chapter stats:', error);
    }
  }

  // Okunma sayısını formatla
  formatReads(reads) {
    if (!reads || reads === 0) return '0';
    if (reads >= 1000000) {
      return (reads / 1000000).toFixed(1) + 'M';
    } else if (reads >= 1000) {
      return (reads / 1000).toFixed(1) + 'K';
    }
    return reads.toString();
  }

  async loadChapters() {
    try {
      // Server API'sinden bölümleri yükle
      const response = await fetch(`${getApiBase()}/chapters/${this.seriesId}`);
      if (!response.ok) {
        throw new Error('Bölümler yüklenemedi');
      }
      const data = await response.json();
      this.chapters = (data.chapters || []).sort((a, b) => a.number - b.number); // Her zaman sıralı olsun
      
      // Bölüm sayısını güncelle
      this.updateChapterCount(data.totalChapters || 0);
    } catch (error) {
      console.error('Bölümler yüklenirken hata:', error);
      // Fallback: Local yükleme sistemi
      this.chapters = (await this.loadChaptersFromDirectory()).sort((a, b) => a.number - b.number);
      this.updateChapterCount(this.chapters.length);
    }
  }

  async loadChaptersFromDirectory() {
    try {
      // manhwalar.json'dan direkt veri al
      const response = await fetch('/data/manhwalar.json');
      const seriesData = await response.json();
      
      const currentSeries = seriesData.find(series => series.seriesId === this.seriesId);
      
      if (!currentSeries) {
        console.warn(`Series not found: ${this.seriesId}`);
        return [];
      }
      
      console.log(`📚 Loading chapters for ${this.seriesId}:`, currentSeries);
      
      // chapters array'inden veri al
      const chapters = currentSeries.chapters || [];
      
      return chapters.map(chapter => ({
        number: chapter.number,
        title: chapter.title,
        filename: chapter.filename,
        url: `../../chapters/${currentSeries.seriesId === 'blackcrow' ? 'blackcrow chapters' : currentSeries.seriesId + ' chapters'}/${chapter.filename}`,
        uploadDate: chapter.uploadDate,
        imageCount: chapter.imageCount || 1
      }));
      
    } catch (error) {
      console.error('Error loading chapters from manhwalar.json:', error);
      return [];
    }
  }

  async getChapterFiles(folderName) {
    // Bu fonksiyon, chapters klasöründeki dosyaları almak için basit bir HTTP isteği yapar
    // Gerçek uygulamada, server-side bir API endpoint'i kullanılmalı
    // Fallback olarak sabit dizi kaldırıldı, sadece API'den veri alınacak
    return [];
  }

  updateChapterCount(count) {
    // Seri sayfasındaki bölüm sayısını güncelle
    const chapterCountElements = document.querySelectorAll('.chapter-count, .total-chapters');
    chapterCountElements.forEach(element => {
      if (element.textContent.includes('Bölüm')) {
        element.textContent = `${count} Bölüm`;
      }
    });

    // Detay sayfasındaki toplam bölüm bilgisini güncelle
    const detailElements = document.querySelectorAll('.series-details p');
    detailElements.forEach(element => {
      if (element.textContent.includes('Toplam Bölüm')) {
        element.innerHTML = `<strong>Toplam Bölüm:</strong> ${count}`;
      }
    });
  }

  async renderChaptersList() {
    const chaptersContainer = document.querySelector('.chapters-list, .episodes-list, #chapters-list');
    
    if (!chaptersContainer) {
      console.log('Bölüm listesi container bulunamadı');
      return;
    }

    // Klasör adını al
    const folderName = await this.getSeriesFolderName();

    // Bölümleri ters sırada göster (en yeni üstte)
    const sortedChapters = [...this.chapters].reverse();
    
    const chaptersHtml = sortedChapters.map(chapter => {
      // URL'i düzenle - API'den gelen URL'leri düzelt
      let chapterUrl = chapter.url;
      
      // API'den gelen URL'leri düzelt
      if (chapterUrl && chapterUrl.startsWith('chapters/')) {
        chapterUrl = '../../' + chapterUrl;
      } else if (chapterUrl && chapterUrl.startsWith('../chapters/')) {
        chapterUrl = '../../chapters/' + chapterUrl.substring(12);
      } else if (chapterUrl && !chapterUrl.startsWith('../../')) {
        chapterUrl = `../../chapters/${folderName}/${chapter.filename}`;
      }
      
      // Bölüm istatistiklerini al
      const stats = this.chapterStats.get(chapter.number) || {};
      const totalReads = stats.totalReads || 0;
      const weeklyReads = stats.weeklyReads || 0;
      
      return `
        <a href="${chapterUrl}" class="chapter-card">
          <span class="chapter-title">${chapter.title}</span><br>
          <span class="date">Yeni</span>
          ${totalReads > 0 ? `<span class="reads"><i class="fas fa-eye"></i> ${this.formatReads(totalReads)}</span>` : ''}
        </a>
      `;
    }).join('');

    chaptersContainer.innerHTML = chaptersHtml;
    this.addChapterClickEvents();
    
    // Arama fonksiyonunu başlat
    this.initializeChapterSearch();
  }

  async getSeriesFolderName() {
    // Önce cache'e bak
    if (this.cachedFolderName) {
      return this.cachedFolderName;
    }
    
    try {
      // API'den tüm seri verilerini al
      const response = await fetch(window.APP_CONFIG.API_BASE + '/manhwa/');
      if (response.ok) {
        const seriesData = await response.json();
        const currentSeries = seriesData.find(series => series.seriesId === this.seriesId);
        
        if (currentSeries && currentSeries.chapterDetails && currentSeries.chapterDetails.length > 0) {
          // İlk bölümün URL'sinden klasör adını çıkar
          const firstChapterUrl = currentSeries.chapterDetails[0].url;
          const match = firstChapterUrl.match(/chapters\/(.+?)\//);
          if (match) {
            this.cachedFolderName = match[1];
            console.log(`📁 Dynamic folder name detected for ${this.seriesId}:`, this.cachedFolderName);
            return this.cachedFolderName;
          }
        }
      }
    } catch (error) {
      console.error('Failed to get dynamic folder name:', error);
    }
    
    // Fallback: Static mapping
    const seriesNameMapping = {
      'damnreincarnation': 'damn reincarnation chapters',
      'nanomachine': 'nanomachine chapters',
      'sololeveling': 'solo leveling chapters',
      'omniscientreader': 'omniscient reader chapters',
      'martialgodregressedtolevel2': 'martial god regressed to level 2 chapters',
      'blackcrow': 'blackcrow chapters',
      'arcanesniper': 'arcanesniper chapters'
    };
    
    this.cachedFolderName = seriesNameMapping[this.seriesId] || this.seriesId;
    console.log(`📁 Using fallback folder name for ${this.seriesId}:`, this.cachedFolderName);
    return this.cachedFolderName;
  }

  addChapterClickEvents() {
    document.querySelectorAll('.chapter-card').forEach(link => {
      link.addEventListener('click', (e) => {
        // Okuma ilerlemesini kaydet
        const chapterTitle = link.querySelector('.chapter-title').textContent;
        this.saveReadingProgress(chapterTitle);
      });
    });
  }

  saveReadingProgress(chapterTitle) {
    // Reading progress API'sine kaydet
    const token = localStorage.getItem('token');
    if (token) {
      fetch(window.APP_CONFIG.API_BASE + '/reading/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          seriesId: this.seriesId,
          chapterTitle: chapterTitle,
          readAt: new Date()
        })
      }).catch(err => console.log('Progress save failed:', err));
    }
  }

  // Yeni bölüm eklendiğinde listeyi yenile
  async refreshChapters() {
    await this.loadChapters();
    await this.renderChaptersList();
  }

  // Bölüm arama fonksiyonu
  initializeChapterSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', async (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      await this.filterChapters(searchTerm);
    });
  }

  async filterChapters(searchTerm) {
    const chaptersContainer = document.querySelector('.chapters-list, .episodes-list, #chapters-list');
    if (!chaptersContainer) return;

    if (!searchTerm) {
      await this.renderChaptersList();
      return;
    }

    const filteredChapters = this.chapters.filter(chapter => 
      chapter.title.toLowerCase().includes(searchTerm) ||
      chapter.number.toString().includes(searchTerm)
    );

    if (filteredChapters.length === 0) {
      chaptersContainer.innerHTML = '<p class="no-chapters">Arama kriterinize uygun bölüm bulunamadı.</p>';
      return;
    }

    // Klasör adını al
    const folderName = await this.getSeriesFolderName();
    const sortedChapters = [...filteredChapters].reverse();
    
    chaptersContainer.innerHTML = sortedChapters.map(chapter => {
      // URL'i düzenle - API'den gelen URL'leri düzelt
      let chapterUrl = chapter.url;
      if (chapterUrl && chapterUrl.startsWith('../chapters/')) {
        chapterUrl = '../../chapters/' + chapterUrl.substring(12);
      } else if (chapterUrl && !chapterUrl.startsWith('../../')) {
        chapterUrl = chapter.url || `../../chapters/${folderName}/${chapter.filename}`;
      }
      
      return `
        <a href="${chapterUrl}" class="chapter-card">
          <span class="chapter-title">${chapter.title}</span><br>
          <span class="date">Yeni</span>
        </a>
      `;
    }).join('');

    this.addChapterClickEvents();
  }

  // İlk ve Son bölüm butonları için event listener'lar
  async initializeNavigationButtons() {
    const buttons = document.querySelectorAll('.buttons button');
    buttons.forEach((button, index) => {
      button.addEventListener('click', async () => {
        if (this.chapters.length === 0) return;
        
        let targetChapter;
        if (index === 0) { // İlk Bölüm
          targetChapter = this.chapters.find(ch => ch.number === 1) || this.chapters[0];
        } else if (index === 1) { // Son Bölüm
          targetChapter = this.chapters[this.chapters.length - 1];
        }
        
        if (targetChapter) {
          let chapterUrl = targetChapter.url;
          if (chapterUrl && chapterUrl.startsWith('../chapters/')) {
            chapterUrl = '../../chapters/' + chapterUrl.substring(12);
          } else if (chapterUrl && !chapterUrl.startsWith('../../')) {
            const folderName = await this.getSeriesFolderName();
            chapterUrl = `../../chapters/${folderName}/${targetChapter.filename}`;
          }
          
          console.log(`🔗 Navigating to: ${chapterUrl}`);
          window.location.href = chapterUrl;
        }
      });
    });
  }

  // Anlık okunma sayılarını güncelle
  async refreshChapterStats() {
    await this.loadChapterStats();
    this.updateChapterStatsDisplay();
  }

  // Bölüm kartlarındaki okunma sayılarını güncelle
  updateChapterStatsDisplay() {
    const chapterCards = document.querySelectorAll('.chapter-card');
    chapterCards.forEach(card => {
      const chapterTitle = card.querySelector('.chapter-title')?.textContent;
      if (chapterTitle) {
        // Bölüm numarasını çıkar
        const chapterNumber = this.extractChapterNumber(chapterTitle);
        const stats = this.chapterStats.get(chapterNumber);
        
        // Mevcut reads span'ini bul veya oluştur
        let readsSpan = card.querySelector('.reads');
        if (stats && stats.totalReads > 0) {
          if (!readsSpan) {
            readsSpan = document.createElement('span');
            readsSpan.className = 'reads';
            card.appendChild(readsSpan);
          }
          readsSpan.innerHTML = `<i class="fas fa-eye"></i> ${this.formatReads(stats.totalReads)}`;
        } else if (readsSpan) {
          readsSpan.remove();
        }
      }
    });
  }

  // Bölüm başlığından numarayı çıkar
  extractChapterNumber(title) {
    const match = title.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  // Periyodik güncelleme başlat
  startAutoRefresh() {
    // Her 30 saniyede bir okunma sayılarını güncelle
    setInterval(() => {
      this.refreshChapterStats();
    }, 30000);
  }
}

// Global kullanım için
window.ChaptersManager = ChaptersManager;
