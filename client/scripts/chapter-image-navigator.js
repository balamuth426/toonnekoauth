// Chapter Image Navigation System
// Bu dosya bölüm sayfalarında resim listesi navigasyonunu sağlar

class ChapterImageNavigator {
  constructor() {
    this.resimListesi = null;
    this.images = [];
    this.scrollTimeout = null;
    this.init();
  }

  init() {
    // DOM yüklendiğinde başlat
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.resimListesi = document.getElementById('resimListesi');
    this.images = document.querySelectorAll('.okuma-img[data-page]');
    
    if (!this.resimListesi || !this.images.length) {
      console.log('ChapterImageNavigator: Required elements not found');
      return;
    }

    console.log('ChapterImageNavigator: Initialized with', this.images.length, 'images');
    
    // Event listeners ekle
    this.setupImageSelector();
    this.setupScrollTracker();
  }

  setupImageSelector() {
    this.resimListesi.addEventListener('change', (e) => {
      const selectedPage = e.target.value;
      this.scrollToPage(selectedPage);
    });
  }

  scrollToPage(pageNumber) {
    const targetImage = document.querySelector(`[data-page="${pageNumber}"]`);
    
    if (!targetImage) {
      console.warn('ChapterImageNavigator: Image not found for page', pageNumber);
      return;
    }

    // Smooth scroll to the selected image
    targetImage.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    
    // Add highlight effect
    this.highlightImage(targetImage);
    
    console.log(`ChapterImageNavigator: Scrolled to page ${pageNumber}`);
  }

  highlightImage(image) {
    // Remove existing highlights
    this.images.forEach(img => {
      img.style.boxShadow = '';
    });

    // Add highlight effect to target image
    image.style.boxShadow = '0 0 20px rgba(255, 111, 97, 0.8)';
    image.style.transition = 'box-shadow 0.3s ease';
    
    // Remove highlight after 2 seconds
    setTimeout(() => {
      image.style.boxShadow = '';
    }, 2000);
  }

  setupScrollTracker() {
    window.addEventListener('scroll', () => {
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }
      this.scrollTimeout = setTimeout(() => this.updateImageSelector(), 100);
    });
  }

  updateImageSelector() {
    if (!this.images.length || !this.resimListesi) return;
    
    const scrollPosition = window.scrollY + window.innerHeight / 2;
    let currentPage = '1';
    
    this.images.forEach(img => {
      const imgTop = img.offsetTop;
      const imgBottom = imgTop + img.offsetHeight;
      
      if (scrollPosition >= imgTop && scrollPosition <= imgBottom) {
        currentPage = img.getAttribute('data-page');
      }
    });
    
    // Select değerini güncelle (sadece farklıysa)
    if (this.resimListesi.value !== currentPage) {
      this.resimListesi.value = currentPage;
    }
  }

  // Manuel olarak belirli bir sayfaya gitmek için
  goToPage(pageNumber) {
    if (this.resimListesi) {
      this.resimListesi.value = pageNumber;
      this.scrollToPage(pageNumber);
    }
  }

  // Sonraki/önceki sayfa için
  goToNextPage() {
    const currentPage = parseInt(this.resimListesi.value);
    const maxPage = this.images.length;
    
    if (currentPage < maxPage) {
      this.goToPage(currentPage + 1);
    }
  }

  goToPrevPage() {
    const currentPage = parseInt(this.resimListesi.value);
    
    if (currentPage > 1) {
      this.goToPage(currentPage - 1);
    }
  }
}

// Global instance oluştur
window.chapterImageNavigator = null;

// Sayfa yüklendiğinde başlat
if (typeof window !== 'undefined') {
  window.chapterImageNavigator = new ChapterImageNavigator();
}

console.log('chapter-image-navigator.js loaded successfully!');
