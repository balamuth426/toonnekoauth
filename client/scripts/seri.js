const input = document.getElementById("searchInput");
const chapters = document.querySelectorAll(".chapter-card");

input.addEventListener("input", function () {
  const searchText = this.value.toLowerCase();
  chapters.forEach(card => {
    const title = card.querySelector(".chapter-title").textContent.toLowerCase();
    card.style.display = title.includes(searchText) ? "block" : "none";
  });
});

// --- PUANLAMA SİSTEMİ ---
// Seri ID'yi belirle (sayfa başlığından veya dosya yolundan)
let seriesId = null;
const titleElem = document.querySelector('.title') || document.querySelector('title');
console.log('Title element:', titleElem);
if (titleElem) {
  // Ana sayfa için data/manhwalar.json, series sayfaları için ../../data/manhwalar.json
  const dataPath = window.location.pathname.includes('/series/') ? '../../data/manhwalar.json' : 'data/manhwalar.json';
  fetch(dataPath)
    .then(r => r.json())
    .then(list => {
      // title tag ise, başlığı al
      const pageTitle = titleElem.textContent.trim() || document.title.trim();
      console.log('Page title:', pageTitle);
      const found = list.find(s => s.title === pageTitle);
      console.log('Found series:', found);
      if (found) {
        seriesId = found.seriesId;
        // Kapak görselini güncelle
        const coverImg = document.getElementById('cover-image');
        if (coverImg && found.image) {
          coverImg.src = found.image;
        }
        loadAverageRating();
        renderUserRatingArea();
      }
    })
    .catch(err => console.error('JSON yükleme hatası:', err));
}

function loadAverageRating() {
  if (!seriesId) return;
  console.log('Loading rating for series:', seriesId);
  fetch(`http://localhost:5506/api/ratings/${seriesId}/average`)
    .then(r => r.json())
    .then(data => {
      console.log('Rating data received:', data);
      const avg = data.average ? data.average.toFixed(2) : '-';
      document.getElementById('average-rating').textContent = avg;
      document.getElementById('rating-count').textContent = data.count ? `(${data.count} oy)` : '';
      
      // Kullanıcı puan verme yıldızlarında ortalama puanı göster
      displayAverageInUserStars(data.average || 0);
    })
    .catch(err => {
      console.error('Puan yükleme hatası:', err);
      document.getElementById('average-rating').textContent = 'Hata';
    });
}

function getUserToken() {
  const token = localStorage.getItem('token');
  console.log('getUserToken called, token:', token ? token.substring(0, 20) + '...' : 'null');
  return token;
}

function renderUserRatingArea() {
  const area = document.getElementById('user-rating-area');
  area.innerHTML = '';
  const token = getUserToken();
  if (!token) {
    area.innerHTML = '<span style="color:#888;font-size:0.95em;">Puan vermek için giriş yap</span>';
    return;
  }
  
  console.log('Rendering user rating area with token');
  
  // 5 yıldız arayüzü oluştur - basit yapı
  for (let i = 1; i <= 5; i++) {
    const starContainer = document.createElement('span');
    starContainer.style.position = 'relative';
    starContainer.style.display = 'inline-block';
    starContainer.style.cursor = 'pointer';
    starContainer.style.fontSize = '1.3em';
    starContainer.style.marginRight = '3px';
    starContainer.dataset.value = i;
    starContainer.title = `${i} yıldız ver`;
    starContainer.className = 'user-rating-star';
    
    // Tek yıldız elementi
    const star = document.createElement('span');
    star.textContent = '★';
    star.style.color = '#ddd'; // Default gri
    star.style.transition = 'color 0.2s ease';
    star.className = 'star-element';
    
    starContainer.appendChild(star);
    
    // Event listener'ları starContainer'a ekle
    starContainer.addEventListener('mouseenter', function() {
      console.log('Mouse enter on star:', i);
      highlightUserStars(i);
    });
    
    starContainer.addEventListener('mouseleave', function() {
      console.log('Mouse leave on star:', i);
      showCurrentUserRating();
    });
    
    starContainer.addEventListener('click', function(e) {
      console.log('Click on star:', i);
      e.preventDefault();
      e.stopPropagation();
      
      const token = getUserToken();
      if (!token || !seriesId) {
        console.log('Cannot rate: token=', !!token, 'seriesId=', seriesId);
        return;
      }
      
      console.log('Submitting rating:', i, 'for series:', seriesId);
      
      fetch('http://localhost:5506/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ seriesId, score: i })
      })
        .then(r => {
          console.log('Response status:', r.status);
          return r.json();
        })
        .then((data) => {
          console.log('Rating submitted successfully:', data);
          
          // Kullanıcı puanını hemen güncelle
          updateUserRating(i);
          
          // Ortalama puanı güncelle
          setTimeout(() => {
            loadAverageRating();
          }, 100);
        })
        .catch(err => {
          console.error('Puan gönderme hatası:', err);
          alert('Puan kaydedilemedi!');
        });
    });
    
    area.appendChild(starContainer);
  }
  
  // Kullanıcının mevcut puanını getir ve göster
  showCurrentUserRating();
}

