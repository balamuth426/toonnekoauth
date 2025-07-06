// tum-seriler.js
// Tüm seriler, sıralama ve kategori filtreleme scripti

let allSeries = [];
let filteredSeries = [];
let genresCount = {};
let statusCount = {};
let currentPage = 1;
const itemsPerPage = 24;

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
      // Fallback: availableChapters'ı kullan ama URL'siz
      const availableChapters = item.availableChapters || [];
      if (availableChapters.length >= 2) {
        // En büyük 2 bölümü al
        const sortedAvailable = [...availableChapters].sort((a, b) => b - a);
        return `
          <button>Bölüm ${sortedAvailable[0]}</button>
          <button>Bölüm ${sortedAvailable[1]}</button>
        `;
      } else {
        return `<button>Bölüm ${chapterCount}</button>`;
      }
    }
  }
}

// DOM yüklendiğinde serileri yükle
document.addEventListener('DOMContentLoaded', function() {
  console.log('📚 TÜM SERİLER - DOM loaded, checking containers...');
  
  // Sadece tum-seriler-list container'ının olduğu sayfada çalışsın
  const tumSerilerContainer = document.getElementById('tum-seriler-list');
  const genresListContainer = document.getElementById('genres-list');
  
  console.log('📚 TÜM SERİLER - Containers:', {
    tumSerilerContainer: !!tumSerilerContainer,
    genresListContainer: !!genresListContainer
  });
  
  if (!tumSerilerContainer) {
    console.log('🚫 TÜM SERİLER - Container yok, script atlanıyor');
    return;
  }
  
  console.log('📚 TÜM SERİLER - Initializing tum-seriler...');
  
  // Serileri ve kategorileri yükle
  fetch('data/manhwalar.json')
    .then(res => {
      console.log('📚 TÜM SERİLER - Fetch response status:', res.status);
      return res.json();
    })
    .then(data => {
      console.log('📚 TÜM SERİLER - Data loaded:', data.length, 'items');
      allSeries = data;
      filteredSeries = [...allSeries];
      
      console.log('📚 TÜM SERİLER - Starting countGenres...');
      countGenres();
      
      console.log('📚 TÜM SERİLER - Starting renderGenres...');
      renderGenres();
      
      console.log('📚 TÜM SERİLER - Starting renderSeries...');
      renderSeries();
      
      const seriCountElement = document.getElementById('seri-count');
      if (seriCountElement) {
        seriCountElement.innerText = `Toplam Seri: ${allSeries.length}`;
        console.log('📚 TÜM SERİLER - Updated seri count:', allSeries.length);
      } else {
        console.error('📚 TÜM SERİLER - seri-count element not found!');
      }
      
      console.log('📚 TÜM SERİLER - Initialization completed!');
    })
    .catch(error => {
      console.error('📚 TÜM SERİLER - Error loading data:', error);
    });
});

// Kategorileri ve durumları say
function countGenres() {
  genresCount = {};
  statusCount = {};
  
  allSeries.forEach(seri => {
    // Genre sayımı
    if (seri.genres) {
      seri.genres.forEach(g => {
        genresCount[g] = (genresCount[g] || 0) + 1;
      });
    }
    
    // Status sayımı
    if (seri.status) {
      statusCount[seri.status] = (statusCount[seri.status] || 0) + 1;
    }
  });
}

