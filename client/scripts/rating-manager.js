// Ortalama puanları yönetmek için yardımcı fonksiyonlar
class RatingManager {
  constructor() {
    this.ratingsCache = new Map();
    this.loadingPromises = new Map();
  }

  // Tek bir seri için ortalama puan al
  async getAverageRating(seriesId) {
    console.log('🔥 getAverageRating called for:', seriesId);
    
    if (this.ratingsCache.has(seriesId)) {
      console.log('🎯 Rating found in cache for:', seriesId);
      return this.ratingsCache.get(seriesId);
    }

    if (this.loadingPromises.has(seriesId)) {
      console.log('⏳ Rating already loading for:', seriesId);
      return this.loadingPromises.get(seriesId);
    }

    console.log('🌐 Fetching rating from API for:', seriesId);
    const apiBase = window.APP_CONFIG?.API_BASE || '/api';
    const apiUrl = `${apiBase}/ratings/${seriesId}/average`;
    console.log('📍 API URL:', apiUrl);
    
    const promise = fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors',
      credentials: 'include'
    })
      .then(r => {
        console.log('📡 API response status for', seriesId, ':', r.status);
        console.log('📡 API response ok for', seriesId, ':', r.ok);
        console.log('📡 API response statusText for', seriesId, ':', r.statusText);
        
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
        
        return r.json();
      })
      .then(data => {
        console.log('📊 API response data for', seriesId, ':', data);
        const rating = {
          average: data.average || 0,
          count: data.count || 0
        };
        this.ratingsCache.set(seriesId, rating);
        this.loadingPromises.delete(seriesId);
        console.log('💾 Rating cached for', seriesId, ':', rating);
        return rating;
      })
      .catch(err => {
        console.error('💥 Rating yükleme hatası for', seriesId, ':', err);
        console.error('💥 Error name:', err.name);
        console.error('💥 Error message:', err.message);
        console.error('💥 Error stack:', err.stack);
        
        const defaultRating = { average: 0, count: 0 };
        this.ratingsCache.set(seriesId, defaultRating);
        this.loadingPromises.delete(seriesId);
        console.log('🛑 Default rating set for', seriesId, ':', defaultRating);
        return defaultRating;
      });

    this.loadingPromises.set(seriesId, promise);
    console.log('🔄 Promise stored for', seriesId);
    return promise;
  }

  // Çoklu seri için ortalama puanları al
  async getMultipleAverageRatings(seriesIds) {
    console.log('🔄 getMultipleAverageRatings çağrıldı:', seriesIds);
    const promises = seriesIds.map(id => this.getAverageRating(id));
    const results = await Promise.all(promises);
    console.log('🔄 getMultipleAverageRatings sonuçları:', results);
    return results;
  }

  // Rating gösterimi için HTML oluştur
  createRatingDisplay(rating) {
    console.log('🎨 createRatingDisplay çağrıldı:', rating);
    
    if (!rating || rating.count === 0 || rating.average === null || rating.average === undefined) {
      console.log('🎨 Puan yok, default HTML döndürülüyor');
      return '<div class="rating-display no-rating">Henüz puan yok</div>';
    }

    const avg = rating.average.toFixed(1);
    const stars = this.createStarsDisplay(rating.average);
    
    const html = `
      <div class="rating-display">
        <div class="rating-stars">${stars}</div>
        <span class="rating-text">${avg} (${rating.count})</span>
      </div>
    `;
    
    console.log('🎨 Rating HTML oluşturuldu:', html.substring(0, 100) + '...');
    return html;
  }

  // Yıldız görünümü oluştur
  createStarsDisplay(average) {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
      let fillPercentage = 0;
      if (average >= i) {
        fillPercentage = 100;
      } else if (average >= i - 1) {
        fillPercentage = (average - (i - 1)) * 100;
      }
      
      starsHtml += `
        <span class="rating-star-wrapper">
          <span class="rating-star-bg">★</span>
          <span class="rating-star-fill" style="width: ${fillPercentage}%">★</span>
        </span>
      `;
    }
    return starsHtml;
  }

  // Cache'i temizle
  clearCache() {
    this.ratingsCache.clear();
    this.loadingPromises.clear();
  }
}

// Global rating manager instance
console.log('🛠️ RatingManager initialization başlatılıyor...');

// Hemen initialize et
window.ratingManager = new RatingManager();
console.log('✅ RatingManager başarıyla initialize edildi:', !!window.ratingManager);
console.log('🔧 RatingManager methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.ratingManager)));

// Ek güvenlik için window.load event'te de kontrol et
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.ratingManager) {
      console.log('✅ RatingManager DOMContentLoaded ile initialize edildi');
    }
  });
} else {
  // Document zaten yüklüyse hemen kontrol et
  if (!window.ratingManager) {
    console.log('✅ RatingManager immediate olarak initialize edildi');
  }
}
