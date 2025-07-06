// Simple Chapter Navigation System
// Admin panel ve mevcut bölümler için işlevsel navigation

class SimpleChapterNavigation {
    constructor() {
        this.seriesData = null;
        this.currentSeries = null;
        this.currentChapter = null;
        this.init();
    }
    
    async init() {
        try {
            // URL'den series ve chapter bilgisini çıkar
            this.extractPageInfo();
            
            // Series verisini yükle
            await this.loadSeriesData();
            
            // Navigation butonlarını kur
            this.setupNavigationButtons();
            
            console.log('✅ Simple Navigation başlatıldı:', {
                series: this.currentSeries,
                chapter: this.currentChapter
            });
        } catch (error) {
            console.error('❌ Navigation başlatma hatası:', error);
        }
    }
    
    extractPageInfo() {
        const url = decodeURIComponent(window.location.pathname);
        
        console.log('🔍 URL parsing:', url);
        
        // URL pattern: /chapters/{series} chapters/bölüm{number}.html
        // Örnek: /chapters/solo leveling chapters/bölüm1.html
        const match = url.match(/\/chapters\/(.+?)\s+chapters\/bölüm(\d+)\.html/);
        
        if (match) {
            const rawSeriesName = match[1].trim();
            this.currentSeries = rawSeriesName.toLowerCase().replace(/\s+/g, '');
            this.currentChapter = parseInt(match[2]);
            
            console.log('📊 Parsed info:', {
                rawUrl: url,
                rawSeriesName: rawSeriesName,
                seriesId: this.currentSeries,
                chapter: this.currentChapter
            });
        } else {
            console.warn('⚠️ URL pattern tanınamadı:', url);
            
            // Fallback: sadece series name'i çıkarmaya çalış
            const fallbackMatch = url.match(/\/chapters\/(.+?)\/bölüm(\d+)\.html/);
            if (fallbackMatch) {
                this.currentSeries = fallbackMatch[1].toLowerCase().replace(/\s+/g, '');
                this.currentChapter = parseInt(fallbackMatch[2]);
                console.log('🔄 Fallback parsing başarılı:', {
                    series: this.currentSeries,
                    chapter: this.currentChapter
                });
            }
        }
    }
    
    async loadSeriesData() {
        try {
            const response = await fetch('/client/data/manhwalar.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            
            // Current series'ı bul
            this.seriesData = data.find(series => series.seriesId === this.currentSeries);
            
            if (!this.seriesData) {
                console.warn('⚠️ Series bulunamadı:', this.currentSeries);
                return;
            }
            
            console.log('📊 Series data yüklendi:', this.seriesData.title);
        } catch (error) {
            console.error('❌ Series data yüklenemedi:', error);
        }
    }
    
    setupNavigationButtons() {
        // Üst navigation
        this.setupButtons('navPrevBtn', 'navNextBtn');
        // Alt navigation
        this.setupButtons('navPrevBtn2', 'navNextBtn2');
    }
    
    setupButtons(prevId, nextId) {
        const prevBtn = document.getElementById(prevId);
        const nextBtn = document.getElementById(nextId);
        
        if (!prevBtn || !nextBtn) {
            console.warn(`⚠️ Navigation butonları bulunamadı: ${prevId}, ${nextId}`);
            return;
        }
        
        if (!this.seriesData || !this.currentChapter) {
            console.warn('⚠️ Series data veya current chapter mevcut değil');
            return;
        }
        
        const availableChapters = (this.seriesData.availableChapters || []).sort((a, b) => a - b);
        const currentIndex = availableChapters.indexOf(this.currentChapter);
        
        // Önceki chapter
        const prevChapter = currentIndex > 0 ? availableChapters[currentIndex - 1] : null;
        // Sonraki chapter  
        const nextChapter = currentIndex >= 0 && currentIndex < availableChapters.length - 1 
            ? availableChapters[currentIndex + 1] : null;
        
        // Önceki buton
        if (prevChapter) {
            prevBtn.style.display = 'inline-block';
            prevBtn.disabled = false;
            prevBtn.onclick = () => this.navigateToChapter(prevChapter);
            
            // Text güncelle
            const textElement = prevBtn.querySelector('span') || prevBtn;
            textElement.textContent = `Bölüm ${prevChapter}`;
        } else {
            prevBtn.style.display = 'none';
            prevBtn.disabled = true;
        }
        
        // Sonraki buton
        if (nextChapter) {
            nextBtn.style.display = 'inline-block';
            nextBtn.disabled = false;
            nextBtn.onclick = () => this.navigateToChapter(nextChapter);
            
            // Text güncelle
            const textElement = nextBtn.querySelector('span') || nextBtn;
            textElement.textContent = `Bölüm ${nextChapter}`;
        } else {
            nextBtn.style.display = 'none';
            nextBtn.disabled = true;
        }
        
        console.log(`🧭 ${prevId}/${nextId} - Önceki: ${prevChapter || 'yok'}, Sonraki: ${nextChapter || 'yok'}`);
    }
    
    navigateToChapter(chapterNumber) {
        if (!this.seriesData) return;
        
        // Mevcut URL'yi base al
        const currentUrl = decodeURIComponent(window.location.pathname);
        const basePath = currentUrl.replace(/bölüm\d+\.html$/, '');
        const url = `${basePath}bölüm${chapterNumber}.html`;
        
        console.log(`🚶 Navigating to Chapter ${chapterNumber}: ${url}`);
        window.location.href = url;
    }
}

// Sayfa yüklendiğinde navigation'ı başlat
document.addEventListener('DOMContentLoaded', function() {
    // Sadece chapter sayfalarında çalıştır
    if (window.location.pathname.includes('/chapters/') && window.location.pathname.includes('bölüm')) {
        window.simpleNav = new SimpleChapterNavigation();
    }
});