// Kategorileri göster
function renderGenres() {
  console.log('📚 TÜM SERİLER - renderGenres called, genresCount:', genresCount, 'statusCount:', statusCount);
  
  const genresList = document.getElementById('genres-list');
  if (!genresList) {
    console.error('📚 TÜM SERİLER - genres-list element not found!');
    return;
  }
  
  genresList.innerHTML = '';
  
  // Tümü butonu
  const allBtn = document.createElement('button');
  allBtn.innerText = 'Tümü';
  allBtn.className = 'filter-btn all-btn active';
  allBtn.onclick = () => {
    filteredSeries = [...allSeries];
    currentPage = 1;
    updateActiveFilterButton(allBtn);
    renderSeries();
  };
  genresList.appendChild(allBtn);
  
  // Status kategorileri (Durum)
  const statusOrder = ['Devam Ediyor', 'Tamamlandı', 'Hiatus', 'Durduruldu'];
  statusOrder.forEach(status => {
    if (statusCount[status]) {
      const btn = document.createElement('button');
      btn.innerText = `${status} (${statusCount[status]})`;
      btn.className = 'filter-btn status-btn';
      btn.onclick = () => filterByStatus(status, btn);
      genresList.appendChild(btn);
    }
  });
  
  // Ayırıcı çizgi
  const separator = document.createElement('div');
  separator.className = 'genre-separator';
  separator.innerHTML = '<span>Türler</span>';
  genresList.appendChild(separator);
  
  // Genre kategorileri
  const genreEntries = Object.entries(genresCount).sort();
  console.log('📚 TÜM SERİLER - Creating genre buttons:', genreEntries.length, 'genres');
  
  genreEntries.forEach(([genre, count]) => {
    const btn = document.createElement('button');
    btn.innerText = `${genre} (${count})`;
    btn.className = 'filter-btn genre-btn';
    btn.onclick = () => filterByGenre(genre, btn);
    genresList.appendChild(btn);
  });
  
  console.log('📚 TÜM SERİLER - Genre buttons created successfully');
}

// Kategoriye göre filtrele
function filterByGenre(genre, buttonElement) {
  filteredSeries = allSeries.filter(seri => seri.genres && seri.genres.includes(genre));
  currentPage = 1;
  updateActiveFilterButton(buttonElement);
  renderSeries();
}

// Duruma göre filtrele  
function filterByStatus(status, buttonElement) {
  filteredSeries = allSeries.filter(seri => seri.status === status);
  currentPage = 1;
  updateActiveFilterButton(buttonElement);
  renderSeries();
}

// Aktif filter butonunu güncelle
function updateActiveFilterButton(activeButton) {
  // Tüm filter butonlarından active sınıfını kaldır
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Aktif butona sınıf ekle
  if (activeButton) {
    activeButton.classList.add('active');
  }
}

