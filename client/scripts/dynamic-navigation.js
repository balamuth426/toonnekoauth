// Dynamic Chapter Navigation System
// Bölüm sayısına göre navigation butonlarını dinamik olarak yöneten sistem

// Duplicate class prevention
if (typeof DynamicNavigation !== 'undefined') {
    console.warn('⚠️ DynamicNavigation already defined, skipping redefinition');
} else {

class DynamicNavigation {
    constructor() {
        this.seriesData = null;
        this.currentSeries = null;
        this.currentChapter = null;
        this.availableChapters = [];
        this.chapterPosition = null; // 'first', 'middle', 'last'
        this.init();
    }
    
    async init() {
        try {
            console.log('🚀 Dynamic Navigation System başlatılıyor...');
            console.log('📍 Mevcut URL:', window.location.href);
            
            // Sayfa bilgilerini çıkar
            this.extractPageInfo();
            console.log('📊 Çıkarılan bilgiler:', {
                series: this.currentSeries,
                chapter: this.currentChapter
            });
            
            // Seri verilerini yükle
            await this.loadSeriesData();
            
            // Bölüm pozisyonunu belirle
            this.determineChapterPosition();
            
            // Dinamik UI oluştur
            await this.createDynamicUI();
            
            // Event listener'ları ekle
            this.addEventListeners();
            
            console.log('✅ Dynamic Navigation hazır!', {
                series: this.currentSeries,
                chapter: this.currentChapter,
                position: this.chapterPosition,
                totalChapters: this.availableChapters.length,
                chapters: this.availableChapters
            });
            
        } catch (error) {
            console.error('❌ Navigation başlatma hatası:', error);
        }
    }
    
    extractPageInfo() {
        const url = window.location.pathname;
        const decodedUrl = decodeURIComponent(url);
        
        console.log('🔍 URL analizi:', {
            original: url,
            decoded: decodedUrl
        });
        
        // URL'den series ve chapter bilgilerini çıkar
        const patterns = [
            /\/chapters\/(.+?)\s+chapters\/bölüm(\d+)\.html/,
            /\/chapters\/([^\/]+)\/bölüm(\d+)\.html/,
            /bölüm(\d+)\.html/
        ];
        
        let matched = false;
        
        for (const pattern of patterns) {
            const match = decodedUrl.match(pattern);
            if (match) {
                matched = true;
                if (match.length >= 3) {
                    this.currentSeries = this.normalizeSeriesName(match[1]);
                    this.currentChapter = parseInt(match[2]);
                    console.log('✅ Pattern matched (full):', {
                        rawSeries: match[1],
                        normalizedSeries: this.currentSeries,
                        chapter: this.currentChapter
                    });
                } else {
                    this.currentChapter = parseInt(match[1]);
                    this.currentSeries = this.guessSeriesFromUrl(decodedUrl);
                    console.log('✅ Pattern matched (chapter only):', {
                        chapter: this.currentChapter,
                        guessedSeries: this.currentSeries
                    });
                }
                break;
            }
        }
        
        if (!matched) {
            console.warn('⚠️ URL pattern tanınamadı, fallback kullanılıyor');
            // Fallback strategy
            this.currentSeries = this.guessSeriesFromUrl(decodedUrl);
            this.currentChapter = 1; // Default chapter
        }
        
        console.log('📊 Final extraction result:', {
            series: this.currentSeries,
            chapter: this.currentChapter
        });
    }
    
    normalizeSeriesName(name) {
        const mapping = {
            'black crow': 'blackcrow',
            'blackcrow': 'blackcrow',
            'solo leveling': 'sololeveling',
            'damn reincarnation': 'damnreincarnation',
            'arcanesniper': 'arcanesniper',
            'arcane sniper': 'arcanesniper'
        };
        
        const normalized = name.toLowerCase().trim();
        return mapping[normalized] || normalized.replace(/\s+/g, '');
    }
    
    guessSeriesFromUrl(url) {
        if (url.includes('blackcrow') || url.includes('black')) return 'blackcrow';
        if (url.includes('solo')) return 'sololeveling';
        if (url.includes('damn')) return 'damnreincarnation';
        if (url.includes('arcanesniper') || url.includes('arcane')) return 'arcanesniper';
        return 'unknown';
    }
    
    async loadSeriesData() {
        try {
            console.log('📡 Loading series data for:', this.currentSeries);
            
            // Cache busting için timestamp ekle
            const timestamp = Date.now();
            const response = await fetch(`/client/data/manhwalar.json?v=${timestamp}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const allSeries = await response.json();
            console.log('📚 All series loaded:', allSeries.length, 'series');
            
            // Mevcut seriyi bul
            this.seriesData = allSeries.find(series => 
                series.seriesId === this.currentSeries
            );
            
            if (this.seriesData) {
                this.availableChapters = this.seriesData.availableChapters || [];
                console.log('✅ Seri bulundu:', {
                    title: this.seriesData.title,
                    chapters: this.availableChapters,
                    seriesId: this.seriesData.seriesId,
                    chapterDetails: this.seriesData.chapterDetails?.length || 0
                });
            } else {
                console.warn('⚠️ Seri bulunamadı:', {
                    looking_for: this.currentSeries,
                    available_series: allSeries.map(s => s.seriesId)
                });
                
                // Fallback - blackcrow için özel kontrol
                if (this.currentSeries === 'unknown' || !this.currentSeries) {
                    const blackCrowSeries = allSeries.find(s => s.seriesId === 'blackcrow');
                    if (blackCrowSeries && window.location.pathname.includes('blackcrow')) {
                        console.log('🔄 Fallback: BlackCrow serisi kullanılıyor');
                        this.currentSeries = 'blackcrow';
                        this.seriesData = blackCrowSeries;
                        this.availableChapters = blackCrowSeries.availableChapters || [];
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Seri verileri yüklenemedi:', {
                error: error.message,
                currentSeries: this.currentSeries,
                url: window.location.href
            });
            
            // Network hatası durumunda fallback data kullan
            this.useOfflineData();
        }
    }
    
    useOfflineData() {
        console.log('🔄 Offline data kullanılıyor...');
        
        // Hardcoded fallback data
        if (this.currentSeries === 'blackcrow' || window.location.pathname.includes('blackcrow')) {
            this.seriesData = {
                title: "Black Crow",
                seriesId: "blackcrow",
                availableChapters: [1, 2, 3],
                chapterDetails: [
                    { number: 1, url: "chapters/blackcrow chapters/bölüm1.html" },
                    { number: 2, url: "chapters/blackcrow chapters/bölüm2.html" },
                    { number: 3, url: "chapters/blackcrow chapters/bölüm3.html" }
                ]
            };
            this.currentSeries = 'blackcrow';
            this.availableChapters = [1, 2, 3];
            console.log('✅ Offline BlackCrow data yüklendi');
        }
    }
    
    determineChapterPosition() {
        if (!this.availableChapters.length) {
            this.chapterPosition = 'unknown';
            return;
        }
        
        const currentIndex = this.availableChapters.indexOf(this.currentChapter);
        const totalChapters = this.availableChapters.length;
        
        if (currentIndex === 0) {
            this.chapterPosition = 'first'; // İlk bölüm
        } else if (currentIndex === totalChapters - 1) {
            this.chapterPosition = 'last'; // Son bölüm
        } else if (currentIndex > 0) {
            this.chapterPosition = 'middle'; // Ara bölüm
        } else {
            this.chapterPosition = 'unknown';
        }
        
        console.log('📍 Bölüm pozisyonu:', {
            chapter: this.currentChapter,
            position: this.chapterPosition,
            index: currentIndex,
            total: totalChapters
        });
    }
    
    async createDynamicUI() {
        // Her iki navigation area'sını da güncelle
        await this.updateNavigationArea('top');
        await this.updateNavigationArea('bottom');
        
        // Bölüm seçici dropdown'ını da güncelle
        this.updateChapterSelector();
    }
    
    async updateNavigationArea(area) {
        // Doğru selector'ları kullan
        let navArea;
        if (area === 'top') {
            navArea = document.querySelector('#nav-area');
        } else {
            navArea = document.querySelector('#nav-area-bottom');
        }
        
        console.log(`🔍 Navigation area lookup for ${area}:`, {
            selector: area === 'top' ? '#nav-area' : '#nav-area-bottom',
            found: !!navArea,
            element: navArea
        });
        
        if (!navArea) {
            console.warn(`⚠️ Navigation area bulunamadı: ${area}`);
            // Fallback - eğer area bulunamazsa oluştur
            await this.createNavigationArea(area);
            return;
        }
        
        // Mevcut butonları temizle
        navArea.innerHTML = '';
        
        // Pozisyona göre butonları oluştur
        const areaId = area === 'top' ? '' : '2';
        const buttonsHTML = await this.generateButtonsHTML(areaId);
        navArea.innerHTML = buttonsHTML;
        
        console.log(`✅ ${area} navigation area güncellendi:`, buttonsHTML);
    }
    
    async createNavigationArea(area) {
        const areaId = area === 'top' ? '' : '-bottom';
        const navArea = document.createElement('div');
        navArea.id = `nav-area${areaId}`;
        navArea.className = 'okuma-nav-inner';
        
        // Okuma nav'ı bul ve ekle
        const okumaNavs = document.querySelectorAll('.okuma-nav');
        const targetNav = area === 'top' ? okumaNavs[0] : okumaNavs[1];
        
        if (targetNav) {
            targetNav.appendChild(navArea);
            console.log(`✅ Navigation area oluşturuldu: ${area}`);
            
            // Butonları ekle
            const buttonsHTML = await this.generateButtonsHTML(areaId.replace('-', ''));
            navArea.innerHTML = buttonsHTML;
        } else {
            console.error(`❌ Okuma nav bulunamadı: ${area}`);
        }
    }
    
    async generateButtonsHTML(areaId) {
        const currentIndex = this.availableChapters.indexOf(this.currentChapter);
        const prevChapter = currentIndex > 0 ? this.availableChapters[currentIndex - 1] : null;
        const nextChapter = currentIndex < this.availableChapters.length - 1 ? this.availableChapters[currentIndex + 1] : null;
        
        let buttonsHTML = '';
        
        // Pozisyona göre buton oluşturma mantığı
        switch (this.chapterPosition) {
            case 'first':
                // İlk bölüm: Sadece "Sonraki Bölüm" ve "Bilgi" butonu
                if (nextChapter) {
                    buttonsHTML += this.createNextButton(nextChapter, areaId);
                }
                buttonsHTML += await this.createInfoButton(areaId);
                break;
                
            case 'middle':
                // Ara bölüm: "Önceki Bölüm" ve "Sonraki Bölüm" butonları
                if (prevChapter) {
                    buttonsHTML += this.createPrevButton(prevChapter, areaId);
                }
                if (nextChapter) {
                    buttonsHTML += this.createNextButton(nextChapter, areaId);
                }
                break;
                
            case 'last':
                // Son bölüm: Sadece "Önceki Bölüm" ve "Bilgi" butonu
                if (prevChapter) {
                    buttonsHTML += this.createPrevButton(prevChapter, areaId);
                }
                buttonsHTML += await this.createInfoButton(areaId);
                break;
                
            default:
                // Bilinmeyen durum: Tüm butonları göster
                if (prevChapter) {
                    buttonsHTML += this.createPrevButton(prevChapter, areaId);
                }
                if (nextChapter) {
                    buttonsHTML += this.createNextButton(nextChapter, areaId);
                }
                buttonsHTML += await this.createInfoButton(areaId);
        }
        
        return buttonsHTML;
    }
    
    createPrevButton(chapterNum, areaId) {
        return `
            <button id="navPrevBtn${areaId}" class="nav-btn prev-btn" data-chapter="${chapterNum}">
                <i class="fa-solid fa-chevron-left"></i>
                <span>Önceki Bölüm</span>
            </button>
        `;
    }
    
    createNextButton(chapterNum, areaId) {
        return `
            <button id="navNextBtn${areaId}" class="nav-btn next-btn" data-chapter="${chapterNum}">
                <span>Sonraki Bölüm</span>
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        `;
    }
    
    async createInfoButton(areaId) {
        const seriesLink = await this.getSeriesLink();
        return `
            <a href="${seriesLink}" class="nav-btn info-btn" title="Seri Sayfası">
                <i class="fa-solid fa-info-circle"></i>
            </a>
        `;
    }
     async getSeriesLink() {
        console.log('🔗 getSeriesLink called for series:', this.currentSeries);
        
        try {
            // API'den seri bilgilerini al
            const response = await fetch('http://localhost:5506/api/manhwa/');
            if (response.ok) {
                const seriesData = await response.json();
                const currentSeries = seriesData.find(series => series.seriesId === this.currentSeries);
                
                if (currentSeries && currentSeries.link) {
                    // API'den gelen link'i relative path'e çevir
                    let path = currentSeries.link;
                    if (path.startsWith('series/')) {
                        path = `../../${path}`;
                    } else if (!path.startsWith('../../')) {
                        path = `../../${path}`;
                    }
                    console.log('🔗 API returned dynamic link:', path);
                    return path;
                }
            }
        } catch (error) {
            console.error('🔗 API call failed:', error);
        }
        
        console.log('🔗 API failed, using fallback');
        
        // Fallback - Seri sayfası linkini statik olarak oluştur
        const seriesLinks = {
            'blackcrow': '../../series/blackcrow/blackcrowseri.html',
            'sololeveling': '../../series/sololeveling/sololevelingseri.html',
            'damnreincarnation': '../../series/damnreincarnation/damnreincarnationseri.html',
            'arcanesniper': '../../series/arcanesniper/arcanesniperseri.html'
        };

        const fallbackLink = seriesLinks[this.currentSeries] || '../../index.html';
        console.log('🔗 Using fallback link:', fallbackLink);
        return fallbackLink;
    }
    
    updateChapterSelector() {
        const chapterSelector = document.getElementById('bolumSec');
        if (!chapterSelector || !this.availableChapters.length) {
            console.warn('⚠️ Bölüm seçici bulunamadı veya bölüm yok');
            return;
        }
        
        // Mevcut event listener'ları temizle
        const newSelector = chapterSelector.cloneNode(false);
        chapterSelector.parentNode.replaceChild(newSelector, chapterSelector);
        
        // Tüm bölümleri dropdown'a ekle
        this.availableChapters.forEach(chapterNum => {
            const option = document.createElement('option');
            option.value = chapterNum;
            option.textContent = `Bölüm ${chapterNum}`;
            
            // Mevcut bölümü seçili yap
            if (chapterNum === this.currentChapter) {
                option.selected = true;
            }
            
            newSelector.appendChild(option);
        });
        
        // Change event listener ekle
        newSelector.addEventListener('change', (e) => {
            const selectedChapter = parseInt(e.target.value);
            if (selectedChapter !== this.currentChapter) {
                this.navigateToChapter(selectedChapter);
            }
        });
        
        console.log('✅ Bölüm seçici güncellendi:', this.availableChapters);
    }
    
    addEventListeners() {
        // Previous butonları
        document.querySelectorAll('.prev-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chapterNum = e.currentTarget.dataset.chapter;
                this.navigateToChapter(chapterNum);
            });
        });
        
        // Next butonları
        document.querySelectorAll('.next-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chapterNum = e.currentTarget.dataset.chapter;
                this.navigateToChapter(chapterNum);
            });
        });
        
        // Klavye navigasyonu
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.navigatePrevious();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.navigateNext();
            }
        });
        
        // Chapter position class'ını body'ye ekle
        this.addPositionClass();
    }
    
    addPositionClass() {
        document.body.classList.add(`${this.chapterPosition}-chapter`);
        console.log(`📍 Body'ye ${this.chapterPosition}-chapter class'ı eklendi`);
    }
    
    navigateToChapter(chapterNum) {
        console.log('🔄 navigateToChapter çağrıldı:', {
            chapterNum,
            seriesData: !!this.seriesData,
            chapterDetails: this.seriesData?.chapterDetails?.length || 0
        });
        
        if (!this.seriesData) {
            console.error('❌ Seri verisi bulunamadı');
            this.showNavigationError();
            return;
        }
        
        // chapterDetails yoksa fallback kullan
        let chapterDetail = null;
        if (this.seriesData.chapterDetails && this.seriesData.chapterDetails.length > 0) {
            chapterDetail = this.seriesData.chapterDetails.find(ch => ch.number == chapterNum);
        }
        
        if (chapterDetail) {
            // Loading state göster
            this.showNavigationLoading();
            
            const url = `../../${chapterDetail.url}`;
            console.log(`🔄 Bölüm ${chapterNum}'e yönlendiriliyor:`, url);
            
            // Success animasyonu göster
            setTimeout(() => {
                this.showNavigationSuccess();
                setTimeout(() => {
                    window.location.href = url;
                }, 300);
            }, 500);
        } else {
            // Fallback: Manuel URL oluştur
            console.warn('⚠️ chapterDetails bulunamadı, fallback kullanılıyor:', chapterNum);
            this.navigateToChapterFallback(chapterNum);
        }
    }
    
    navigateToChapterFallback(chapterNum) {
        const seriesUrlMap = {
            'blackcrow': `../../chapters/blackcrow chapters/bölüm${chapterNum}.html`,
            'sololeveling': `../../chapters/solo leveling chapters/bölüm${chapterNum}.html`,
            'damnreincarnation': `../../chapters/damn reincarnation chapters/bölüm${chapterNum}.html`
        };
        
        const fallbackUrl = seriesUrlMap[this.currentSeries];
        if (fallbackUrl) {
            console.log(`🔄 Fallback URL ile bölüm ${chapterNum}'e yönlendiriliyor:`, fallbackUrl);
            this.showNavigationLoading();
            
            setTimeout(() => {
                this.showNavigationSuccess();
                setTimeout(() => {
                    window.location.href = fallbackUrl;
                }, 300);
            }, 500);
        } else {
            console.error('❌ Fallback URL oluşturulamadı:', {
                chapterNum,
                currentSeries: this.currentSeries
            });
            this.showNavigationError();
        }
    }
    
    showNavigationLoading() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.add('loading');
        });
    }
    
    showNavigationSuccess() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('loading');
            btn.classList.add('success');
        });
    }
    
    showNavigationError() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('loading');
            btn.classList.add('error');
        });
    }
    
    navigatePrevious() {
        const currentIndex = this.availableChapters.indexOf(this.currentChapter);
        if (currentIndex > 0) {
            const prevChapter = this.availableChapters[currentIndex - 1];
            this.navigateToChapter(prevChapter);
        }
    }
    
    navigateNext() {
        const currentIndex = this.availableChapters.indexOf(this.currentChapter);
        if (currentIndex < this.availableChapters.length - 1) {
            const nextChapter = this.availableChapters[currentIndex + 1];
            this.navigateToChapter(nextChapter);
        }
    }
}

// Sayfa yüklendiğinde başlat - Multiple attempts
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOMContentLoaded - Dynamic Navigation başlatılıyor...');
    new DynamicNavigation();
});

// Fallback - window load event
window.addEventListener('load', () => {
    console.log('🎯 Window Load - Dynamic Navigation fallback başlatılıyor...');
    if (!document.querySelector('.nav-btn')) {
        new DynamicNavigation();
    }
});

// Fallback - immediate execution for cached pages
if (document.readyState === 'loading') {
    // Still loading
} else {
    // DOM ready or complete
    console.log('🎯 Immediate execution - Dynamic Navigation başlatılıyor...');
    setTimeout(() => {
        if (!document.querySelector('.nav-btn')) {
            new DynamicNavigation();
        }
    }, 100);
}

} // End of duplicate prevention check