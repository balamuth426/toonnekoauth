// Profile page functionality
class ProfileManager {
  constructor() {
    this.favorites = [];
    this.user = null;
    this.init();
  }

  async init() {
    // Navbar durumunu güncelle
    this.updateNavbar();
    
    // Giriş kontrolü yap
    const isAuthenticated = await this.checkAuth();
    if (!isAuthenticated) {
      this.showLoginRequiredModal();
      return;
    }

    // Kullanıcı bilgilerini yükle
    await this.loadUserData();
    
    // Favorileri yükle
    await this.loadFavorites();
    
    // Bookmark'ları yükle
    this.loadBookmarks();
    
    // Sekme işlevlerini başlat
    this.initTabs();
    
    // Ayarlar işlevlerini başlat
    this.initSettings();
    
    // Avatar seçimi işlevini başlat
    this.initAvatarSelection();
  }

  // Giriş kontrolü
  async checkAuth() {
    const token = localStorage.getItem('token');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!token || !isLoggedIn) {
      return false;
    }

    // Token'ın geçerli olup olmadığını kontrol et
    try {
      const response = await fetch(`${getApiBase()}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        return true;
      } else {
        // Token geçersiz, localStorage'ı temizle
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        return false;
      }
    } catch (error) {
      console.error('Token doğrulama hatası:', error);
      return false;
    }
  }

  // Giriş gerekli modalını göster
  showLoginRequiredModal() {
    const modal = document.getElementById('login-required-modal');
    if (modal) {
      modal.style.display = 'flex';
      
      // Giriş yap butonuna tıklandığında
      const goToLoginBtn = document.getElementById('go-to-login');
      if (goToLoginBtn) {
        goToLoginBtn.addEventListener('click', () => {
          modal.style.display = 'none';
          const loginModal = document.getElementById('login-modal');
          if (loginModal) {
            loginModal.style.display = 'flex';
          }
        });
      }
      
      // Kayıt ol butonuna tıklandığında
      const goToRegisterBtn = document.getElementById('go-to-register');
      if (goToRegisterBtn) {
        goToRegisterBtn.addEventListener('click', () => {
          modal.style.display = 'none';
          const registerModal = document.getElementById('register-modal');
          if (registerModal) {
            registerModal.style.display = 'flex';
          }
        });
      }
    }
  }

  // Kullanıcı verilerini yükle
  async loadUserData() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBase()}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        this.user = await response.json();
        this.updateProfileDisplay();
      } else {
        console.error('Kullanıcı verileri yüklenemedi');
        // Fallback: localStorage'dan kullanıcı adını al
        const username = localStorage.getItem('username') || 'Kullanıcı';
        this.user = { username, email: 'email@example.com' };
        this.updateProfileDisplay();
      }
    } catch (error) {
      console.error('Kullanıcı verileri yüklenirken hata:', error);
      // Fallback
      const username = localStorage.getItem('username') || 'Kullanıcı';
      this.user = { username, email: 'email@example.com' };
      this.updateProfileDisplay();
    }
  }

  // Profil bilgilerini güncelle
  updateProfileDisplay() {
    if (!this.user) return;

    const usernameEl = document.getElementById('profile-username');
    const memberSinceEl = document.getElementById('profile-member-since');
    
    if (usernameEl) usernameEl.textContent = this.user.username || 'Kullanıcı';
    if (memberSinceEl) {
      const joinDate = this.user.createdAt ? 
        new Date(this.user.createdAt).toLocaleDateString('tr-TR') : 
        'Bilinmiyor';
      memberSinceEl.textContent = `Üye olma tarihi: ${joinDate}`;
    }

    // Avatarı güncelle
    const avatarImg = document.getElementById('profile-avatar-img');
    if (avatarImg && this.user.avatar) {
      avatarImg.src = `images/avatars/${this.user.avatar}`;
    }

    // İstatistikleri güncelle
    this.updateStats();
  }

  // İstatistikleri güncelle
  updateStats() {
    const favCountEl = document.getElementById('favorites-count');
    if (favCountEl) {
      favCountEl.textContent = this.favorites.length;
    }

    // Bookmark sayısını al ve göster
    const readingCountEl = document.getElementById('reading-count');
    if (readingCountEl) {
      try {
        const bookmarks = window.bookmarkManager ? 
          window.bookmarkManager.getAllBookmarks() : 
          JSON.parse(localStorage.getItem('toonNeko_bookmarks') || '{}');
        const bookmarkCount = Object.keys(bookmarks).length;
        readingCountEl.textContent = bookmarkCount;
      } catch (error) {
        console.error('Error getting bookmark count:', error);
        readingCountEl.textContent = '0';
      }
    }
    
    // Tamamlanan serilerin sayısını al ve göster
    const completedCountEl = document.getElementById('completed-count');
    if (completedCountEl) {
      try {
        const completedCount = window.completedSeriesTracker ? 
          window.completedSeriesTracker.getAllCompletedSeries().length : 0;
        completedCountEl.textContent = completedCount;
      } catch (error) {
        console.error('Error getting completed series count:', error);
        completedCountEl.textContent = '0';
      }
    }
    
    const chaptersReadEl = document.getElementById('chapters-read');
    if (chaptersReadEl) {
      try {
        const totalChapters = window.readingProgressTracker ? 
          window.readingProgressTracker.getTotalChaptersRead() : 0;
        chaptersReadEl.textContent = totalChapters;
      } catch (error) {
        console.error('Error getting chapters read count:', error);
        chaptersReadEl.textContent = '0';
      }
    }
  }

  // Favorileri yükle
  async loadFavorites() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBase()}/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Favoriler API response:', data);
        this.favorites = data.favorites || [];
        console.log('Favoriler yüklendi:', this.favorites);
        this.displayFavorites();
        this.updateStats();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Favoriler yüklenemedi:', response.status, errorData);
        this.favorites = [];
        this.displayEmptyFavorites();
      }
    } catch (error) {
      console.error('Favoriler yüklenirken hata:', error);
      this.favorites = [];
      this.displayEmptyFavorites();
    }
  }

  // Favori serileri görüntüle
  async displayFavorites() {
    const favoritesGrid = document.getElementById('favorites-grid');
    const favoritesEmpty = document.getElementById('favorites-empty');
    
    if (!favoritesGrid) return;

    if (this.favorites.length === 0) {
      this.displayEmptyFavorites();
      return;
    }

    // Manhwa verilerini yükle
    try {
      const response = await fetch('data/manhwalar.json');
      const manhwaData = await response.json();
      
      // Favori serlerin detaylarını bul
      const favoriteDetails = this.favorites.map(favName => {
        return manhwaData.find(manhwa => 
          manhwa.title.toLowerCase() === favName.toLowerCase()
        );
      }).filter(Boolean); // undefined olanları filtrele

      if (favoriteDetails.length === 0) {
        this.displayEmptyFavorites();
        return;
      }

      // Favori kartlarını oluştur
      favoritesGrid.innerHTML = favoriteDetails.map(manhwa => `
        <div class="manhwa-card" data-series="${manhwa.title}">
          <div class="card-image">
            <img src="${manhwa.image}" alt="${manhwa.title}">
            <div class="card-overlay">
              <button class="remove-favorite-btn" data-series="${manhwa.title}" title="Favorilerden çıkar">
                <i class="fas fa-heart"></i>
              </button>
            </div>
          </div>
          <div class="card-content">
            <div class="card-info">
              <h3 class="card-title">${manhwa.title}</h3>
              <p class="card-genre">${manhwa.genre || 'Aksiyon'}</p>
              <p class="card-status">${manhwa.status || 'Devam Ediyor'}</p>
            </div>
            <div class="card-action">
              <a href="${manhwa.link}" class="read-btn">
                <i class="fas fa-book-open"></i>
                Oku
              </a>
            </div>
          </div>
        </div>
      `).join('');

      // Favorilerden çıkarma butonlarına event listener ekle
      document.querySelectorAll('.remove-favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const seriesName = btn.getAttribute('data-series');
          this.removeFavorite(seriesName);
        });
      });

      // Boş state'i gizle
      if (favoritesEmpty) {
        favoritesEmpty.style.display = 'none';
      }

    } catch (error) {
      console.error('Manhwa verileri yüklenirken hata:', error);
      this.displayEmptyFavorites();
    }
  }

  // Boş favori durumunu göster
  displayEmptyFavorites() {
    const favoritesGrid = document.getElementById('favorites-grid');
    const favoritesEmpty = document.getElementById('favorites-empty');
    
    if (favoritesGrid) {
      favoritesGrid.innerHTML = '';
    }
    if (favoritesEmpty) {
      favoritesEmpty.style.display = 'block';
    }
  }

  // Favoriden çıkar
  async removeFavorite(seriesName) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBase()}/favorites/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ seriesName })
      });

      if (response.ok) {
        const data = await response.json();
        this.favorites = data.favorites;
        this.displayFavorites();
        this.updateStats();
        console.log(`${seriesName} favorilerden çıkarıldı`);
      } else {
        console.error('Favorilerden çıkarma hatası');
      }
    } catch (error) {
      console.error('Favorilerden çıkarma hatası:', error);
    }
  }

  // Bookmark'ları yükle ve görüntüle
  loadBookmarks() {
    console.log('=== Loading bookmarks for profile ===');
    
    // BookmarkManager global instance'ını kontrol et
    if (window.bookmarkManager) {
      console.log('BookmarkManager instance found');
      const bookmarks = window.bookmarkManager.getAllBookmarks();
      console.log('Bookmarks from BookmarkManager:', bookmarks);
      console.log('Bookmark count:', Object.keys(bookmarks).length);
      this.displayBookmarks(bookmarks);
    } else if (window.BookmarkManager) {
      console.log('BookmarkManager class found but no instance, trying direct access');
      // BookmarkManager henüz yüklenmemişse, localStorage'dan direkt oku
      try {
        const stored = localStorage.getItem('toonNeko_bookmarks');
        console.log('Raw localStorage data:', stored);
        const bookmarks = stored ? JSON.parse(stored) : {};
        console.log('Parsed bookmarks from localStorage:', bookmarks);
        console.log('Bookmark count from localStorage:', Object.keys(bookmarks).length);
        this.displayBookmarks(bookmarks);
      } catch (error) {
        console.error('Error loading bookmarks from localStorage:', error);
        this.displayEmptyBookmarks();
      }
    } else {
      console.log('BookmarkManager not found, trying localStorage directly');
      // BookmarkManager henüz yüklenmemişse, localStorage'dan direkt oku
      try {
        const stored = localStorage.getItem('toonNeko_bookmarks');
        console.log('Raw localStorage data (no BookmarkManager):', stored);
        const bookmarks = stored ? JSON.parse(stored) : {};
        console.log('Parsed bookmarks (no BookmarkManager):', bookmarks);
        console.log('Bookmark count (no BookmarkManager):', Object.keys(bookmarks).length);
        this.displayBookmarks(bookmarks);
      } catch (error) {
        console.error('Error loading bookmarks (no BookmarkManager):', error);
        this.displayEmptyBookmarks();
      }
    }
  }

  // Bookmark'ları görüntüle
  displayBookmarks(bookmarks) {
    console.log('=== displayBookmarks called ===');
    
    const bookmarksGrid = document.getElementById('reading-grid');
    const bookmarksEmpty = document.getElementById('reading-empty');
    
    console.log('DOM elements found:', {
      bookmarksGrid: !!bookmarksGrid,
      bookmarksEmpty: !!bookmarksEmpty
    });
    
    if (!bookmarksGrid || !bookmarksEmpty) {
      console.error('Reading tab elements not found!');
      return;
    }

    console.log('Received bookmarks object:', bookmarks);
    console.log('Type of bookmarks:', typeof bookmarks);
    console.log('Is bookmarks an object?', typeof bookmarks === 'object' && bookmarks !== null);
    
    // Bookmarks'ı Object.entries ile array'e çevir
    const bookmarkEntries = Object.entries(bookmarks);
    console.log('Bookmark entries after Object.entries:', bookmarkEntries);
    console.log('Number of bookmark entries:', bookmarkEntries.length);
    
    if (bookmarkEntries.length === 0) {
      console.log('No bookmarks found, showing empty state');
      this.displayEmptyBookmarks();
      return;
    }

    console.log('Found bookmarks, creating grid...');
    
    // Grid'i göster, empty state'i gizle
    bookmarksGrid.style.display = 'grid';
    bookmarksEmpty.style.display = 'none';

    // Bookmark kartlarını oluştur
    const cardsHTML = bookmarkEntries.map(([series, chapter]) => {
      console.log(`Creating card for series: ${series}, chapter: ${chapter}`);
      const displayName = this.formatSeriesName(series);
      const chapterUrl = this.buildChapterUrl(series, chapter);
      
      console.log(`Display name: ${displayName}, URL: ${chapterUrl}`);
      
      return `
        <div class="bookmark-card" data-series="${series}">
          <div class="bookmark-card-header">
            <h3 class="bookmark-series-title">${displayName}</h3>
            <i class="fas fa-bookmark bookmark-icon"></i>
          </div>
          
          <div class="bookmark-chapter-info">
            <div class="bookmark-chapter-number">
              <i class="fas fa-play"></i>
              Bölüm ${chapter}
            </div>
            <div class="bookmark-date">
              Kaldığın yer
            </div>
          </div>
          
          <div class="bookmark-actions">
            <button class="bookmark-continue-btn" onclick="window.location.href='${chapterUrl}'" title="Bu bölümü okumaya devam et">
              <i class="fas fa-play"></i>
              Devam Et
            </button>
            <button class="bookmark-remove-btn" onclick="profileManager.removeBookmark('${series}')" title="Bookmark'ı kaldır">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          
          <div class="bookmark-progress" style="width: 100%"></div>
        </div>
      `;
    }).join('');

    console.log('Setting innerHTML for bookmarks grid...');
    bookmarksGrid.innerHTML = cardsHTML;
    console.log('Bookmark cards created successfully in reading tab');
  }

  // Boş bookmark state'ini göster
  displayEmptyBookmarks() {
    const bookmarksGrid = document.getElementById('reading-grid');
    const bookmarksEmpty = document.getElementById('reading-empty');
    
    if (bookmarksGrid && bookmarksEmpty) {
      bookmarksGrid.style.display = 'none';
      bookmarksEmpty.style.display = 'block';
    }
  }

  // Seri adını formatla (görüntüleme için)
  formatSeriesName(series) {
    // Seri adını daha okunabilir hale getir
    const nameMap = {
      'sololeveling': 'Solo Leveling',
      'nanomachine': 'Nano Machine',
      'omniscientreader': 'Omniscient Reader',
      'damnreincarnation': 'Damn Reincarnation',
      'martialgodregressedtolevel2': 'Martial God Regressed to Level 2'
    };
    
    return nameMap[series] || series.charAt(0).toUpperCase() + series.slice(1);
  }

  // Bölüm URL'ini oluştur
  buildChapterUrl(series, chapter) {
    // URL'i seri adına göre oluştur
    const seriesMap = {
      'sololeveling': 'solo leveling',
      'nanomachine': 'nanomachine',
      'omniscientreader': 'omniscient reader',
      'damnreincarnation': 'damn reincarnation',
      'martialgodregressedtolevel2': 'martial god regressed to level 2'
    };
    
    const urlSeries = seriesMap[series] || series;
    return `chapters/${urlSeries} chapters/bölüm${chapter}.html`;
  }

  // Bookmark'ı kaldır
  removeBookmark(series) {
    console.log('Removing bookmark for series:', series);
    
    if (window.bookmarkManager) {
      // BookmarkManager ile kaldır
      window.bookmarkManager.removeBookmark(series);
      
      // Görüntüyü yenile
      const bookmarks = window.bookmarkManager.getAllBookmarks();
      this.displayBookmarks(bookmarks);
      
      // Başarı mesajı
      if (window.bookmarkManager.showMessage) {
        window.bookmarkManager.showMessage(`${this.formatSeriesName(series)} serisi bookmark'tan kaldırıldı`, 'success');
      }
    } else {
      // Fallback: localStorage'dan direkt kaldır
      try {
        const stored = localStorage.getItem('toonNeko_bookmarks');
        const bookmarks = stored ? JSON.parse(stored) : {};
        
        if (bookmarks[series]) {
          delete bookmarks[series];
          localStorage.setItem('toonNeko_bookmarks', JSON.stringify(bookmarks));
          this.displayBookmarks(bookmarks);
          console.log('Bookmark removed successfully');
        }
      } catch (error) {
        console.error('Error removing bookmark:', error);
      }
    }
  }

  // Bookmark sayısını güncelle (istatistiklerde)
  updateBookmarkStats() {
    try {
      const bookmarks = window.bookmarkManager ? 
        window.bookmarkManager.getAllBookmarks() : 
        JSON.parse(localStorage.getItem('toonNeko_bookmarks') || '{}');
      
      const bookmarkCount = Object.keys(bookmarks).length;
      
      // Eğer bookmark sayısını gösterecek bir element varsa güncelleyelim
      // Şimdilik reading-count'a bookmark sayısını yazalım
      const readingCountEl = document.getElementById('reading-count');
      if (readingCountEl) {
        readingCountEl.textContent = bookmarkCount;
      }
    } catch (error) {
      console.error('Error updating bookmark stats:', error);
    }
  }

  // Sekme işlevlerini başlat
  initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');

        // Aktif sekme butonunu güncelle
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Aktif sekme içeriğini güncelle
        tabContents.forEach(content => {
          content.classList.remove('active');
          if (content.id === `${targetTab}-tab`) {
            content.classList.add('active');
          }
        });

        // Sekmeye özel işlemleri çalıştır
        this.handleTabChange(targetTab);
      });
    });
  }

  // Sekme değişikliklerini işle
  handleTabChange(tabName) {
    switch (tabName) {
      case 'favorites':
        // Favoriler zaten yüklendi
        break;
      case 'reading':
        // Bookmark'ları yükle ve göster (okumaya devam et bölümünde)
        console.log('Okuyorum sekmesi açıldı - bookmark\'lar yükleniyor');
        this.loadBookmarks();
        this.updateStats(); // İstatistikleri de güncelle
        break;
      case 'completed':
        // Tamamlanan serileri yükle ve göster
        console.log('Tamamlanan seriler sekmesi açıldı');
        this.loadCompletedSeries();
        break;
      case 'settings':
        // Ayarlar sekmesi
        this.loadSettings();
        break;
    }
  }

  // Ayarları yükle
  loadSettings() {
    const usernameInput = document.getElementById('username-input');
    const emailInput = document.getElementById('email-input');
    
    if (usernameInput && this.user) {
      usernameInput.value = this.user.username || '';
    }
    if (emailInput && this.user) {
      emailInput.value = this.user.email || '';
    }
  }

  // Ayarlar işlevlerini başlat
  initSettings() {
    // Profil kaydetme
    const saveProfileBtn = document.getElementById('save-profile');
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', () => {
        this.saveProfile();
      });
    }

    // Hesap silme
    const deleteAccountBtn = document.getElementById('delete-account');
    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener('click', () => {
        this.confirmDeleteAccount();
      });
    }
  }

  // --- AVATAR SEÇİMİ ---
  initAvatarSelection() {
    const avatarBtn = document.getElementById('change-avatar-btn');
    const avatarModal = document.getElementById('avatar-modal');
    const closeAvatarModal = document.getElementById('close-avatar-modal');
    const avatarList = document.getElementById('avatar-list');
    const avatarImg = document.getElementById('profile-avatar-img');
    const avatarOptions = [
      'bunnygirl.png',
      'catboy.png',
      'foxboy.png',
      'mangagirl.png',
      'witchelf.png',
      'wizardboy.png'
    ];
    let selectedAvatar = this.user && this.user.avatar ? this.user.avatar : 'bunnygirl.png';

    // Modalı aç
    if (avatarBtn && avatarModal) {
      avatarBtn.addEventListener('click', () => {
        avatarModal.style.display = 'flex';
        this.renderAvatarOptions(selectedAvatar);
      });
    }
    // Modalı kapat
    if (closeAvatarModal && avatarModal) {
      closeAvatarModal.addEventListener('click', () => {
        avatarModal.style.display = 'none';
      });
    }
    // Modal dışında tıklayınca kapat
    if (avatarModal) {
      avatarModal.addEventListener('click', (e) => {
        if (e.target === avatarModal) avatarModal.style.display = 'none';
      });
    }
    // Avatar seçeneklerini renderla
    this.renderAvatarOptions = (currentAvatar) => {
      if (!avatarList) return;
      avatarList.innerHTML = '';
      avatarOptions.forEach(filename => {
        const div = document.createElement('div');
        div.className = 'avatar-option' + (filename === currentAvatar ? ' selected' : '');
        div.innerHTML = `<img src="images/avatars/${filename}" alt="${filename}">`;
        div.addEventListener('click', () => {
          this.updateAvatar(filename);
        });
        avatarList.appendChild(div);
      });
    };
    // Sayfa ilk açıldığında avatarı göster
    if (avatarImg && this.user && this.user.avatar) {
      avatarImg.src = `images/avatars/${this.user.avatar}`;
    }
  }

  async updateAvatar(filename) {
    const token = localStorage.getItem('token');
    console.log('Avatar güncelleme başlıyor:', filename, 'Token:', token ? 'Var' : 'Yok');
    try {
      const response = await fetch(`${getApiBase()}/profile/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar: filename })
      });
      
      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);
      
      if (response.ok) {
        // Güncel avatarı göster
        const avatarImg = document.getElementById('profile-avatar-img');
        if (avatarImg) avatarImg.src = `images/avatars/${filename}`;
        // Modalı kapat
        const avatarModal = document.getElementById('avatar-modal');
        if (avatarModal) avatarModal.style.display = 'none';
        // Kullanıcı objesini güncelle
        if (this.user) this.user.avatar = filename;
        this.renderAvatarOptions(filename);
        this.showAlert('Avatar başarıyla güncellendi!', 'success');
      } else {
        this.showAlert(`Avatar güncellenemedi: ${responseData.message || 'Bilinmeyen hata'}`, 'error');
      }
    } catch (err) {
      console.error('Avatar güncelleme hatası:', err);
      this.showAlert('Sunucu hatası! Lütfen tekrar deneyin.', 'error');
    }
  }

  // Alert box gösterme fonksiyonu
  showAlert(message, type = 'error') {
    const alertBox = document.getElementById('alert-box');
    if (alertBox) {
      alertBox.textContent = message;
      alertBox.style.display = 'block';
      
      // Tip'e göre stil
      if (type === 'success') {
        alertBox.className = 'success';
      } else {
        alertBox.className = '';
      }
      
      setTimeout(() => {
        alertBox.style.display = 'none';
      }, 3000);
    } else {
      // Fallback alert
      alert(message);
    }
  }

  // Profil bilgilerini kaydet
  async saveProfile() {
    const username = document.getElementById('username-input')?.value?.trim();
    const email = document.getElementById('email-input')?.value?.trim();

    console.log('Profil güncelleme başlatıldı:', { username, email });

    if (!username || !email) {
      this.showAlert('Lütfen tüm alanları doldurun', 'error');
      return;
    }

    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showAlert('Lütfen geçerli bir e-posta adresi girin', 'error');
      return;
    }

    // Kullanıcı adı uzunluk kontrolü
    if (username.length < 3) {
      this.showAlert('Kullanıcı adı en az 3 karakter olmalıdır', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('Token mevcut:', !!token);
      
      const response = await fetch(`${getApiBase()}/profile/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, email })
      });

      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API response data:', data);

      if (response.ok) {
        this.user.username = username;
        this.user.email = email;
        localStorage.setItem('username', username); // LocalStorage'ı da güncelle
        this.updateProfileDisplay();
        this.showAlert('Profil bilgileri başarıyla güncellendi!', 'success');
        
        // Navbar'daki kullanıcı adını güncelle
        if (typeof window.updateAuthNavbar === 'function') {
          window.updateAuthNavbar();
        }
      } else {
        this.showAlert(data.message || 'Profil güncellenirken hata oluştu', 'error');
      }
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      this.showAlert('Sunucu hatası. Lütfen tekrar deneyin.', 'error');
    }
  }

  // Hesap silme onayı
  confirmDeleteAccount() {
    const confirmation = confirm(
      '⚠️ DİKKAT ⚠️\n\n' +
      'Hesabınızı silmek istediğinizden emin misiniz?\n\n' +
      '• Bu işlem GERİ ALINAMAZ\n' +
      '• Tüm profil bilgileriniz silinecek\n' +
      '• Favorileriniz ve bookmark\'larınız kaybolacak\n' +
      '• Yorumlarınız ve değerlendirmeleriniz silinecek\n\n' +
      'Devam etmek için "Tamam"a basın.'
    );
    
    if (confirmation) {
      // İkinci onay
      const finalConfirmation = confirm(
        'Son kez soruyoruz: Hesabınızı kalıcı olarak silmek istediğinizden EMİN misiniz?'
      );
      
      if (finalConfirmation) {
        this.deleteAccount();
      }
    }
  }

  // Hesabı sil
  async deleteAccount() {
    try {
      const token = localStorage.getItem('token');
      
      this.showAlert('Hesap siliniyor...', 'info');
      
      const response = await fetch(`${getApiBase()}/profile/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Tüm yerel verileri temizle
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('favorites');
        localStorage.removeItem('bookmarks');
        localStorage.removeItem('readingProgress');
        
        this.showAlert('Hesabınız başarıyla silindi. Ana sayfaya yönlendiriliyorsunuz...', 'success');
        
        // Anasayfaya yönlendir
        setTimeout(() => {
          window.location.href = window.location.pathname.includes('/client/') ? 
            '/client/index.html' : 'index.html';
        }, 3000);
      } else {
        const data = await response.json();
        this.showAlert(data.message || 'Hesap silinirken hata oluştu', 'error');
      }
    } catch (error) {
      console.error('Hesap silme hatası:', error);
      this.showAlert('Sunucu hatası. Lütfen tekrar deneyin.', 'error');
    }
  }

  // Navbar durumunu güncelle
  updateNavbar() {
    const token = localStorage.getItem('token');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const username = localStorage.getItem('username');

    // Desktop navbar elements
    const authButtonsNav = document.getElementById('auth-buttons-nav');
    const authButtonsNav2 = document.getElementById('auth-buttons-nav-2');
    const userInfoNav = document.getElementById('user-info-nav');
    const userInfoNav2 = document.getElementById('user-info-nav-2');
    
    // Side menu elements
    const sideAuthButtons = document.getElementById('side-auth-buttons');
    const sideUserInfo = document.getElementById('side-user-info');
    const usernameDisplay = document.getElementById('username-display');
    const sideUsernameDisplay = document.getElementById('side-username-display');

    if (token && isLoggedIn && username) {
      // Kullanıcı giriş yapmış
      if (authButtonsNav) authButtonsNav.style.display = 'none';
      if (authButtonsNav2) authButtonsNav2.style.display = 'none';
      if (userInfoNav) userInfoNav.style.display = 'block';
      if (userInfoNav2) userInfoNav2.style.display = 'block';
      if (sideAuthButtons) sideAuthButtons.style.display = 'none';
      if (sideUserInfo) sideUserInfo.style.display = 'block';
      if (usernameDisplay) usernameDisplay.textContent = `Hoş geldin, ${username}`;
      if (sideUsernameDisplay) sideUsernameDisplay.textContent = `Hoş geldin, ${username}`;
    } else {
      // Kullanıcı giriş yapmamış
      if (authButtonsNav) authButtonsNav.style.display = 'block';
      if (authButtonsNav2) authButtonsNav2.style.display = 'block';
      if (userInfoNav) userInfoNav.style.display = 'none';
      if (userInfoNav2) userInfoNav2.style.display = 'none';
      if (sideAuthButtons) sideAuthButtons.style.display = 'block';
      if (sideUserInfo) sideUserInfo.style.display = 'none';
    }
  }

  // Çıkış yap
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    // Anasayfaya yönlendir - her klasörden çalışacak şekilde
    window.location.href = window.location.pathname.includes('/client/') ? 
      '/client/index.html' : 'index.html';
  }

  // Tamamlanan serileri yükle ve görüntüle
  loadCompletedSeries() {
    console.log('Loading completed series for profile...');
    
    if (window.completedSeriesTracker) {
      try {
        const completedSeries = window.completedSeriesTracker.getAllCompletedSeries();
        console.log('Completed series loaded from tracker:', completedSeries);
        this.displayCompletedSeries(completedSeries);
        
        // Otomatik tamamlanma önerilerini kontrol et
        this.checkCompletionSuggestions();
      } catch (error) {
        console.error('Error loading completed series:', error);
        this.displayEmptyCompletedSeries();
      }
    } else {
      console.log('CompletedSeriesTracker not available');
      this.displayEmptyCompletedSeries();
    }
  }

  // Otomatik tamamlanma önerilerini kontrol et
  checkCompletionSuggestions() {
    if (!window.completedSeriesTracker || !window.readingProgressTracker) {
      console.log('Trackers not available for completion suggestions');
      return;
    }

    const suggestions = window.completedSeriesTracker.checkAllSeriesForCompletion();
    console.log('Completion suggestions found:', suggestions);

    if (suggestions.length > 0) {
      // En önemli öneriyi göster
      const topSuggestion = suggestions[0];
      this.showCompletionSuggestionModal(topSuggestion);
    }
  }

  // Tamamlanma önerisi modalını göster
  showCompletionSuggestionModal(suggestion) {
    const modal = document.getElementById('completion-modal');
    const title = document.getElementById('completion-modal-title');
    const message = document.getElementById('completion-modal-message');
    const chaptersRead = document.getElementById('completion-chapters-read');
    const percentage = document.getElementById('completion-percentage');
    const progressBar = document.getElementById('completion-progress-bar');
    
    if (!modal) {
      console.error('Completion modal not found');
      return;
    }

    // Modal içeriğini doldur
    title.textContent = suggestion.priority === 'high' ? '🏆 Tebrikler!' : '📚 Tamamlama Önerisi';
    message.textContent = suggestion.message;
    
    const progress = suggestion.progress;
    chaptersRead.textContent = `${progress.read}/${progress.total}`;
    percentage.textContent = `${progress.percentage}%`;
    progressBar.style.width = `${progress.percentage}%`;

    // Modal'ı göster
    modal.style.display = 'flex';
    
    // Rating sistemi başlat
    this.initCompletionModal(suggestion.seriesKey);
  }

  // Completion modal işlevselliği
  initCompletionModal(seriesKey) {
    const modal = document.getElementById('completion-modal');
    const stars = document.querySelectorAll('.rating-stars-input .star');
    const reviewTextarea = document.getElementById('completion-review');
    const completeBtn = document.getElementById('complete-series-btn');
    const cancelBtn = document.getElementById('cancel-completion-btn');
    
    let selectedRating = 0;

    // Yıldız tıklama olayları
    stars.forEach(star => {
      star.addEventListener('click', () => {
        selectedRating = parseInt(star.dataset.rating);
        this.updateStarDisplay(selectedRating);
      });

      star.addEventListener('mouseenter', () => {
        const rating = parseInt(star.dataset.rating);
        this.updateStarDisplay(rating, true);
      });
    });

    // Mouse leave olayı
    document.querySelector('.rating-stars-input').addEventListener('mouseleave', () => {
      this.updateStarDisplay(selectedRating);
    });

    // Tamamla butonu
    completeBtn.onclick = () => {
      const review = reviewTextarea.value.trim();
      
      const success = window.completedSeriesTracker.markSeriesAsCompleted(
        seriesKey, 
        selectedRating || null, 
        review || null
      );
      
      if (success) {
        this.showSuccessNotification('🎉 Seri tamamlananlar listesine eklendi!');
        this.loadCompletedSeries();
        this.updateStats();
        modal.style.display = 'none';
        this.resetCompletionModal();
      } else {
        this.showErrorNotification('❌ Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    };

    // İptal butonu
    cancelBtn.onclick = () => {
      modal.style.display = 'none';
      this.resetCompletionModal();
    };

    // Modal dışına tıklama
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        this.resetCompletionModal();
      }
    };
  }

  // Yıldız görünümünü güncelle
  updateStarDisplay(rating, isHover = false) {
    const stars = document.querySelectorAll('.rating-stars-input .star');
    stars.forEach((star, index) => {
      const starIcon = star.querySelector('i');
      if (index < rating) {
        starIcon.className = 'fas fa-star';
        star.classList.add('active');
      } else {
        starIcon.className = 'far fa-star';
        star.classList.remove('active');
      }
    });
  }

  // Modal'ı sıfırla
  resetCompletionModal() {
    document.getElementById('completion-review').value = '';
    this.updateStarDisplay(0);
    
    // Event listener'ları temizle
    const completeBtn = document.getElementById('complete-series-btn');
    const cancelBtn = document.getElementById('cancel-completion-btn');
    const modal = document.getElementById('completion-modal');
    
    completeBtn.onclick = null;
    cancelBtn.onclick = null;
    modal.onclick = null;
  }

  // Başarı bildirimi göster
  showSuccessNotification(message) {
    this.showNotification(message, 'success');
  }

  // Hata bildirimi göster
  showErrorNotification(message) {
    this.showNotification(message, 'error');
  }

  // Genel bildirim sistemi
  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
      </div>
      <button class="notification-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    document.body.appendChild(notification);
    
    // Animasyon
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Otomatik kaldırma
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  // Tamamlanan serileri görüntüle
  displayCompletedSeries(completedSeries) {
    const completedGrid = document.getElementById('completed-grid');
    const completedEmpty = document.getElementById('completed-empty');
    
    if (!completedGrid || !completedEmpty) {
      console.error('Completed series elements not found');
      return;
    }

    console.log('Displaying completed series:', completedSeries);
    
    if (!completedSeries || completedSeries.length === 0) {
      this.displayEmptyCompletedSeries();
      return;
    }

    // Grid'i göster, empty state'i gizle
    completedGrid.style.display = 'grid';
    completedEmpty.style.display = 'none';

    try {
      // Tamamlanan seri kartlarını oluştur
      completedGrid.innerHTML = completedSeries.map(series => {
        // Null/undefined kontrolleri
        if (!series) {
          console.warn('Empty series object found');
          return '';
        }

        const completionDate = series.completionDate ? 
          new Date(series.completionDate).toLocaleDateString('tr-TR') : 
          'Bilinmiyor';
        const ratingStars = this.generateRatingStars(series.rating || 0);
        
        // readProgress için güvenli erişim
        const readProgress = series.readProgress || { read: 0, total: 0, percentage: 0 };
        
        return `
          <div class="completed-series-card" data-series="${series.key || 'unknown'}">
            <div class="completed-series-image">
              <img src="${series.image || 'images/default-cover.jpg'}" alt="${series.title || 'Bilinmeyen Seri'}" onerror="this.src='images/default-cover.jpg'">
              <div class="completion-badge">
                <i class="fas fa-trophy"></i>
                Tamamlandı
              </div>
            </div>
            
            <div class="completed-series-info">
              <h3 class="completed-series-title">${series.title || 'Bilinmeyen Seri'}</h3>
              
              <div class="completion-stats">
                <div class="stat-row">
                  <span class="stat-label">Tamamlanma:</span>
                  <span class="stat-value">${completionDate}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">Okundu:</span>
                  <span class="stat-value">${readProgress.read}/${readProgress.total} bölüm</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">İlerleme:</span>
                  <span class="stat-value">${readProgress.percentage}%</span>
                </div>
              </div>
              
              <div class="series-rating">
                <span class="rating-label">Puanım:</span>
                <div class="rating-stars">
                  ${ratingStars}
                </div>
                <span class="rating-value">${series.rating || 'Puanlanmamış'}</span>
              </div>
              
              ${series.review ? `
                <div class="series-review">
                  <p class="review-text">"${series.review}"</p>
                </div>
              ` : ''}
              
              <div class="completed-series-actions">
                <button class="edit-rating-btn" onclick="profileManager.editSeriesRating('${series.key}', ${series.rating || 0})" title="Puanı düzenle">
                  <i class="fas fa-star"></i>
                  Puanla
                </button>
                <button class="remove-completed-btn" onclick="profileManager.removeFromCompleted('${series.key}')" title="Tamamlananlardan kaldır">
                  <i class="fas fa-times"></i>
                  Kaldır
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      console.log('Completed series cards created successfully');
    } catch (error) {
      console.error('Error creating completed series cards:', error);
      this.displayEmptyCompletedSeries();
    }
  }

  // Boş tamamlanan seriler state'ini göster
  displayEmptyCompletedSeries() {
    const completedGrid = document.getElementById('completed-grid');
    const completedEmpty = document.getElementById('completed-empty');
    
    if (completedGrid && completedEmpty) {
      completedGrid.style.display = 'none';
      completedEmpty.style.display = 'block';
    }
  }

  // Rating yıldızları oluştur
  generateRatingStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars += '<i class="fas fa-star filled"></i>';
      } else {
        stars += '<i class="far fa-star"></i>';
      }
    }
    return stars;
  }

  // Seri rating'ini düzenle
  editSeriesRating(seriesKey, currentRating) {
    const newRating = prompt(`Bu seri için puanınız (1-5):`, currentRating || '');
    
    if (newRating !== null) {
      const rating = parseInt(newRating);
      if (rating >= 1 && rating <= 5) {
        if (window.completedSeriesTracker) {
          const success = window.completedSeriesTracker.updateSeriesRating(seriesKey, rating);
          if (success) {
            this.loadCompletedSeries(); // Yeniden yükle
            alert('Puan güncellendi!');
          } else {
            alert('Puan güncellenirken hata oluştu.');
          }
        }
      } else {
        alert('Lütfen 1-5 arasında bir puan girin.');
      }
    }
  }

  // Seriyi tamamlananlardan kaldır
  removeFromCompleted(seriesKey) {
    const confirmRemove = confirm('Bu seriyi tamamlananlardan kaldırmak istediğinizden emin misiniz?');
    
    if (confirmRemove && window.completedSeriesTracker) {
      const success = window.completedSeriesTracker.unmarkSeriesAsCompleted(seriesKey);
      if (success) {
        this.loadCompletedSeries(); // Yeniden yükle
        alert('Seri tamamlananlardan kaldırıldı.');
      } else {
        alert('Seri kaldırılırken hata oluştu.');
      }
    }
  }
}