// Sıralama
async function sortSeries(type) {
  console.log('📚 TÜM SERİLER - Sorting by:', type);
  
  // Loading durumunu göster (sadece highest-rated için)
  if (type === 'highest-rated') {
    const ratingButton = document.querySelector('.sort-buttons button:nth-child(4)');
    if (ratingButton) {
      const buttonText = ratingButton.querySelector('.button-text');
      const buttonLoading = ratingButton.querySelector('.button-loading');
      if (buttonText && buttonLoading) {
        buttonText.style.display = 'none';
        buttonLoading.style.display = 'inline';
      }
      ratingButton.disabled = true;
    }
  }
  
  if (type === 'alphabetical') {
    filteredSeries.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
  } else if (type === 'reverse') {
    filteredSeries.sort((a, b) => b.title.localeCompare(a.title, 'tr'));
  } else if (type === 'popular') {
    console.log('📚 TÜM SERİLER - Popular sorting başlatılıyor...');
    
    // Reading progress tracker'dan okuma verilerini al
    let readingData = {};
    if (window.readingProgressTracker) {
      readingData = window.readingProgressTracker.getAllSeriesProgress();
      console.log('📚 Okuma verileri alındı:', readingData);
    } else {
      console.warn('📚 ReadingProgressTracker bulunamadı, chapter count\'a göre sıralanacak');
    }
    
    // Her seri için okuma sayısını hesapla
    filteredSeries.forEach(series => {
      const seriesKey = series.seriesId || series.title.toLowerCase().replace(/\s+/g, '');
      const readChapters = readingData[seriesKey] || [];
      series.readCount = readChapters.length;
      
      // Debug için
      if (readChapters.length > 0) {
        console.log(`📚 ${series.title}: ${readChapters.length} bölüm okunmuş`);
      }
    });
    
    // Okuma sayısına göre sırala (çok okunan üstte)
    filteredSeries.sort((a, b) => {
      // Önce okuma sayısına göre sırala
      if (b.readCount !== a.readCount) {
        return b.readCount - a.readCount;
      }
      
      // Eğer okuma sayıları eşitse, bölüm sayısına göre sırala
      const aChapters = a.chapterCount || 0;
      const bChapters = b.chapterCount || 0;
      if (bChapters !== aChapters) {
        return bChapters - aChapters;
      }
      
      // Son olarak alfabetik sıralama
      return a.title.localeCompare(b.title, 'tr');
    });
    
    console.log('📚 TÜM SERİLER - Popular sorting tamamlandı');
  } else if (type === 'status-completed-first') {
    // Önce tamamlanmış, sonra devam eden, sonra diğerleri
    const statusOrder = { 'Tamamlandı': 1, 'Devam Ediyor': 2, 'Hiatus': 3, 'Durduruldu': 4 };
    filteredSeries.sort((a, b) => {
      const aOrder = statusOrder[a.status] || 5;
      const bOrder = statusOrder[b.status] || 5;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      return a.title.localeCompare(b.title, 'tr');
    });
  } else if (type === 'status-ongoing-first') {
    // Önce devam eden, sonra tamamlanmış, sonra diğerleri
    const statusOrder = { 'Devam Ediyor': 1, 'Tamamlandı': 2, 'Hiatus': 3, 'Durduruldu': 4 };
    filteredSeries.sort((a, b) => {
      const aOrder = statusOrder[a.status] || 5;
      const bOrder = statusOrder[b.status] || 5;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      return a.title.localeCompare(b.title, 'tr');
    });
  } else if (type === 'highest-rated') {
    console.log('📚 TÜM SERİLER - Highest rated sorting başlatılıyor...');
    
    try {
      // Tüm serilerin rating'lerini al
      const seriesWithRatings = [];
      
      for (const series of filteredSeries) {
        let rating = null;
        try {
          if (series.seriesId) {
            rating = await window.ratingManager.getAverageRating(series.seriesId);
          }
        } catch (error) {
          console.error('Rating alınırken hata:', series.seriesId, error);
        }
        
        seriesWithRatings.push({
          ...series,
          ratingData: rating
        });
      }
      
      // Rating'e göre sırala (yüksekten düşüğe)
      // Önce puanı olanlar, sonra puanı olmayanlar
      seriesWithRatings.sort((a, b) => {
        const aRating = a.ratingData?.average || 0;
        const bRating = b.ratingData?.average || 0;
        const aCount = a.ratingData?.count || 0;
        const bCount = b.ratingData?.count || 0;
        
        // Önce puanı olanları üste al
        if (aCount > 0 && bCount === 0) return -1;
        if (aCount === 0 && bCount > 0) return 1;
        
        // İkisi de puanlanmışsa, ortalamaya göre sırala
        if (aCount > 0 && bCount > 0) {
          if (aRating !== bRating) {
            return bRating - aRating; // Yüksekten düşüğe
          }
          // Aynı puana sahipse, daha çok puanlanmış olanı üste al
          return bCount - aCount;
        }
        
        // İkisi de puanlanmamışsa, alfabetik sırala
        return a.title.localeCompare(b.title, 'tr');
      });
      
      // Sıralanan veriyi geri ata
      filteredSeries = seriesWithRatings.map(item => {
        const { ratingData, ...series } = item;
        return series;
      });
      
      console.log('📚 TÜM SERİLER - Highest rated sorting tamamlandı');
    } catch (error) {
      console.error('📚 TÜM SERİLER - Highest rated sorting hatası:', error);
    } finally {
      // Loading durumunu gizle
      const ratingButton = document.querySelector('.sort-buttons button:nth-child(4)');
      if (ratingButton) {
        const buttonText = ratingButton.querySelector('.button-text');
        const buttonLoading = ratingButton.querySelector('.button-loading');
        if (buttonText && buttonLoading) {
          buttonText.style.display = 'inline';
          buttonLoading.style.display = 'none';
        }
        ratingButton.disabled = false;
      }
    }
  }
  
  // Aktif buton stilini güncelle
  updateSortButtonStyles(type);
  
  currentPage = 1;
  renderSeries();
}

