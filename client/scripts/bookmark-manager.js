// Duplicate loading guard
if (window.BookmarkManager) {
  console.log('BookmarkManager already loaded, skipping...');
} else {
  // Gelişmiş Bookmark Sistemi
  class BookmarkManager {
  constructor() {
    this.storageKey = 'toonNeko_bookmarks';
    this.bookmarks = this.loadBookmarks();
    this.currentSeries = null;
    this.currentChapter = null;
    this.init();
  }

  init() {
    console.log('BookmarkManager initialized');
    console.log('Current bookmarks:', this.bookmarks);
    
    // URL'den seri ve bölüm bilgisi çıkar
    this.extractSeriesAndChapter();
    
    // Bookmark butonunu başlat
    this.initializeBookmarkButton();
  }

  extractSeriesAndChapter() {
    // URL pattern: /chapters/[series] chapters/bölüm[X].html
    const pathname = window.location.pathname;
    console.log('Current pathname for extraction:', pathname);
    
    // Chapter sayfası kontrolü - daha esnek pattern
    const chapterMatch = pathname.match(/\/chapters\/(.+?)\s+chapters\/bölüm(\d+)\.html/);
    if (chapterMatch) {
      // Series adını temizle ve normalize et
      let seriesName = chapterMatch[1].trim();
      seriesName = seriesName.replace(/\s+/g, '').toLowerCase();
      
      this.currentSeries = seriesName;
      this.currentChapter = parseInt(chapterMatch[2]);
      
      console.log('Extracted series:', this.currentSeries);
      console.log('Extracted chapter:', this.currentChapter);
    } else {
      console.log('Pattern not matched, trying alternative patterns...');
      
      // Alternative pattern - URL decode edilmiş hali
      const decodedPath = decodeURIComponent(pathname);
      console.log('Decoded pathname:', decodedPath);
      
      const altMatch = decodedPath.match(/\/chapters\/(.+?)\s+chapters\/bölüm(\d+)\.html/);
      if (altMatch) {
        let seriesName = altMatch[1].trim();
        seriesName = seriesName.replace(/\s+/g, '').toLowerCase();
        
        this.currentSeries = seriesName;
        this.currentChapter = parseInt(altMatch[2]);
        
        console.log('Alternative extraction - series:', this.currentSeries);
        console.log('Alternative extraction - chapter:', this.currentChapter);
      } else {
        console.log('Not a chapter page or pattern not recognized');
      }
    }
  }

  loadBookmarks() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      return {};
    }
  }

  saveBookmarks() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.bookmarks));
      console.log('Bookmarks saved:', this.bookmarks);
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  }

  isChapterBookmarked(series, chapter) {
    return this.bookmarks[series] === chapter;
  }

  setBookmark(series, chapter) {
    const previousChapter = this.bookmarks[series];
    
    // Aynı seri için önceki bookmark'ı güncelle
    this.bookmarks[series] = chapter;
    this.saveBookmarks();
    
    console.log(`Bookmark set for ${series}: Chapter ${chapter}`);
    if (previousChapter && previousChapter !== chapter) {
      console.log(`Previous bookmark (Chapter ${previousChapter}) was updated`);
    }
    
    return {
      previousChapter,
      currentChapter: chapter
    };
  }

  removeBookmark(series) {
    if (this.bookmarks[series]) {
      const removedChapter = this.bookmarks[series];
      delete this.bookmarks[series];
      this.saveBookmarks();
      
      console.log(`Bookmark removed for ${series} (was Chapter ${removedChapter})`);
      return removedChapter;
    }
    return null;
  }

  getCurrentSeriesBookmark() {
    if (!this.currentSeries) return null;
    return this.bookmarks[this.currentSeries] || null;
  }

  initializeBookmarkButton() {
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    if (!bookmarkBtn) {
      console.log('Bookmark button not found');
      return;
    }

    console.log('Bookmark button found:', bookmarkBtn);

    // Başlangıç durumunu ayarla
    this.updateBookmarkButtonState();

    // Event listener ekle
    bookmarkBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Bookmark button clicked!');
      this.handleBookmarkClick();
    });

    console.log('Bookmark button initialized');
  }

  updateBookmarkButtonState() {
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    if (!bookmarkBtn || !this.currentSeries || !this.currentChapter) return;

    const icon = bookmarkBtn.querySelector('i');
    const currentBookmark = this.getCurrentSeriesBookmark();
    
    if (currentBookmark === this.currentChapter) {
      // Bu bölüm bookmark'lanmış
      icon.className = 'fa-solid fa-bookmark';
      bookmarkBtn.title = 'Bookmark\'tan kaldır';
      bookmarkBtn.classList.add('bookmarked');
    } else if (currentBookmark) {
      // Başka bir bölüm bookmark'lanmış
      icon.className = 'fa-regular fa-bookmark';
      bookmarkBtn.title = `Bookmark\'a ekle (Şu an: Bölüm ${currentBookmark})`;
      bookmarkBtn.classList.remove('bookmarked');
      bookmarkBtn.classList.add('has-other-bookmark');
    } else {
      // Hiç bookmark yok
      icon.className = 'fa-regular fa-bookmark';
      bookmarkBtn.title = 'Bookmark\'a ekle';
      bookmarkBtn.classList.remove('bookmarked', 'has-other-bookmark');
    }
  }

  handleBookmarkClick() {
    if (!this.currentSeries || !this.currentChapter) {
      this.showMessage('Bookmark eklenirken hata oluştu', 'error');
      return;
    }

    const bookmarkBtn = document.getElementById('bookmarkBtn');
    
    // Tıklama animasyonunu tetikle
    if (bookmarkBtn) {
      bookmarkBtn.classList.add('clicked');
      setTimeout(() => {
        bookmarkBtn.classList.remove('clicked');
      }, 600);
    }

    const currentBookmark = this.getCurrentSeriesBookmark();
    
    if (currentBookmark === this.currentChapter) {
      // Mevcut bölümün bookmark'ını kaldır
      this.removeBookmark(this.currentSeries);
      this.showMessage('Bookmark kaldırıldı', 'success');
    } else {
      // Yeni bookmark ekle (öncekini değiştir)
      const result = this.setBookmark(this.currentSeries, this.currentChapter);
      
      if (result.previousChapter) {
        this.showMessage(`Bookmark güncellendi: Bölüm ${result.previousChapter} → Bölüm ${result.currentChapter}`, 'info');
      } else {
        this.showMessage(`Bookmark eklendi: Bölüm ${result.currentChapter}`, 'success');
      }
    }

    // Button durumunu güncelle
    this.updateBookmarkButtonState();
  }

  showMessage(message, type = 'info') {
    // Alert box kullan veya yeni notification sistemi oluştur
    const alertBox = document.getElementById('alert-box');
    if (alertBox) {
      this.displayAlert(message, type);
    } else {
      // Fallback: console log
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  displayAlert(message, type) {
    const alertBox = document.getElementById('alert-box');
    if (!alertBox) return;

    // Mevcut alert'i temizle
    alertBox.innerHTML = '';
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
      <i class="fa-solid fa-bookmark"></i>
      <span>${message}</span>
      <button class="alert-close" onclick="this.parentElement.style.display='none'">
        <i class="fa-solid fa-times"></i>
      </button>
    `;
    
    alertBox.appendChild(alertDiv);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.style.opacity = '0';
        setTimeout(() => {
          if (alertDiv.parentElement) {
            alertDiv.remove();
          }
        }, 300);
      }
    }, 3000);
  }

  // Utility methods
  getAllBookmarks() {
    return { ...this.bookmarks };
  }

  clearAllBookmarks() {
    this.bookmarks = {};
    this.saveBookmarks();
    this.updateBookmarkButtonState();
    this.showMessage('Tüm bookmark\'lar temizlendi', 'info');
  }

  exportBookmarks() {
    return JSON.stringify(this.bookmarks, null, 2);
  }

  importBookmarks(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      this.bookmarks = imported;
      this.saveBookmarks();
      this.updateBookmarkButtonState();
      this.showMessage('Bookmark\'lar içe aktarıldı', 'success');
      return true;
    } catch (error) {
      this.showMessage('Bookmark içe aktarma hatası', 'error');
      return false;
    }
  }
}

// Global instance oluştur
window.BookmarkManager = BookmarkManager;
window.bookmarkManager = null;

  // DOM yüklendiğinde başlat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!window.bookmarkManager) {
        window.bookmarkManager = new BookmarkManager();
        console.log('BookmarkManager instance created on DOMContentLoaded');
      }
    });
  } else {
    if (!window.bookmarkManager) {
      window.bookmarkManager = new BookmarkManager();
      console.log('BookmarkManager instance created immediately');
    }
  }

  console.log('bookmark-manager.js loaded successfully!');
}
