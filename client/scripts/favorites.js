// API taban URL'sini getir
function getApiBase() {
  return window.APP_CONFIG?.API_BASE || '/api';
}

// Favoriler yönetimi
class FavoritesManager {
  constructor() {
    this.favorites = [];
    this.init();
  }

  // Favori serilerini sunucudan yükle
  async loadFavorites() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('Token bulunamadı, favoriler yüklenemedi');
        this.favorites = [];
        return;
      }

      console.log('Favoriler yükleniyor...');
      const response = await fetch(`${getApiBase()}/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Favorites API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        this.favorites = data.favorites || [];
        console.log('Favoriler yüklendi:', this.favorites);
      } else {
        console.error('Favorites API hatası:', response.status, response.statusText);
        this.favorites = [];
      }
    } catch (error) {
      console.error('Favoriler yüklenirken hata:', error);
      this.favorites = [];
    }
  }

  // Seriyi favorilere ekle/çıkar (sunucuya kaydet)
  async toggleFavorite(seriesName) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token bulunamadı');
      }

      const response = await fetch(`${getApiBase()}/favorites/toggle`, {
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
        return data.isAdded;
      } else {
        throw new Error('Sunucu hatası');
      }
    } catch (error) {
      console.error('Favori toggle hatası:', error);
      // Fallback: localStorage kullan
      const index = this.favorites.indexOf(seriesName);
      if (index > -1) {
        this.favorites.splice(index, 1);
        return false;
      } else {
        this.favorites.push(seriesName);
        return true;
      }
    }
  }

  // Serinin favori olup olmadığını kontrol et
  isFavorite(seriesName) {
    return this.favorites.includes(seriesName);
  }

  // Favori butonunu güncelle
  updateFavoriteButton(btn, isFavorited) {
    const icon = btn.querySelector('i');
    const text = btn.querySelector('.favorite-text');
    
    if (isFavorited) {
      btn.classList.add('favorited');
      icon.className = 'fas fa-heart';
      if (text) text.textContent = 'Favorilerden Çıkar';
    } else {
      btn.classList.remove('favorited');
      icon.className = 'far fa-heart';
      if (text) text.textContent = 'Favorilere Ekle';
    }
  }

  // Sayfayı başlat
  async init() {
    const favoriteBtn = document.getElementById('favorite-btn');
    if (!favoriteBtn) return;

    const seriesName = favoriteBtn.getAttribute('data-series');
    
    // Favorileri yükle
    await this.loadFavorites();
    
    // Başlangıç durumunu ayarla
    this.updateFavoriteButton(favoriteBtn, this.isFavorite(seriesName));

    // Click event listener ekle
    favoriteBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // Kullanıcı giriş yapmış mı kontrol et - sadece token yeterli
      const token = localStorage.getItem('token');
      
      console.log('Token check:', token ? 'Token var' : 'Token yok');
      console.log('isLoggedIn check:', localStorage.getItem('isLoggedIn'));
      
      if (!token) {
        alert('Favorilere eklemek için giriş yapmalısınız!');
        // Giriş modalını aç
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
          loginModal.style.display = 'flex';
        }
        return;
      }

      // Loading durumu göster
      favoriteBtn.disabled = true;
      favoriteBtn.style.opacity = '0.6';

      try {
        const isNowFavorited = await this.toggleFavorite(seriesName);
        this.updateFavoriteButton(favoriteBtn, isNowFavorited);

        // Kullanıcıya bildirim göster
        this.showNotification(seriesName, isNowFavorited);
      } catch (error) {
        console.error('Favori işlemi hatası:', error);
        alert('Favori işlemi sırasında bir hata oluştu.');
      } finally {
        // Loading durumunu kaldır
        favoriteBtn.disabled = false;
        favoriteBtn.style.opacity = '1';
      }
    });
  }

  // Bildirim göster
  showNotification(seriesName, isAdded) {
    const message = isAdded 
      ? `${seriesName} favorilere eklendi!` 
      : `${seriesName} favorilerden çıkarıldı!`;
    
    // Basit bildirim oluştur
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${isAdded ? '#4CAF50' : '#f44336'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Animasyon ile göster
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // 3 saniye sonra kaldır
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Tüm favori serileri getir
  getAllFavorites() {
    return this.favorites;
  }

  // Favori sayısını getir
  getFavoriteCount() {
    return this.favorites.length;
  }
}

// Sayfa yüklendiğinde favoriler yöneticisini başlat
document.addEventListener('DOMContentLoaded', () => {
  window.favoritesManager = new FavoritesManager();
});
