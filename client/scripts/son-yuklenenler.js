let currentPage = 1;
const itemsPerPage = 24;
let sonYuklenenlerManhwaList = [];

// URL'yi encode eden helper fonksiyon
function encodeChapterUrl(url) {
  if (!url || url === '#') return url;
  // URL'deki boşlukları ve özel karakterleri encode et
  return encodeURI(url);
}

// Bölüm butonlarını oluştur
function generateChapterButtons(item) {
  const chapterCount = item.chapterCount || 0;
  
  if (chapterCount === 0) {
    return '<button class="no-chapter">Henüz bölüm yok</button>';
  } else if (chapterCount === 1) {
    // 1 bölüm varsa o bölümün linkini kullan
    const chapterDetails = item.chapterDetails || [];
    const firstChapter = chapterDetails.find(ch => ch.number === 1);
    const chapterUrl = firstChapter ? encodeChapterUrl(firstChapter.url) : '#';
    return `<a href="${chapterUrl}"><button>Bölüm 1</button></a>`;
  } else {
    // 2 veya daha fazla bölüm varsa en büyük 2 bölümü göster
    const chapterDetails = item.chapterDetails || [];
    
    if (chapterDetails.length >= 2) {
      // Bölümleri büyükten küçüğe sırala
      const sortedChapters = [...chapterDetails].sort((a, b) => b.number - a.number);
      const chapter1 = sortedChapters[0]; // En büyük (son bölüm)
      const chapter2 = sortedChapters[1]; // İkinci büyük (son bir önceki)
      
      return `
        <a href="${encodeChapterUrl(chapter1.url)}"><button>Bölüm ${chapter1.number}</button></a>
        <a href="${encodeChapterUrl(chapter2.url)}"><button>Bölüm ${chapter2.number}</button></a>
      `;
    } else if (chapterDetails.length === 1) {
      // Sadece 1 bölüm detayı varsa
      const chapter = chapterDetails[0];
      return `<a href="${encodeChapterUrl(chapter.url)}"><button>Bölüm ${chapter.number}</button></a>`;
    } else {
      // Fallback: availableChapters'ı kullan
      const availableChapters = item.availableChapters || [];
      if (availableChapters.length >= 2) {
        // En büyük 2 bölümü al
        const sortedAvailable = [...availableChapters].sort((a, b) => b - a);
        return `
          <button>Bölüm ${sortedAvailable[0]}</button>
          <button>Bölüm ${sortedAvailable[1]}</button>
        `;
      } else if (availableChapters.length === 1) {
        return `<button>Bölüm ${availableChapters[0]}</button>`;
      } else {
        // Hiç bölüm yoksa
        return `<button disabled style="opacity: 0.5;">Henüz Bölüm Yok</button>`;
      }
    }
  }
}

// DOM yüklendiğinde veriyi çek - sadece ana sayfada çalışsın
document.addEventListener('DOMContentLoaded', function() {
  // Sadece son-yuklenenler container'ının olduğu sayfada çalışsın
  const container = document.getElementById('son-yuklenenler');
  if (!container) {
    console.log('🚫 SON YÜKLENELER - Container yok, script atlanıyor');
    return;
  }
  
  console.log('🚀 SON YÜKLENELER - DOM loaded, fetching manhwa data...');
  fetch('data/manhwalar.json')
    .then(response => response.json())
    .then(data => {
      console.log('📚 SON YÜKLENELER - Manhwa data loaded:', data.length, 'items');
      
      // Tarihe göre sırala (en yeni en üstte) - lastUpdated veya date alanını kullan
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.lastUpdated || a.date || '1900-01-01');
        const dateB = new Date(b.lastUpdated || b.date || '1900-01-01');
        return dateB - dateA; // En yeni en üstte
      });
      
      console.log('🔄 Seriler tarihe göre sıralandı (en yeni en üstte)');
      console.log('📅 İlk 3 serinin tarihleri:', sortedData.slice(0, 3).map(s => ({
        title: s.title,
        date: s.date,
        lastUpdated: s.lastUpdated
      })));
      
      // Tüm serileri göster (bölümü olsun veya olmasın)
      sonYuklenenlerManhwaList = sortedData;
      console.log('✅ Tüm seriler gösterilecek:', sonYuklenenlerManhwaList.length, 'seri');
      renderPage(currentPage);
      renderPaginationControls();
    })
    .catch(error => {
      console.error('❌ SON YÜKLENELER - Error loading manhwa data:', error);
    });
});

