console.log('arama.js loaded successfully!');

// Duplicate loading guard
if (window.ManhwaSearch) {
  console.log('ManhwaSearch already loaded, skipping...');
} else {
  // Global arama sınıfı
  class ManhwaSearch {
  constructor() {
    this.manhwaList = [];
    this.searchInitialized = false;
    this.isSeriesPage = window.location.pathname.includes('/series/');
    this.isChapterPage = window.location.pathname.includes('/chapters/');
    
    console.log('ManhwaSearch constructor called');
    console.log('Current URL:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
    console.log('isSeriesPage:', this.isSeriesPage);
    console.log('isChapterPage:', this.isChapterPage);
    
    // Tüm sayfalarda manhwa araması çalışsın
    this.init();
  }

  getDataPath() {
    if (this.isSeriesPage) {
      return '../../data/manhwalar.json';
    } else if (this.isChapterPage) {
      return '../../data/manhwalar.json';
    } else {
      return 'data/manhwalar.json';
    }
  }

  async init() {
    console.log('Initializing ManhwaSearch...');
    console.log('Current pathname:', window.location.pathname);
    console.log('isChapterPage:', this.isChapterPage);
    console.log('isSeriesPage:', this.isSeriesPage);
    
    try {
      await this.loadData();
      this.initializeSearchElements();
      console.log('ManhwaSearch initialization completed successfully!');
    } catch (error) {
      console.error('ManhwaSearch initialization failed:', error);
    }
  }

  async loadData() {
    const dataPath = this.getDataPath();
    console.log('Loading data from:', dataPath);

    try {
      const response = await fetch(dataPath);
      console.log('Fetch response status:', response.status);
      console.log('Fetch response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      this.manhwaList = await response.json();
      console.log('Data loaded successfully, items count:', this.manhwaList.length);
      console.log('First item:', this.manhwaList[0]);
    } catch (error) {
      console.error('Failed to load data:', error);
      console.error('Attempted path:', dataPath);
      throw error;
    }
  }

  initializeSearchElements() {
    if (this.searchInitialized) {
      console.log('Search already initialized, skipping...');
      return;
    }
    
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    console.log('Elements found:', {
      searchInput: searchInput ? 'YES' : 'NO',
      searchResults: searchResults ? 'YES' : 'NO'
    });
    
    if (searchInput) {
      console.log('Search input element:', searchInput);
    }
    
    if (searchResults) {
      console.log('Search results element:', searchResults);
    }
    
    if (!searchInput || !searchResults) {
      console.error('Required search elements not found!');
      console.log('Available elements with search in id:', document.querySelectorAll('[id*="search"]'));
      return;
    }
    
    this.searchInitialized = true;
    this.setupEventListeners(searchInput, searchResults);
    console.log('Search initialized successfully!');
  }

  setupEventListeners(searchInput, searchResults) {
    // Arama input event listener
    searchInput.addEventListener('input', (e) => {
      this.handleSearch(e.target.value, searchResults);
    });
    
    // Dışarıya tıklayınca sonuçları gizle
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.add('hidden');
      }
    });
  }

  handleSearch(query, searchResults) {
    const searchTerm = query.toLowerCase().trim();
    console.log('Search query:', searchTerm);
    
    // Önceki sonuçları temizle
    searchResults.innerHTML = '';
    
    if (!searchTerm) {
      searchResults.classList.add('hidden');
      return;
    }
    
    // Arama yap
    const filtered = this.manhwaList.filter(item => 
      item.title.toLowerCase().includes(searchTerm)
    );
    
    console.log('Found results:', filtered.length);
    
    if (filtered.length === 0) {
      searchResults.classList.add('hidden');
      return;
    }
    
    // İlk 2 sonucu göster
    const limited = filtered.slice(0, 2);
    this.renderResults(limited, searchResults);
    searchResults.classList.remove('hidden');
    console.log('Results displayed');
  }

  renderResults(results, searchResults) {
    results.forEach(item => {
      const div = document.createElement('div');
      div.className = 'result-item';
      
      const { imagePath, linkPath } = this.getAssetPaths(item);
      
      div.innerHTML = `
        <img src="${imagePath}" alt="${item.title}" 
             onerror="this.onerror=null; this.src='${this.getDefaultImage()}'; console.warn('Failed to load cover image for ${item.title}, using default');"
             loading="lazy">
        <div class="result-info">
          <a href="${linkPath}">${item.title}</a>
          <a href="#">${item.lastChapter || 'Henüz bölüm yok'}</a>
        </div>
      `;
      
      searchResults.appendChild(div);
    });
  }

  getDefaultImage() {
    if (this.isSeriesPage || this.isChapterPage) {
      return '../../images/default-cover.jpg';
    } else {
      return 'images/default-cover.jpg';
    }
  }

  getAssetPaths(item) {
    // Eğer image zaten tam URL ise (proxy-image içeriyorsa) direkt kullan
    let imagePath = item.image;
    
    // Eğer image relative path ise, path'i düzelt
    if (!item.image.startsWith('http')) {
      if (this.isSeriesPage || this.isChapterPage) {
        imagePath = `../../${item.image}`;
      } else {
        imagePath = item.image;
      }
    }
    
    // Link path'ini düzelt
    let linkPath;
    if (this.isSeriesPage || this.isChapterPage) {
      linkPath = `../../${item.link}`;
    } else {
      linkPath = item.link;
    }
    
    return {
      imagePath,
      linkPath
    };
  }
}

  // DOM yüklendiğinde başlat
  console.log('arama.js: DOM readyState:', document.readyState);

  if (document.readyState === 'loading') {
    console.log('arama.js: Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('arama.js: DOMContentLoaded fired, creating ManhwaSearch...');
      window.manhwaSearch = new ManhwaSearch();
    });
  } else {
    console.log('arama.js: DOM already loaded, creating ManhwaSearch immediately...');
    window.manhwaSearch = new ManhwaSearch();
  }
}