// Aktif sıralama butonunu güncelle
function updateSortButtonStyles(activeType) {
  const buttons = document.querySelectorAll('.sort-buttons button');
  buttons.forEach(button => {
    button.classList.remove('active');
  });
  
  // Aktif butonu işaretle
  let buttonIndex = 0;
  switch(activeType) {
    case 'alphabetical': buttonIndex = 0; break;
    case 'reverse': buttonIndex = 1; break;
    case 'popular': buttonIndex = 2; break;
    case 'highest-rated': buttonIndex = 3; break;
    case 'status-completed-first': buttonIndex = 4; break;
    case 'status-ongoing-first': buttonIndex = 5; break;
  }
  
  if (buttons[buttonIndex]) {
    buttons[buttonIndex].classList.add('active');
  }
}

// Serileri göster
function renderSeries() {
  console.log('📚 TÜM SERİLER - renderSeries called, filteredSeries.length:', filteredSeries.length);
  
  const grid = document.getElementById('tum-seriler-list');
  if (!grid) {
    console.error('📚 TÜM SERİLER - tum-seriler-list element not found!');
    return;
  }
  
  grid.innerHTML = '';
  
  // Eski sınıfları temizle
  grid.classList.remove('only-one', 'only-two');
  
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedItems = filteredSeries.slice(start, end);
  
  console.log('📚 TÜM SERİLER - Rendering page', currentPage, 'items:', paginatedItems.length);
  
  paginatedItems.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'manhwa-card';
    
    // Etiket HTML'i oluştur
    let labelHtml = '';
    if (item.label && item.label.enabled) {
      labelHtml = `<span class="series-label" style="background-color: ${item.label.color}">${item.label.text}</span>`;
    }
    
    // Seri linkini encode et
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
        <div class="rating-container tum-seriler-rating" data-series-id="${item.seriesId}">
          <div class="rating-loading">Puan yükleniyor...</div>
        </div>
        <div class="buttons">
          ${generateChapterButtons(item)}
        </div>
      </div>`;
    grid.appendChild(card);
  });
  
  console.log('📚 TÜM SERİLER - Cards added to grid:', grid.children.length);
  
  // Puanları asenkron olarak yükle
  setTimeout(() => {
    loadRatingsForPage(paginatedItems);
  }, 100); // DOM'un tamamen render olması için kısa bir delay
  
  // Grid düzeni CSS Grid ile otomatik hallediliyor
  renderPaginationControls();
  
  console.log('📚 TÜM SERİLER - renderSeries completed');
}

// Puanları asenkron olarak yükle
async function loadRatingsForPage(items) {
  const seriesIds = items.map(item => item.seriesId).filter(Boolean);
  
  if (seriesIds.length === 0) return;
  
  try {
    const ratings = await window.ratingManager.getMultipleAverageRatings(seriesIds);
    
    items.forEach((item, index) => {
      if (!item.seriesId) return;
      
      const container = document.querySelector(`#tum-seriler-list [data-series-id="${item.seriesId}"]`);
      if (!container) return;
      
      const rating = ratings[index];
      container.innerHTML = window.ratingManager.createRatingDisplay(rating);
    });
  } catch (error) {
    console.error('Puanlar yüklenirken hata:', error);
    // Hata durumunda loading mesajlarını temizle
    document.querySelectorAll('.rating-loading').forEach(el => {
      el.innerHTML = '<div class="rating-display no-rating">Puan yüklenemedi</div>';
    });
  }
}

// Bu fonksiyon artık kullanılmıyor - CSS Grid otomatik düzeni hallediyor
// function updateGridLayoutClass() - KALDIRILDI

// Pagination kontrol butonlarını göster
function renderPaginationControls() {
  const totalPages = Math.ceil(filteredSeries.length / itemsPerPage);
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';
  if (currentPage > 1) {
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Önceki';
    prevBtn.classList.add('pagination-btn');
    prevBtn.addEventListener('click', () => {
      currentPage--;
      renderSeries();
    });
    pagination.appendChild(prevBtn);
  }
  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = i;
    pageBtn.classList.add('pagination-btn');
    if (i === currentPage) pageBtn.classList.add('active');
    pageBtn.addEventListener('click', () => {
      currentPage = i;
      renderSeries();
    });
    pagination.appendChild(pageBtn);
  }
  if (currentPage < totalPages) {
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Sonraki';
    nextBtn.classList.add('pagination-btn');
    nextBtn.addEventListener('click', () => {
      currentPage++;
      renderSeries();
    });
    pagination.appendChild(nextBtn);
  }
}