function highlightUserStars(upTo) {
  console.log('Highlighting stars up to:', upTo);
  const stars = document.querySelectorAll('.user-rating-star .star-element');
  stars.forEach((star, idx) => {
    const shouldHighlight = (idx + 1) <= upTo;
    star.style.color = shouldHighlight ? '#ff6f61' : '#ddd';
  });
}

function showCurrentUserRating() {
  const token = getUserToken();
  if (!token || !seriesId) return;
  
  fetch('http://localhost:5506/api/profile', { 
    headers: { 'Authorization': 'Bearer ' + token } 
  })
    .then(r => r.json())
    .then(user => {
      const rating = (user.ratings || []).find(r => r.seriesId === seriesId);
      const userRating = rating ? rating.score : 0;
      console.log('Showing current user rating:', userRating);
      
      const stars = document.querySelectorAll('.user-rating-star .star-element');
      stars.forEach((star, idx) => {
        const shouldShow = (idx + 1) <= userRating;
        star.style.color = shouldShow ? '#32cd32' : '#ddd';
      });
    })
    .catch(err => console.error('Profil yükleme hatası:', err));
}

function updateUserRating(rating) {
  console.log('Updating user rating to:', rating);
  const stars = document.querySelectorAll('.user-rating-star .star-element');
  stars.forEach((star, idx) => {
    const shouldShow = (idx + 1) <= rating;
    star.style.color = shouldShow ? '#32cd32' : '#ddd';
  });
}





// Ortalama puanı yıldızlarda görsel olarak göster
function displayAverageStars(average) {
  // Ortalama yıldızlar için ayrı bir container oluştur
  let avgContainer = document.getElementById('average-stars-container');
  if (!avgContainer) {
    avgContainer = document.createElement('div');
    avgContainer.id = 'average-stars-container';
    avgContainer.style.marginRight = '10px';
    avgContainer.style.display = 'inline-block';
    
    // Rating değerinin yanına ekle
    const ratingValue = document.getElementById('average-rating');
    ratingValue.parentNode.insertBefore(avgContainer, ratingValue);
  }
  
  avgContainer.innerHTML = '';
  
  // 5 yıldız oluştur
  for (let i = 1; i <= 5; i++) {
    const starContainer = document.createElement('span');
    starContainer.style.position = 'relative';
    starContainer.style.display = 'inline-block';
    starContainer.style.fontSize = '1.2em';
    starContainer.style.marginRight = '2px';
    
    // Boş yıldız (gri)
    const emptyStar = document.createElement('span');
    emptyStar.textContent = '★';
    emptyStar.style.color = '#ddd';
    emptyStar.style.position = 'absolute';
    emptyStar.style.top = '0';
    emptyStar.style.left = '0';
    
    // Dolu yıldız (sarı)
    const fullStar = document.createElement('span');
    fullStar.textContent = '★';
    fullStar.style.color = '#ffb400';
    fullStar.style.position = 'absolute';
    fullStar.style.top = '0';
    fullStar.style.left = '0';
    fullStar.style.overflow = 'hidden';
    
    // Ortalama puana göre yıldızın ne kadarının boyalı olacağını hesapla
    let fillPercentage = 0;
    if (average >= i) {
      fillPercentage = 100; // Tamamen dolu
    } else if (average >= i - 1) {
      fillPercentage = (average - (i - 1)) * 100; // Kısmen dolu
    }
    
    fullStar.style.width = fillPercentage + '%';
    
    starContainer.appendChild(emptyStar);
    starContainer.appendChild(fullStar);
    avgContainer.appendChild(starContainer);
  }
}

// Kullanıcı puan verme yıldızlarında ortalama puanı göster
function displayAverageInUserStars(average) {
  // Eğer average verilmediyse, backend'den al
  if (average === undefined) {
    fetch(`http://localhost:5506/api/ratings/${seriesId}/average`)
      .then(r => r.json())
      .then(data => {
        displayAverageInUserStars(data.average || 0);
      })
      .catch(err => console.error('Ortalama puan alınamadı:', err));
    return;
  }
  
  const starContainers = document.querySelectorAll('#user-rating-area > span');
  starContainers.forEach((container, idx) => {
    const avgStar = container.querySelector('.average-star');
    if (avgStar) {
      let fillPercentage = 0;
      const starNumber = idx + 1;
      if (average >= starNumber) {
        fillPercentage = 100; // Tamamen dolu
      } else if (average >= starNumber - 1) {
        fillPercentage = (average - (starNumber - 1)) * 100; // Kısmen dolu
      }
      avgStar.style.width = fillPercentage + '%';
    }
  });
}

// Auth durumu değişikliklerini dinle
function initAuthListener() {
  // Login/logout durumunu dinlemek için storage event'ini kullan
  window.addEventListener('storage', function(e) {
    if (e.key === 'token') {
      // Token değişti, rating area'yı yeniden render et
      if (seriesId) {
        renderUserRatingArea();
      }
    }
  });
  
  // Sayfa içi giriş/çıkış işlemleri için custom event listener
  window.addEventListener('authStateChanged', function() {
    if (seriesId) {
      renderUserRatingArea();
    }
  });
}

// Sayfa yüklendiğinde auth listener'ı başlat
document.addEventListener('DOMContentLoaded', function() {
  initAuthListener();
});