function renderPage(page) {
  console.log('🖼️ renderPage çağrıldı, sayfa:', page);
  const container = document.getElementById('son-yuklenenler');
  
  if (!container) {
    console.error('❌ KRITIK: son-yuklenenler container bulunamadı!');
    return;
  }
  
  console.log('✅ Container bulundu:', container);
  container.innerHTML = '';

  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedItems = sonYuklenenlerManhwaList.slice(start, end);
  console.log('📄 Sayfa items:', paginatedItems.length);

  let cardCreated = 0;
  paginatedItems.forEach((item, itemIndex) => {
    console.log(`🏗️ Kart ${itemIndex + 1}/${paginatedItems.length} oluşturuluyor:`, item.title, 'seriesId:', item.seriesId);
    const card = document.createElement('div');
    card.className = 'manhwa-card';
    
    // Etiket HTML'i oluştur
    let labelHtml = '';
    if (item.label && item.label.enabled) {
      labelHtml = `<span class="series-label" style="background-color: ${item.label.color}">${item.label.text}</span>`;
    }
    
    // Debug: linkleri kontrol et
    console.log(`🔗 DEBUG ${item.title}:`, {
      seriesLink: item.link,
      chapterCount: item.chapterCount,
      chapterDetails: item.chapterDetails
    });
    
    // Seri linkini de encode et (güvenlik için)
    const encodedSeriesLink = encodeURI(item.link);
    
    card.innerHTML = `
      <div class="image-wrapper">
        <a href="${encodedSeriesLink}">
          <img src="${item.image}" alt="Kapak">
          ${labelHtml}
        </a>
      </div>
      <div class="manhwa-info">
        <h3><a href="${encodedSeriesLink}" class="seri-link">${item.title}</a></h3>
        <p>${item.date}</p>
        <div class="rating-container son-yuklenenler-rating" data-series-id="${item.seriesId}">
          <div class="rating-loading">Puan yükleniyor...</div>
        </div>
        <div class="buttons">
          ${generateChapterButtons(item)}
        </div>
      </div>`;
    container.appendChild(card);
    cardCreated++;
    
    console.log(`✅ Kart ${cardCreated} DOM'a eklendi:`, item.title);
    
    // Hemen sonra container'ı kontrol et
    const addedContainer = document.querySelector(`[data-series-id="${item.seriesId}"]`);
    console.log(`🔍 Eklenen container kontrol ${item.seriesId}:`, addedContainer ? 'MEVCUT' : 'YOK');
  });

  console.log(`📊 TOPLAM ${cardCreated} kart DOM'a eklendi`);
  console.log('📊 Container içeriği uzunluğu:', container.innerHTML.length);
  console.log('📊 Container children sayısı:', container.children.length);

  // Grid'e eksik kart sınıfı ekleme
  updateGridLayoutClass(container, paginatedItems.length);
  
  console.log('⏱️ Rating yükleme işlemi başlatılıyor...');
  // Puanları asenkron olarak yükle - RatingManager'ın hazır olmasını bekle
  const attemptLoadRatings = (retryCount = 0) => {
    console.log(`⏱️ Deneme ${retryCount + 1} - RatingManager kontrol:`, !!window.ratingManager);
    
    if (window.ratingManager) {
      console.log('✅ RatingManager hazır, rating yükleme başlatılıyor');
      loadRatingsForCards(paginatedItems);
    } else if (retryCount < 10) {
      console.log(`⏱️ RatingManager henüz hazır değil, ${retryCount + 1}/10 deneme, tekrar deneniyor...`);
      setTimeout(() => attemptLoadRatings(retryCount + 1), 100);
    } else {
      console.error('❌ RatingManager 10 denemede hazır olmadı, rating yükleme iptal edildi');
      // Fallback: Loading mesajlarını temizle
      document.querySelectorAll('.rating-loading').forEach(el => {
        el.innerHTML = '<div class="rating-display no-rating">RatingManager yüklenemedi</div>';
      });
    }
  };

  // Hemen dene, gerekirse retry et
  attemptLoadRatings();
}

function renderPaginationControls() {
  const totalPages = Math.ceil(sonYuklenenlerManhwaList.length / itemsPerPage);
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  // Sadece 1. sayfa değilse "Önceki" butonunu göster
  if (currentPage > 1) {
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Önceki';
    prevBtn.classList.add('pagination-btn');
    prevBtn.addEventListener('click', () => {
      currentPage--;
      renderPage(currentPage);
      renderPaginationControls();
    });
    pagination.appendChild(prevBtn);
  }

  // Sadece son sayfa değilse "Sonraki" butonunu göster
  if (currentPage < totalPages) {
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Sonraki';
    nextBtn.classList.add('pagination-btn');
    nextBtn.addEventListener('click', () => {
      currentPage++;
      renderPage(currentPage);
      renderPaginationControls();
    });
    pagination.appendChild(nextBtn);
  }
}

