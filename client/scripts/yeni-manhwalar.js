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
      } else if (availableChapters.length === 1) {
        return `<button>Bölüm ${availableChapters[0]}</button>`;
      } else {
        // Hiç bölüm yoksa
        return `<button disabled style="opacity: 0.5;">Henüz Bölüm Yok</button>`;
      }
    }
  }
}

// DOM yüklendiğinde carousel'i başlat - sadece carousel container'ının olduğu sayfada
document.addEventListener('DOMContentLoaded', function() {
  // Sadece yeni-seriler carousel container'ının olduğu sayfada çalışsın
  const carouselContainer = document.getElementById('yeni-seriler');
  if (!carouselContainer) {
    console.log('🚫 YENİ MANHWALAR - Carousel container yok, script atlanıyor');
    return;
  }
  
  console.log('🎠 YENİ MANHWALAR - DOM loaded, initializing carousel...');
  
  fetch('data/manhwalar.json')
    .then(response => response.json())
    .then(allData => {
      // Tüm serileri göster (bölümü olsun veya olmasın)
      console.log('🎠 YENİ MANHWALAR - Tüm seriler dahil edilecek');
      
      // En son eklenen serileri al (tarih bazında)
      const sortedByDate = [...allData].sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // İlk 8 seriyi al (carousel için optimize sayı)
      const data = sortedByDate.slice(0, 8);
      
      console.log('🎠 YENİ MANHWALAR - En son', data.length, 'seri yüklendi:', data.map(s => s.title));
      const container = document.getElementById('yeni-seriler'); // carousel-3d div'i
    let currentIndex = 0;
    let intervalId;
    let isAnimating = false;

    function createCard(item, extraClass = '') {
      const card = document.createElement('div');
      card.className = 'manhwa-card carousel-3d-inner';
      
      // Seri linkini encode et
      const encodedSeriesLink = encodeURI(item.link);
      
      card.innerHTML = `
        <img src="${item.image}" alt="Kapak">
        <div class="manhwa-info">
          <h3><a href="${encodedSeriesLink}" class="seri-link">${item.title}</a></h3>
          <p>${item.date}</p>
          <div class="rating-container yeni-manhwalar-rating" data-series-id="${item.seriesId}">
            <div class="rating-loading">Puan yükleniyor...</div>
          </div>
          <div class="buttons">
            ${generateChapterButtons(item)}
          </div>
        </div>
      `;
      if (extraClass) card.classList.add(extraClass);
      
      // Kartı döndürdükten sonra rating'i yükle
      if (item.seriesId && window.ratingManager) {
        window.ratingManager.getAverageRating(item.seriesId).then(rating => {
          const container = card.querySelector(`[data-series-id="${item.seriesId}"]`);
          if (container) {
            container.innerHTML = window.ratingManager.createRatingDisplay(rating);
          }
        }).catch(err => {
          console.error('Rating yükleme hatası:', err);
          const container = card.querySelector(`[data-series-id="${item.seriesId}"]`);
          if (container) {
            container.innerHTML = '<div class="rating-display no-rating">Puan yüklenemedi</div>';
          }
        });
      }
      
      return card;
    }

    function render3DCarousel() {
      container.innerHTML = '';
      const len = data.length;
      const prev2Index = (currentIndex - 2 + len) % len;
      const prevIndex = (currentIndex - 1 + len) % len;
      const nextIndex = (currentIndex + 1) % len;
      const next2Index = (currentIndex + 2) % len;

      // Far prev
      const farPrevDiv = document.createElement('div');
      farPrevDiv.className = 'carousel-3d-card far-prev';
      farPrevDiv.appendChild(createCard(data[prev2Index], 'far-prev'));
      // Prev
      const prevDiv = document.createElement('div');
      prevDiv.className = 'carousel-3d-card prev';
      prevDiv.appendChild(createCard(data[prevIndex], 'prev'));
      // Current
      const currentDiv = document.createElement('div');
      currentDiv.className = 'carousel-3d-card current';
      currentDiv.appendChild(createCard(data[currentIndex], 'current'));
      // Next
      const nextDiv = document.createElement('div');
      nextDiv.className = 'carousel-3d-card next';
      nextDiv.appendChild(createCard(data[nextIndex], 'next'));
      // Far next
      const farNextDiv = document.createElement('div');
      farNextDiv.className = 'carousel-3d-card far-next';
      farNextDiv.appendChild(createCard(data[next2Index], 'far-next'));

      container.appendChild(farPrevDiv);
      container.appendChild(prevDiv);
      container.appendChild(currentDiv);
      container.appendChild(nextDiv);
      container.appendChild(farNextDiv);

      // Fade-in animasyonu için kısa gecikmeyle visible sınıfı ekle
      setTimeout(() => {
        prevDiv.classList.add('visible');
        nextDiv.classList.add('visible');
        farPrevDiv.classList.add('visible');
        farNextDiv.classList.add('visible');
      }, 30);

      // Yan kartlara tıklanırsa merkeze kayma
      prevDiv.onclick = () => { if (!isAnimating) animate3DSlide('right'); };
      nextDiv.onclick = () => { if (!isAnimating) animate3DSlide('left'); };
    }

    function animate3DSlide(direction) {
      if (isAnimating) return;
      isAnimating = true;
      const cards = container.querySelectorAll('.carousel-3d-card');
      if (cards.length < 5) { isAnimating = false; return; } // Hata önleme
      if (direction === 'left') {
        if(cards[0]) cards[0].classList.add('hide'); // far-prev
        if(cards[1]) { cards[1].classList.add('far-prev'); cards[1].classList.remove('prev'); }
        if(cards[2]) { cards[2].classList.add('prev'); cards[2].classList.remove('current'); }
        if(cards[3]) { cards[3].classList.add('current'); cards[3].classList.remove('next'); }
        if(cards[4]) { cards[4].classList.add('next'); cards[4].classList.remove('far-next'); }
      } else {
        if(cards[4]) cards[4].classList.add('hide'); // far-next
        if(cards[3]) { cards[3].classList.add('far-next'); cards[3].classList.remove('next'); }
        if(cards[2]) { cards[2].classList.add('next'); cards[2].classList.remove('current'); }
        if(cards[1]) { cards[1].classList.add('current'); cards[1].classList.remove('prev'); }
        if(cards[0]) { cards[0].classList.add('prev'); cards[0].classList.remove('far-prev'); }
      }
      setTimeout(() => {
        currentIndex = direction === 'left'
          ? (currentIndex + 1) % data.length
          : (currentIndex - 1 + data.length) % data.length;
        render3DCarousel();
        isAnimating = false;
      }, 900);
    }

    function isMobile() {
      return window.innerWidth <= 700;
    }

    function renderMobileCarousel() {
      container.innerHTML = '';
      const item = data[currentIndex];
      const animDiv = document.createElement('div');
      animDiv.className = 'carousel-card-anim current';
      animDiv.appendChild(createCard(item));
      container.appendChild(animDiv);
    }

    function animateMobileSlide(direction) {
      if (isAnimating) return;
      isAnimating = true;
      const oldIndex = currentIndex;
      let newIndex;
      if (direction === 'left') {
        newIndex = (currentIndex + 1) % data.length;
      } else {
        newIndex = (currentIndex - 1 + data.length) % data.length;
      }
      const oldItem = data[oldIndex];
      const newItem = data[newIndex];

      // Eski kart
      const oldDiv = document.createElement('div');
      oldDiv.className = 'carousel-card-anim current';
      oldDiv.appendChild(createCard(oldItem));

      // Yeni kart
      const newDiv = document.createElement('div');
      newDiv.className = 'carousel-card-anim next';
      newDiv.appendChild(createCard(newItem));

      container.innerHTML = '';
      container.appendChild(oldDiv);
      container.appendChild(newDiv);

      // Başlangıç pozisyonu
      if (direction === 'left') {
        newDiv.classList.add('slide-in-right');
        setTimeout(() => {
          oldDiv.classList.add('slide-out-left');
          newDiv.classList.add('active');
        }, 20);
      } else {
        newDiv.classList.add('slide-in-left');
        setTimeout(() => {
          oldDiv.classList.add('slide-out-right');
          newDiv.classList.add('active');
        }, 20);
      }

      setTimeout(() => {
        container.innerHTML = '';
        newDiv.className = 'carousel-card-anim current';
        container.appendChild(newDiv);
        currentIndex = newIndex;
        isAnimating = false;
      }, 520);
    }

    function handleResize() {
      if (isMobile()) {
        renderMobileCarousel();
      } else {
        render3DCarousel();
      }
    }

    // Butonlar ve otomatik geçiş için fonksiyonları güncelle
    function goLeft() {
      if (isMobile()) {
        animateMobileSlide('right');
      } else {
        animate3DSlide('right');
      }
      resetInterval();
    }
    function goRight() {
      if (isMobile()) {
        animateMobileSlide('left');
      } else {
        animate3DSlide('left');
      }
      resetInterval();
    }
    document.getElementById('carousel-left').onclick = goLeft;
    document.getElementById('carousel-right').onclick = goRight;

    function nextSlide() {
      if (isMobile()) {
        animateMobileSlide('left');
      } else {
        animate3DSlide('left');
      }
    }
    function prevSlide() {
      if (isMobile()) {
        animateMobileSlide('right');
      } else {
        animate3DSlide('right');
      }
    }

    function resetInterval() {
      clearInterval(intervalId);
      intervalId = setInterval(nextSlide, 4000);
    }

    // Başlangıçta ve resize'da uygun render
    handleResize();
    intervalId = setInterval(nextSlide, 4000);
    window.addEventListener('resize', handleResize);
  })
  .catch(error => {
    console.error('Error loading carousel data:', error);
  });
});
