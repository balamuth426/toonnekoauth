// Popüler bölümler için JavaScript
class PopularSections {
  constructor() {
    this.baseUrl = 'http://localhost:5506/api';
    this.manhwalarData = null;
    this.init();
  }

  async init() {
    try {
      // Manhwalar verilerini yükle
      await this.loadManhwalarData();
      
      // Popüler bölümleri yükle
      await this.loadWeeklyPopular();
      await this.loadAllTimePopular();
      
      // Anlık güncelleme sistemini başlat
      this.startAutoRefresh();
      
      console.log('✅ Popular sections initialized');
    } catch (error) {
      console.error('❌ Popular sections initialization error:', error);
    }
  }

  async loadManhwalarData() {
    try {
      const response = await fetch('data/manhwalar.json');
      this.manhwalarData = await response.json();
      console.log('📚 Manhwalar data loaded:', this.manhwalarData.length, 'series');
    } catch (error) {
      console.error('❌ Failed to load manhwalar data:', error);
      this.manhwalarData = [];
    }
  }

  async loadWeeklyPopular() {
    try {
      const container = document.getElementById('weekly-popular-grid');
      if (!container) {
        console.log('⚠️ Weekly popular container not found');
        return;
      }

      // Loading state
      container.innerHTML = '<div class="popular-loading"><i class="fas fa-spinner fa-spin"></i> Haftalık popülerler yükleniyor...</div>';

      const response = await fetch(`${this.baseUrl}/stats/weekly-popular-series?limit=4`);
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        console.log('📊 Weekly popular series data:', data.data);
        this.renderImprovedPopularGrid(container, data.data, 'weekly');
      } else {
        container.innerHTML = '<div class="popular-empty">Henüz haftalık popüler bölüm verisi yok</div>';
      }
    } catch (error) {
      console.error('❌ Failed to load weekly popular:', error);
      const container = document.getElementById('weekly-popular-grid');
      if (container) {
        container.innerHTML = '<div class="popular-empty">Haftalık popülerler yüklenirken hata oluştu</div>';
      }
    }
  }

  async loadAllTimePopular() {
    try {
      const container = document.getElementById('all-time-popular-grid');
      if (!container) {
        console.log('⚠️ All time popular container not found');
        return;
      }

      // Loading state
      container.innerHTML = '<div class="popular-loading"><i class="fas fa-spinner fa-spin"></i> En çok okunanlar yükleniyor...</div>';

      const response = await fetch(`${this.baseUrl}/stats/all-time-popular-series?limit=6`);
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        console.log('📊 All time popular series data:', data.data);
        this.renderImprovedPopularGrid(container, data.data, 'all-time');
      } else {
        container.innerHTML = '<div class="popular-empty">Henüz popüler bölüm verisi yok</div>';
      }
    } catch (error) {
      console.error('❌ Failed to load all time popular:', error);
      const container = document.getElementById('all-time-popular-grid');
      if (container) {
        container.innerHTML = '<div class="popular-empty">En çok okunanlar yüklenirken hata oluştu</div>';
      }
    }
  }

  // Anlık güncelleme sistemini başlat
  startAutoRefresh() {
    // İlk yükleme tamamlandıktan sonra periyodik güncelleme başlat
    setTimeout(() => {
      console.log('🔄 Auto-refresh sistemi başlatılıyor...');
      setInterval(() => {
        console.log('🔄 Refreshing popular sections...');
        this.loadWeeklyPopular();
        this.loadAllTimePopular();
      }, 60000); // 60 saniyede bir güncelle
    }, 3000); // 3 saniye sonra başlat
  }

  renderPopularGrid(container, statsData, type) {
    console.log(`🚀 renderPopularGrid başladı - ${type}`);
    console.log(`📊 Gelen statsData:`, statsData);
    
    if (!statsData || statsData.length === 0) {
      container.innerHTML = '<div class="popular-empty">Veri bulunamadı</div>';
      return;
    }

    // Seri bazında grup et ve okuma sayılarını topla
    const seriesMap = new Map();
    
    statsData.forEach(stat => {
      // Seri başlığını temizle
      const cleanTitle = this.cleanSeriesTitle(stat.seriesTitle);
      console.log(`🔍 Processing: ${stat.seriesId} - "${stat.seriesTitle}" -> "${cleanTitle}"`);
      
      if (!seriesMap.has(stat.seriesId)) {
        seriesMap.set(stat.seriesId, {
          seriesId: stat.seriesId,
          seriesTitle: cleanTitle,
          totalReads: 0,
          weeklyReads: 0,
          lastRead: stat.lastRead,
          chapterCount: 0
        });
        console.log(`✅ Yeni seri eklendi: ${stat.seriesId}`);
      }
      
      const series = seriesMap.get(stat.seriesId);
      // Her bölümün okuma sayısını toplam ve haftalık olarak ayrı hesapla
      series.totalReads += stat.totalReads || 0;
      series.weeklyReads += stat.weeklyReads || 0;
      series.chapterCount += 1;
      
      console.log(`📈 Seri güncellendi - ${stat.seriesId}: totalReads=${series.totalReads}, weeklyReads=${series.weeklyReads}, chapterCount=${series.chapterCount}`);
      
      // En son okunan tarihi güncelle
      if (new Date(stat.lastRead) > new Date(series.lastRead)) {
        series.lastRead = stat.lastRead;
      }
    });

    console.log(`🗺️ SeriesMap final:`, Array.from(seriesMap.entries()));

    // Seri bazında sırala (sadece seriler, bölümler değil)
    const seriesArray = Array.from(seriesMap.values())
      .sort((a, b) => {
        const readsA = type === 'weekly' ? a.weeklyReads : a.totalReads;
        const readsB = type === 'weekly' ? b.weeklyReads : b.totalReads;
        return readsB - readsA;
      })
      .slice(0, type === 'weekly' ? 4 : 6);

    console.log(`🎯 ${type} - Series before grouping:`, statsData.length);
    console.log(`🎯 ${type} - Unique series after grouping:`, seriesArray.length);
    console.log('🎯 Series for rendering:', seriesArray.map(s => ({
      title: s.seriesTitle,
      totalReads: s.totalReads,
      weeklyReads: s.weeklyReads,
      chapters: s.chapterCount,
      seriesId: s.seriesId
    })));

    const html = seriesArray.map((series, index) => {
      const manhwa = this.findManhwaByTitle(series.seriesTitle);
      // manhwalar.json'da image alanı direkt URL olarak geldiği için onu kullan
      const coverImage = manhwa && manhwa.image ? manhwa.image : 'images/default-cover.jpg';
      // Mevcut seri sayfası linkini kullan
      const seriesUrl = manhwa && manhwa.link ? manhwa.link : '#';
      
      const readsCount = type === 'weekly' ? series.weeklyReads : series.totalReads;
      const readsText = type === 'weekly' ? 'haftalık' : 'toplam';

      return `
        <div class="popular-card" onclick="window.location.href='${seriesUrl}'">
          <div class="popular-rank">${index + 1}</div>
          <img class="popular-card-image" src="${coverImage}" alt="${series.seriesTitle}" loading="lazy">
          <div class="popular-card-content">
            <h3 class="popular-card-title">${series.seriesTitle}</h3>
            <div class="popular-stats">
              <div class="popular-reads">
                <i class="fas fa-eye"></i>
                <span>${this.formatNumber(readsCount)} ${readsText}</span>
              </div>
              <div class="popular-chapters">
                <i class="fas fa-book"></i>
                <span>${series.chapterCount} bölüm</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
    
    // Grid layout sınıfını güncelle
    this.updatePopularGridLayoutClass(container, seriesArray.length, type);
  }

  // Gelişmiş popüler grid render (yeni API için)
  renderImprovedPopularGrid(container, seriesData, type) {
    console.log(`🚀 renderImprovedPopularGrid başladı - ${type}`);
    console.log(`📊 Gelen seriesData:`, seriesData);
    
    if (!seriesData || seriesData.length === 0) {
      container.innerHTML = '<div class="popular-empty">Veri bulunamadı</div>';
      return;
    }

    const html = seriesData.map((series, index) => {
      // En temiz başlığı seç (en kısa ve en az özel karakter içeren)
      const cleanTitle = this.selectBestTitle(series.allTitles);
      
      // Önce seriesId ile eşleştirme dene, sonra başlık ile
      let manhwa = this.findManhwaBySeriesId(series.seriesId);
      if (!manhwa) {
        manhwa = this.findManhwaByTitle(cleanTitle);
        if (!manhwa) {
          console.warn(`❌ Manhwa bulunamadı - SeriesId: ${series.seriesId}, Title: ${cleanTitle}`);
        }
      }
      
      // manhwalar.json'da image alanı direkt URL olarak geldiği için onu kullan
      const coverImage = manhwa && manhwa.image ? manhwa.image : 'images/default-cover.jpg';
      // Mevcut seri sayfası linkini kullan
      const seriesUrl = manhwa && manhwa.link ? manhwa.link : '#';
      
      const readsCount = type === 'weekly' ? series.totalWeeklyReads : series.totalAllTimeReads;
      const readsText = type === 'weekly' ? 'haftalık' : 'toplam';
      
      console.log(`🎯 Rendering series ${index + 1}: ${cleanTitle} (${readsCount} ${readsText} okuma) - Link: ${seriesUrl}`);

      return `
        <div class="popular-card" onclick="window.location.href='${seriesUrl}'">
          <div class="popular-rank">${index + 1}</div>
          <img class="popular-card-image" src="${coverImage}" alt="${cleanTitle}" loading="lazy">
          <div class="popular-card-content">
            <h3 class="popular-card-title">${cleanTitle}</h3>
            <div class="popular-stats">
              <div class="popular-reads">
                <i class="fas fa-eye"></i>
                <span>${this.formatNumber(readsCount)} ${readsText}</span>
              </div>
              <div class="popular-chapters">
                <i class="fas fa-book"></i>
                <span>${series.chapterCount} bölüm</span>
              </div>
              <div class="popular-score">
                <i class="fas fa-star"></i>
                <span>Skor: ${series.popularityScore}</span>
              </div>
              ${series.avgReadsPerChapter > 0 ? `
                <div class="popular-avg">
                  <i class="fas fa-chart-line"></i>
                  <span>Ort: ${series.avgReadsPerChapter}/bölüm</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
    
    // Grid layout sınıfını güncelle
    this.updatePopularGridLayoutClass(container, seriesData.length, type);
    
    console.log(`✅ ${type} popüler grid başarıyla render edildi (${seriesData.length} seri)`);
  }

  // En iyi başlığı seç (en temiz ve anlaşılır olanı)
  selectBestTitle(allTitles) {
    if (!allTitles || allTitles.length === 0) return 'Bilinmeyen Seri';
    if (allTitles.length === 1) return decodeURIComponent(allTitles[0]);
    
    // Başlıkları kalite skoruna göre sırala
    const scoredTitles = allTitles.map(title => {
      const decoded = decodeURIComponent(title);
      let score = 0;
      
      // Temiz başlık için bonus puanlar
      if (!decoded.includes('%20')) score += 10;
      if (!decoded.toLowerCase().includes('chapters')) score += 10;
      if (!decoded.includes('%')) score += 5;
      
      // Uzunluk penaltısı (çok uzun başlıklar cezalandırılır)
      score -= Math.max(0, decoded.length - 20);
      
      // Büyük/küçük harf tutarlılığı
      if (decoded === decoded.toLowerCase() || decoded === decoded.toUpperCase()) score -= 5;
      
      return { title: decoded, score };
    });
    
    // En yüksek skora sahip başlığı seç
    scoredTitles.sort((a, b) => b.score - a.score);
    
    console.log(`🏆 Başlık seçimi:`, scoredTitles, `Seçilen: ${scoredTitles[0].title}`);
    
    return scoredTitles[0].title;
  }

  // Grid layout sınıfını ekle (4'lü grid mantığı için)
  updatePopularGridLayoutClass(container, itemCount, type) {
    // Önceki sınıfları temizle
    container.classList.remove('only-one', 'only-two', 'only-three', 'incomplete-row-1', 'incomplete-row-2', 'incomplete-row-3');
    
    console.log(`🔄 Popular grid layout güncellemesi (${type}) - item sayısı: ${itemCount}`);
    
    // Eğer kart sayısı 1, 2 veya 3 ise özel sınıflar ekle (4'lü grid mantığına göre)
    if (itemCount === 1) {
      container.classList.add('only-one');
      console.log(`✅ Popular ${type} - only-one sınıfı eklendi`);
    } else if (itemCount === 2) {
      container.classList.add('only-two');
      console.log(`✅ Popular ${type} - only-two sınıfı eklendi`);
    } else if (itemCount === 3) {
      container.classList.add('only-three');
      console.log(`✅ Popular ${type} - only-three sınıfı eklendi`);
    } else {
      // 4 veya daha fazla kart için son satırdaki eksik kartları işaretle
      const remainingCards = itemCount % 4;
      if (remainingCards > 0 && remainingCards < 4) {
        container.classList.add(`incomplete-row-${remainingCards}`);
        console.log(`✅ Popular ${type} - incomplete-row-${remainingCards} sınıfı eklendi`);
      }
    }
  }

  findManhwaByTitle(title) {
    if (!this.manhwalarData || !Array.isArray(this.manhwalarData)) {
      return null;
    }
    
    // Önce tam eşleşme dene (title alanıyla)
    let manhwa = this.manhwalarData.find(m => 
      m.title && m.title.toLowerCase() === title.toLowerCase()
    );
    
    if (manhwa) return manhwa;
    
    // Esnek eşleştirme - başlıktaki boşlukları kaldır ve karşılaştır
    const normalizedTitle = title.toLowerCase().replace(/\s+/g, '').replace(/[^\w]/g, '');
    manhwa = this.manhwalarData.find(m => {
      if (!m.title) return false;
      const normalizedManhwa = m.title.toLowerCase().replace(/\s+/g, '').replace(/[^\w]/g, '');
      return normalizedManhwa === normalizedTitle;
    });
    
    if (manhwa) return manhwa;
    
    // Kısmi eşleştirme - başlık içinde geçiyor mu
    manhwa = this.manhwalarData.find(m => {
      if (!m.title) return false;
      const manhwaTitle = m.title.toLowerCase();
      const searchTitle = title.toLowerCase();
      return manhwaTitle.includes(searchTitle) || searchTitle.includes(manhwaTitle);
    });
    
    if (manhwa) {
      console.log(`📚 Partial match found: "${title}" -> "${manhwa.title}"`);
      return manhwa;
    }
    
    console.warn(`❌ No manhwa found for title: "${title}"`);
    return null;
 }

  // Seri başlığını temizle ve düzenle
  cleanSeriesTitle(title) {
    if (!title) return title;
    
    // URL decode işlemi
    let cleanTitle = decodeURIComponent(title);
    
    // "chapters" kelimesini kaldır
    cleanTitle = cleanTitle.replace(/\s*chapters?\s*$/i, '');
    
    // İlk harfi büyük yap
    cleanTitle = cleanTitle.replace(/^\w/, c => c.toUpperCase());
    
    // Çoklu boşlukları tek boşluğa çevir
    cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
    
    return cleanTitle;
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // Seri bazında istatistikleri yükle (admin için)
  async loadSeriesStats() {
    try {
      const response = await fetch(`${this.baseUrl}/stats/series-stats`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('❌ Failed to load series stats:', error);
      return [];
    }
  }

  // Manuel refresh için global fonksiyon
  manualRefresh() {
    console.log('🔄 Manuel refresh başlatıldı...');
    this.loadWeeklyPopular();
    this.loadAllTimePopular();
  }

  // SeriesId'ye göre manhwa bulma (daha güvenilir)
  findManhwaBySeriesId(seriesId) {
    if (!this.manhwalarData || !Array.isArray(this.manhwalarData)) {
      return null;
    }
    
    // SeriesId'ye göre direkt eşleştirme
    const manhwa = this.manhwalarData.find(m => {
      if (!m.link) return false;
      
      // Link'ten seriesId çıkar: "series/nanomachine/..." -> "nanomachine"
      const linkMatch = m.link.match(/series\/([^\/]+)\//);
      const linkSeriesId = linkMatch ? linkMatch[1] : null;
      
      return linkSeriesId === seriesId;
    });
    
    if (manhwa) {
      console.log(`🎯 SeriesId match found: ${seriesId} -> "${manhwa.title}"`);
      return manhwa;
    }
    
    return null;
  }
}

// Sayfa yüklendiğinde popüler bölümleri başlat
document.addEventListener('DOMContentLoaded', () => {
  // Ana sayfa ve tüm seriler sayfasında çalışsın
  const currentPage = window.location.pathname;
  if (currentPage.includes('index.html') || currentPage === '/' || currentPage.includes('tum-seriler.html')) {
    window.popularSections = new PopularSections();
  }
});