// Sayfa yüklendiğinde profil yöneticisini başlat
let profileManager;
document.addEventListener('DOMContentLoaded', () => {
  profileManager = new ProfileManager();
});

// Modal işlevleri
document.addEventListener('DOMContentLoaded', function() {
  // Navbar modal açma butonları
  const openRegisterNavbar = document.getElementById('open-register-modal-navbar');
  const openLoginNavbar = document.getElementById('open-login-modal-navbar');
  const openRegisterSide = document.getElementById('open-register-modal-side');
  const openLoginSide = document.getElementById('open-login-modal-side');

  if (openRegisterNavbar) {
    openRegisterNavbar.addEventListener('click', () => {
      document.getElementById('register-modal').style.display = 'flex';
    });
  }

  if (openLoginNavbar) {
    openLoginNavbar.addEventListener('click', () => {
      document.getElementById('login-modal').style.display = 'flex';
    });
  }

  if (openRegisterSide) {
    openRegisterSide.addEventListener('click', () => {
      document.getElementById('register-modal').style.display = 'flex';
      // Side menu'yu kapat
      const sideMenu = document.getElementById('sideMenu');
      const sideOverlay = document.getElementById('sideOverlay');
      if (sideMenu) sideMenu.classList.remove('open');
      if (sideOverlay) sideOverlay.classList.remove('show');
    });
  }

  if (openLoginSide) {
    openLoginSide.addEventListener('click', () => {
      document.getElementById('login-modal').style.display = 'flex';
      // Side menu'yu kapat
      const sideMenu = document.getElementById('sideMenu');
      const sideOverlay = document.getElementById('sideOverlay');
      if (sideMenu) sideMenu.classList.remove('open');
      if (sideOverlay) sideOverlay.classList.remove('show');
    });
  }

  // Çıkış butonları
  const logoutBtn = document.getElementById('logout-btn');
  const sideLogoutBtn = document.getElementById('side-logout-btn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      profileManager.logout();
    });
  }

  if (sideLogoutBtn) {
    sideLogoutBtn.addEventListener('click', () => {
      profileManager.logout();
    });
  }

  // Kayıt modalı
  const registerModal = document.getElementById('register-modal');
  const closeRegisterModal = document.getElementById('close-register-modal');
  const registerForm = document.getElementById('register-form');

  if (closeRegisterModal) {
    closeRegisterModal.addEventListener('click', () => {
      registerModal.style.display = 'none';
    });
  }

  // Modal dışına tıklandığında kapatma
  if (registerModal) {
    registerModal.addEventListener('click', (e) => {
      if (e.target === registerModal) {
        registerModal.style.display = 'none';
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('register-username').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;

      try {
        const response = await fetch(window.APP_CONFIG.API_BASE + '/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
          alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
          registerModal.style.display = 'none';
          // Giriş modalını aç
          document.getElementById('login-modal').style.display = 'flex';
        } else {
          alert(data.message || 'Kayıt işlemi başarısız');
        }
      } catch (error) {
        console.error('Kayıt hatası:', error);
        alert('Kayıt işlemi sırasında bir hata oluştu');
      }
    });
  }

  // Giriş modalı
  const loginModal = document.getElementById('login-modal');
  const closeLoginModal = document.getElementById('close-login-modal');
  const loginForm = document.getElementById('login-form');

  if (closeLoginModal) {
    closeLoginModal.addEventListener('click', () => {
      loginModal.style.display = 'none';
    });
  }

  // Modal dışına tıklandığında kapatma
  if (loginModal) {
    loginModal.addEventListener('click', (e) => {
      if (e.target === loginModal) {
        loginModal.style.display = 'none';
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const identifier = document.getElementById('login-identifier').value;
      const password = document.getElementById('login-password').value;

      try {
        const response = await fetch(window.APP_CONFIG.API_BASE + '/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ identifier, password })
        });

        const data = await response.json();
        console.log('Login response:', data);

        if (response.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('username', data.user ? data.user.username : data.username);
          
          alert('Giriş başarılı!');
          loginModal.style.display = 'none';
          
          // Login required modal'ı da gizle
          const loginRequiredModal = document.getElementById('login-required-modal');
          if (loginRequiredModal) {
            loginRequiredModal.style.display = 'none';
          }
          
          // Navbar'ı güncelle
          if (profileManager) {
            profileManager.updateNavbar();
          }
          
          window.location.reload(); // Sayfayı yenile
        } else {
          alert(data.message || 'Giriş işlemi başarısız');
        }
      } catch (error) {
        console.error('Giriş hatası:', error);
        alert('Giriş işlemi sırasında bir hata oluştu');
      }
    });
  }

  // Switch between login and register modals
  const switchToRegister = document.getElementById('switch-to-register');
  const switchToLogin = document.getElementById('switch-to-login');

  if (switchToRegister) {
    switchToRegister.addEventListener('click', (e) => {
      e.preventDefault();
      loginModal.style.display = 'none';
      registerModal.style.display = 'flex';
    });
  }

  if (switchToLogin) {
    switchToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      registerModal.style.display = 'none';
      loginModal.style.display = 'flex';
    });
  }
});

// Arama fonksiyonu
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  
  if (searchInput && searchResults) {
    searchInput.addEventListener('input', function() {
      const query = this.value.trim();
      if (query.length === 0) {
        searchResults.classList.add('hidden');
        return;
      }
      
      fetch('data/manhwalar.json')
        .then(response => response.json())
        .then(data => {
          const results = data.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 5);
          
          if (results.length > 0) {
            searchResults.innerHTML = results.map(item => `
              <div class="result-item">
                <img src="${item.image}" alt="${item.title}">
                <div class="result-info">
                  <a href="${item.link}">${item.title}</a>
                </div>
              </div>
            `).join('');
            searchResults.classList.remove('hidden');
          } else {
            searchResults.innerHTML = '<div class="result-item"><div class="result-info">Sonuç bulunamadı</div></div>';
            searchResults.classList.remove('hidden');
          }
        })
        .catch(error => {
          console.error('Arama hatası:', error);
          searchResults.classList.add('hidden');
        });
    });
    
    document.addEventListener('click', function(e) {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.add('hidden');
      }
    });
  }
});

// API base URL fonksiyonu
function getApiBase() {
  return window.APP_CONFIG?.API_BASE || '/api';
}