// Grid'e eksik kart sınıfı ekleme fonksiyonu - 4'lü grid mantığı
function updateGridLayoutClass(container, itemCount) {
  // Önceki sınıfları temizle
  container.classList.remove('only-one', 'only-two', 'only-three', 'incomplete-row-1', 'incomplete-row-2', 'incomplete-row-3');
  
  console.log(`🔄 Grid layout güncellemesi - item sayısı: ${itemCount}`);
  
  // Eğer kart sayısı 1, 2 veya 3 ise özel sınıflar ekle (4'lü grid mantığına göre)
  if (itemCount === 1) {
    container.classList.add('only-one');
    console.log('✅ only-one sınıfı eklendi');
  } else if (itemCount === 2) {
    container.classList.add('only-two');
    console.log('✅ only-two sınıfı eklendi');
  } else if (itemCount === 3) {
    container.classList.add('only-three');
    console.log('✅ only-three sınıfı eklendi');
  } else {
    // 4 veya daha fazla kart için son satırdaki eksik kartları işaretle
    const remainingCards = itemCount % 4;
    if (remainingCards > 0 && remainingCards < 4) {
      container.classList.add(`incomplete-row-${remainingCards}`);
      console.log(`✅ incomplete-row-${remainingCards} sınıfı eklendi`);
    }
  }
}

// Puanları asenkron olarak yükle
async function loadRatingsForCards(items) {
  console.log('🔍 SON YÜKLENELER loadRatingsForCards - BAŞLADI');
  console.log('📊 Items sayısı:', items.length);
  console.log('🎯 RatingManager mevcut:', !!window.ratingManager);
  
  if (!window.ratingManager) {
    console.error('❌ SON YÜKLENELER RatingManager bulunamadı! Function çağrılmamalıydı.');
    return;
  }

  const seriesIds = items.map(item => item.seriesId).filter(Boolean);
  console.log('🔑 SON YÜKLENELER SeriesIds:', seriesIds);
  
  if (seriesIds.length === 0) {
    console.log('⚠️ SON YÜKLENELER Hiç seriesId bulunamadı');
    return;
  }

  // Container'ları manuel olarak kontrol et - sadece son-yuklenenler container'ında ara
  console.log('🔍 SON YÜKLENELER Container kontrolü...');
  const allContainersCheck = document.querySelectorAll('[data-series-id]');
  console.log('🌍 SON YÜKLENELER TÜM SAYFA containerları:', allContainersCheck.length);
  
  items.forEach(item => {
    if (item.seriesId) {
      const container = document.querySelector(`#son-yuklenenler [data-series-id="${item.seriesId}"]`);
      console.log(`📦 SON YÜKLENELER ${item.seriesId} container:`, container ? 'BULUNDU' : 'BULUNAMADI');
      if (container) {
        console.log(`📦 SON YÜKLENELER ${item.seriesId} container içeriği:`, container.innerHTML);
        console.log(`📦 SON YÜKLENELER ${item.seriesId} container parent:`, container.parentElement?.className || 'NO PARENT');
      }
    }
  });

  try {
    console.log('🌐 SON YÜKLENELER API çağrısı başlatılıyor...');
    const ratings = await window.ratingManager.getMultipleAverageRatings(seriesIds);
    console.log('✅ SON YÜKLENELER Ratings alındı:', ratings);
    
    items.forEach((item, index) => {
      if (!item.seriesId) {
        console.log(`⚠️ SON YÜKLENELER SeriesId yok, item atlaniyor:`, item.title);
        return;
      }
      
      const container = document.querySelector(`#son-yuklenenler [data-series-id="${item.seriesId}"]`);
      if (!container) {
        console.error(`❌ SON YÜKLENELER Container bulunamadı: ${item.seriesId}`);
        return;
      }
      
      const rating = ratings[index];
      const displayHtml = window.ratingManager.createRatingDisplay(rating);
      console.log(`✏️ SON YÜKLENELER ${item.seriesId} için HTML set ediliyor:`, displayHtml.substring(0, 50) + '...');
      console.log(`📍 SON YÜKLENELER Container before update:`, container.innerHTML);
      container.innerHTML = displayHtml;
      console.log(`📍 SON YÜKLENELER Container after update:`, container.innerHTML);
    });
    
    console.log('🎉 SON YÜKLENELER loadRatingsForCards - TAMAMLANDI');
  } catch (error) {
    console.error('💥 SON YÜKLENELER HATA:', error);
    // Hata durumunda loading mesajlarını temizle
    document.querySelectorAll('#son-yuklenenler .rating-loading').forEach(el => {
      el.innerHTML = '<div class="rating-display no-rating">Hata: ' + error.message + '</div>';
    });
  }
}
