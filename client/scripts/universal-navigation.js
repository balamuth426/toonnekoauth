// Universal Chapter Navigation System - REAL MANGA SITE STYLE
// Gerçek manga/manhwa sitelerindeki gibi tam dinamik navigation

class UniversalNavigation {
    constructor() {
        this.seriesData = null;
        this.currentSeries = null;
        this.currentChapter = null;
        this.navigationMap = new Map();
        this.isLoading = false;
        this.seriesMapping = {
            'blackcrow': 'blackcrow',
            'black': 'blackcrow',
            'crow': 'blackcrow',
            'sololeveling': 'sololeveling',
            'solo': 'sololeveling',
            'leveling': 'sololeveling',
            'nanomachine': 'nanomachine',
            'nano': 'nanomachine',
            'machine': 'nanomachine',
            'omniscientreader': 'omniscientreader',
            'omniscient': 'omniscientreader',
            'reader': 'omniscientreader',
            'arcanesniper': 'arcanesniper',
            'arcane': 'arcanesniper',
            'sniper': 'arcanesniper'
        };
        this.init();
    }
    
    async init() {
        try {
            console.log('🚀 Dynamic Navigation initializing...');
            
            // Show loading state
            this.showLoadingState();
            
            // Extract page info
            this.extractPageInfo();
            
            // Load series data
            await this.loadSeriesData();
            
            // Build navigation map
            this.buildNavigationMap();
            
            // Setup dynamic UI
            this.setupDynamicUI();
            
            // Add keyboard navigation
            this.addKeyboardNavigation();
            
            // Add swipe navigation for mobile
            this.addSwipeNavigation();
            
            // Setup keyboard hint
            this.setupKeyboardHint();
            
            console.log('✅ Dynamic Navigation ready!', {
                series: this.currentSeries,
                chapter: this.currentChapter,
                totalChapters: this.seriesData?.availableChapters?.length || 0
            });
            
        } catch (error) {
            console.error('❌ Navigation initialization failed:', error);
            this.showErrorState();
        }
    }
    
    showLoadingState() {
        // Show loading indicators on navigation elements
        const buttons = ['navPrevBtn', 'navNextBtn', 'navPrevBtn2', 'navNextBtn2'];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yükleniyor...';
            }
        });
        
        const selector = document.getElementById('bolumSec');
        if (selector) {
            selector.disabled = true;
            selector.innerHTML = '<option>Yükleniyor...</option>';
        }
    }
    
    showErrorState() {
        const buttons = ['navPrevBtn', 'navNextBtn', 'navPrevBtn2', 'navNextBtn2'];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Hata';
                btn.style.background = '#dc3545';
            }
        });
    }
    
    extractPageInfo() {
        const url = window.location.pathname;
        const decodedUrl = decodeURIComponent(url);
        
        console.log('🔍 URL Analizi:', {
            original: url,
            decoded: decodedUrl
        });
        
        // Farklı URL pattern'larını dene
        const patterns = [
            // /chapters/blackcrow chapters/bölüm1.html
            /\/chapters\/(.+?)\s+chapters\/bölüm(\d+)\.html/,
            // /chapters/solo leveling chapters/bölüm1.html
            /\/chapters\/(.+?)\s+chapters\/bölüm(\d+)\.html/,
            // /chapters/seriesname/bölüm1.html
            /\/chapters\/([^\/]+)\/bölüm(\d+)\.html/,
            // Fallback pattern
            /bölüm(\d+)\.html/
        ];
        
        for (let i = 0; i < patterns.length; i++) {
            const match = decodedUrl.match(patterns[i]);
            if (match) {
                if (match.length >= 3) {
                    // Series adı ve chapter numarası var
                    let rawSeriesName = match[1].trim().toLowerCase();
                    
                    // Series mapping kullan
                    this.currentSeries = this.mapSeriesName(rawSeriesName);
                    this.currentChapter = parseInt(match[2]);
                    
                    console.log('✅ Pattern matched:', {
                        pattern: i,
                        rawSeries: rawSeriesName,
                        mappedSeries: this.currentSeries,
                        chapter: this.currentChapter
                    });
                    return;
                } else if (match.length >= 2) {
                    // Sadece chapter numarası
                    this.currentChapter = parseInt(match[1]);
                    // Series'i URL'den tahmin et
                    this.currentSeries = this.guessSeriesFromUrl(decodedUrl);
                    
                    console.log('✅ Chapter-only pattern matched:', {
                        chapter: this.currentChapter,
                        guessedSeries: this.currentSeries
                    });
                    return;
                }
            }
        }
        
        console.warn('⚠️ URL pattern tanınamadı, varsayılan değerler kullanılıyor');
    }
    
    mapSeriesName(rawName) {
        const normalized = rawName.toLowerCase().replace(/[\s-_]+/g, '');
        
        // Direct mapping
        if (this.seriesMapping[normalized]) {
            return this.seriesMapping[normalized];
        }
        
        // Partial matching
        for (const [key, value] of Object.entries(this.seriesMapping)) {
            if (normalized.includes(key) || key.includes(normalized)) {
                return value;
            }
        }
        
        // Fallback
        return normalized;
    }
    
    guessSeriesFromUrl(url) {
        const urlLower = url.toLowerCase();
        
        for (const [key, value] of Object.entries(this.seriesMapping)) {
            if (urlLower.includes(key)) {
                return value;
            }
        }
        
        return 'unknown';
    }
    
    async loadSeriesData() {
        try {
            const response = await fetch('/data/manhwalar.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.allSeriesData = await response.json();
            
            // Current series'ı bul
            this.seriesData = this.allSeriesData.find(series => 
                series.seriesId === this.currentSeries
            );
            
            if (!this.seriesData) {
                console.warn('⚠️ Series bulunamadı, alternatif arama yapılıyor...', this.currentSeries);
                
                // Alternative search
                this.seriesData = this.allSeriesData.find(series => 
                    series.title.toLowerCase().includes(this.currentSeries) ||
                    this.currentSeries.includes(series.seriesId.toLowerCase())
                );
            }
            
            if (this.seriesData) {
                console.log('📊 Series data bulundu:', {
                    title: this.seriesData.title,
                    id: this.seriesData.seriesId,
                    chapters: this.seriesData.availableChapters
                });
            } else {
                console.error('❌ Series data bulunamadı:', this.currentSeries);
            }
            
        } catch (error) {
            console.error('❌ Series data yüklenirken hata:', error);
        }
    }
    
    buildNavigationMap() {
        if (!this.seriesData || !this.seriesData.availableChapters) {
            console.warn('⚠️ Navigation map oluşturulamadı - eksik data');
            return;
        }
        
        const chapters = [...this.seriesData.availableChapters].sort((a, b) => a - b);
        
        this.navigationMap.clear();
        
        for (let i = 0; i < chapters.length; i++) {
            const current = chapters[i];
            const prev = i > 0 ? chapters[i - 1] : null;
            const next = i < chapters.length - 1 ? chapters[i + 1] : null;
            
            this.navigationMap.set(current, {
                current,
                previous: prev,
                next: next,
                index: i,
                total: chapters.length
            });
        }
        
        console.log('🗺️ Navigation map oluşturuldu:', {
            totalChapters: chapters.length,
            currentChapter: this.currentChapter,
            currentInfo: this.navigationMap.get(this.currentChapter)
        });
    }
    
    setupDynamicUI() {
        console.log('🎨 Setting up dynamic UI...');
        
        // Setup navigation buttons with REAL dynamic functionality
        this.setupDynamicNavigationButtons();
        
        // Setup dynamic chapter selector
        this.setupDynamicChapterSelector();
        
        // Update chapter title and info
        this.updateChapterInfo();
        
        // Setup progress indicator
        this.setupProgressIndicator();
        
        // Add navigation tooltips
        this.addNavigationTooltips();
        
        console.log('✅ Dynamic UI setup complete');
    }
    
    setupDynamicNavigationButtons() {
        console.log('🔘 Setting up DYNAMIC navigation buttons...');
        
        const navInfo = this.navigationMap.get(this.currentChapter);
        
        if (!navInfo) {
            console.warn('⚠️ Navigation info not found for chapter:', this.currentChapter);
            console.warn('⚠️ Available chapters in map:', Array.from(this.navigationMap.keys()));
            return;
        }
        
        console.log('📊 Navigation info for chapter', this.currentChapter, ':', navInfo);
        
        // Update ALL button pairs dynamically
        const buttonPairs = [
            ['navPrevBtn', 'navNextBtn'],
            ['navPrevBtn2', 'navNextBtn2']
        ];
        
        buttonPairs.forEach(([prevId, nextId], pairIndex) => {
            console.log(`🔘 Updating button pair ${pairIndex + 1}: ${prevId} + ${nextId}`);
            this.setupDynamicButtonPair(prevId, nextId, navInfo);
        });
        
        console.log('✅ Dynamic navigation buttons configured');
    }
    
    setupDynamicButtonPair(prevId, nextId, navInfo) {
        const prevBtn = document.getElementById(prevId);
        const nextBtn = document.getElementById(nextId);
        
        if (!prevBtn || !nextBtn) {
            console.warn(`⚠️ Buttons not found: ${prevId}, ${nextId}`);
            return;
        }
        
        // PREVIOUS BUTTON - Real manga site style
        if (navInfo.previous) {
            prevBtn.style.display = 'inline-flex';
            prevBtn.disabled = false;
            prevBtn.style.background = '#007bff';
            prevBtn.style.cursor = 'pointer';
            
            // Dynamic content with chapter info
            prevBtn.innerHTML = `
                <i class="fa-solid fa-chevron-left"></i> 
                <span class="nav-text">
                    <span class="nav-label">Önceki</span>
                    <span class="nav-chapter">Bölüm ${navInfo.previous}</span>
                </span>
            `;
            
            // Add click handler with loading state
            prevBtn.onclick = () => this.navigateWithAnimation(navInfo.previous, 'previous');
            
            // Add hover effects
            prevBtn.onmouseenter = () => {
                prevBtn.style.background = '#0056b3';
                prevBtn.style.transform = 'translateX(-3px)';
            };
            prevBtn.onmouseleave = () => {
                prevBtn.style.background = '#007bff';
                prevBtn.style.transform = 'translateX(0)';
            };
            
        } else {
            prevBtn.style.display = 'none';
            prevBtn.disabled = true;
        }
        
        // NEXT BUTTON - Real manga site style
        if (navInfo.next) {
            nextBtn.style.display = 'inline-flex';
            nextBtn.disabled = false;
            nextBtn.style.background = '#28a745';
            nextBtn.style.cursor = 'pointer';
            
            // Dynamic content with chapter info
            nextBtn.innerHTML = `
                <span class="nav-text">
                    <span class="nav-label">Sonraki</span>
                    <span class="nav-chapter">Bölüm ${navInfo.next}</span>
                </span>
                <i class="fa-solid fa-chevron-right"></i>
            `;
            
            // Add click handler with loading state
            nextBtn.onclick = () => this.navigateWithAnimation(navInfo.next, 'next');
            
            // Add hover effects
            nextBtn.onmouseenter = () => {
                nextBtn.style.background = '#1e7e34';
                nextBtn.style.transform = 'translateX(3px)';
            };
            nextBtn.onmouseleave = () => {
                nextBtn.style.background = '#28a745';
                nextBtn.style.transform = 'translateX(0)';
            };
            
        } else {
            nextBtn.style.display = 'none';
            nextBtn.disabled = true;
        }
        
        console.log(`🧭 Dynamic buttons setup for ${prevId}/${nextId}:`, {
            previous: navInfo.previous,
            next: navInfo.next,
            current: navInfo.current
        });
    }
    
    async navigateWithAnimation(targetChapter, direction) {
        if (this.isLoading) {
            console.log('🔄 Navigation already in progress...');
            return;
        }
        
        this.isLoading = true;
        
        try {
            // Show loading animation
            this.showNavigationLoading(direction);
            
            // Add page transition effect
            this.addPageTransition();
            
            // Build target URL
            const targetUrl = this.buildChapterUrl(targetChapter);
            
            console.log(`🚀 Navigating to Chapter ${targetChapter}:`, targetUrl);
            
            // Smooth navigation with loading
            await this.smoothNavigate(targetUrl);
            
        } catch (error) {
            console.error('❌ Navigation failed:', error);
            this.showNavigationError();
        } finally {
            this.isLoading = false;
        }
    }
    
    showNavigationLoading(direction) {
        // Add loading overlay
        const overlay = document.createElement('div');
        overlay.id = 'nav-loading-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(2px);
        `;
        
        overlay.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            ">
                <i class="fas fa-book-open fa-2x" style="color: #ff6f61; margin-bottom: 15px; animation: pulse 1.5s infinite;"></i>
                <h3 style="margin: 0 0 10px 0; color: #333;">Bölüm Yükleniyor...</h3>
                <p style="margin: 0; color: #666;">${direction === 'next' ? 'Sonraki' : 'Önceki'} bölüme geçiliyor</p>
                <div style="margin-top: 15px; height: 4px; background: #f0f0f0; border-radius: 2px; overflow: hidden;">
                    <div style="height: 100%; background: #ff6f61; width: 0; animation: loading-bar 2s ease-out forwards;"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            @keyframes loading-bar {
                0% { width: 0%; }
                100% { width: 100%; }
            }
        `;
        document.head.appendChild(style);
    }
    
    addPageTransition() {
        // Add smooth fade transition
        document.body.style.transition = 'opacity 0.3s ease';
        document.body.style.opacity = '0.7';
    }
    
    async smoothNavigate(url) {
        // Simulate loading time for smooth UX
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Navigate to new chapter
        window.location.href = url;
    }
    
    showNavigationError() {
        // Remove loading overlay
        const overlay = document.getElementById('nav-loading-overlay');
        if (overlay) overlay.remove();
        
        // Reset page opacity
        document.body.style.opacity = '1';
        
        // Show error notification
        this.showNotification('Navigation hatası! Lütfen tekrar deneyin.', 'error');
    }
    
    // Eski setupNavigationButtons ve setupButtonPair fonksiyonları kaldırıldı
    // Artık sadece setupDynamicNavigationButtons kullanılıyor
    
    setupDynamicChapterSelector() {
        const selector = document.getElementById('bolumSec');
        if (!selector || !this.seriesData) return;
        
        // Clear existing options
        selector.innerHTML = '';
        selector.disabled = false;
        
        // Add loading state
        selector.style.background = 'linear-gradient(90deg, #232323 60%, #ff6f61 100%)';
        
        // Get chapters and sort
        const chapters = [...this.seriesData.availableChapters].sort((a, b) => a - b);
        
        // Add chapters with enhanced styling
        chapters.forEach(chapterNum => {
            const option = document.createElement('option');
            option.value = chapterNum;
            
            // Enhanced option text
            const isRead = this.isChapterRead(chapterNum);
            const isCurrent = chapterNum === this.currentChapter;
            
            if (isCurrent) {
                option.textContent = `📖 Bölüm ${chapterNum} (Şu an)`;
                option.selected = true;
            } else if (isRead) {
                option.textContent = `✓ Bölüm ${chapterNum} (Okundu)`;
            } else {
                option.textContent = `📄 Bölüm ${chapterNum}`;
            }
            
            selector.appendChild(option);
        });
        
        // Add change handler with animation
        selector.onchange = (e) => this.handleChapterSelectorChange(e);
        
        // Add enhanced styling
        selector.style.transition = 'all 0.3s ease';
        
        console.log('📋 Dynamic chapter selector ready:', chapters.length + ' chapters');
    }
    
    handleChapterSelectorChange(e) {
        const selectedChapter = parseInt(e.target.value);
        
        if (selectedChapter && selectedChapter !== this.currentChapter) {
            // Add selection animation
            e.target.style.transform = 'scale(1.05)';
            setTimeout(() => {
                e.target.style.transform = 'scale(1)';
            }, 150);
            
            // Navigate with animation
            this.navigateWithAnimation(selectedChapter, 'selector');
        }
    }
    
    updateChapterInfo() {
        // Update chapter title
        const titleElement = document.getElementById('chapterTitle');
        if (titleElement && this.currentChapter) {
            const navInfo = this.navigationMap.get(this.currentChapter);
            titleElement.innerHTML = `
                <span class="chapter-number">Bölüm ${this.currentChapter}</span>
                ${navInfo ? `<span class="chapter-progress">(${navInfo.index + 1}/${navInfo.total})</span>` : ''}
            `;
        }
        
        // Update page title
        if (this.seriesData) {
            document.title = `${this.seriesData.title} - Bölüm ${this.currentChapter} | ToonNeko`;
        }
    }
    
    setupProgressIndicator() {
        const navInfo = this.navigationMap.get(this.currentChapter);
        if (!navInfo) return;
        
        // Create progress bar if not exists
        let progressBar = document.getElementById('chapter-progress-bar');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.id = 'chapter-progress-bar';
            progressBar.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 3px;
                background: rgba(255, 111, 97, 0.2);
                z-index: 1000;
            `;
            
            const progressFill = document.createElement('div');
            progressFill.style.cssText = `
                height: 100%;
                background: linear-gradient(90deg, #ff6f61, #ff8a50);
                transition: width 0.3s ease;
                width: ${((navInfo.index + 1) / navInfo.total) * 100}%;
            `;
            
            progressBar.appendChild(progressFill);
            document.body.appendChild(progressBar);
        }
    }
    
    addNavigationTooltips() {
        const buttons = ['navPrevBtn', 'navNextBtn', 'navPrevBtn2', 'navNextBtn2'];
        
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn && !btn.disabled) {
                const isNext = id.includes('Next');
                const navInfo = this.navigationMap.get(this.currentChapter);
                
                if (navInfo) {
                    const targetChapter = isNext ? navInfo.next : navInfo.previous;
                    if (targetChapter) {
                        btn.title = `${isNext ? 'Sonraki' : 'Önceki'} bölüme git (Bölüm ${targetChapter})`;
                    }
                }
            }
        });
    }
    
    addKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Ignore if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            const navInfo = this.navigationMap.get(this.currentChapter);
            if (!navInfo) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (navInfo.previous) {
                        e.preventDefault();
                        this.navigateWithAnimation(navInfo.previous, 'previous');
                    }
                    break;
                    
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (navInfo.next) {
                        e.preventDefault();
                        this.navigateWithAnimation(navInfo.next, 'next');
                    }
                    break;
                    
                case 'Home':
                    e.preventDefault();
                    const firstChapter = Math.min(...this.seriesData.availableChapters);
                    this.navigateWithAnimation(firstChapter, 'first');
                    break;
                    
                case 'End':
                    e.preventDefault();
                    const lastChapter = Math.max(...this.seriesData.availableChapters);
                    this.navigateWithAnimation(lastChapter, 'last');
                    break;
            }
        });
        
        console.log('⌨️ Keyboard navigation ready: ←/→ arrows, A/D keys, Home/End');
    }
    
    addSwipeNavigation() {
        let startX = 0;
        let startY = 0;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const deltaX = startX - endX;
            const deltaY = startY - endY;
            
            // Check if it's a horizontal swipe (not vertical scroll)
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                const navInfo = this.navigationMap.get(this.currentChapter);
                if (!navInfo) return;
                
                if (deltaX > 0 && navInfo.next) {
                    // Swipe left = next chapter
                    this.navigateWithAnimation(navInfo.next, 'next');
                } else if (deltaX < 0 && navInfo.previous) {
                    // Swipe right = previous chapter
                    this.navigateWithAnimation(navInfo.previous, 'previous');
                }
            }
            
            startX = 0;
            startY = 0;
        });
        
        console.log('📱 Swipe navigation ready: swipe left/right to navigate');
    }
    
    buildChapterUrl(chapterNumber) {
        if (!this.seriesData) return '#';
        
        // Try to get URL from chapterDetails
        if (this.seriesData.chapterDetails) {
            const chapterDetail = this.seriesData.chapterDetails.find(c => c.number === chapterNumber);
            if (chapterDetail) {
                return '/' + chapterDetail.url;
            }
        }
        
        // Fallback: build URL from current path
        const currentPath = window.location.pathname;
        const basePath = currentPath.replace(/bölüm\d+\.html$/, '');
        return `${basePath}bölüm${chapterNumber}.html`;
    }
    
    isChapterRead(chapterNumber) {
        // Check if chapter is in reading history (implement based on your system)
        const readChapters = JSON.parse(localStorage.getItem('readChapters') || '{}');
        return readChapters[this.currentSeries]?.includes(chapterNumber) || false;
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#dc3545' : '#28a745'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Public API and utility methods
    getCurrentChapter() {
        return this.currentChapter;
    }
    
    getSeriesInfo() {
        return this.seriesData;
    }
    
    getNavigationInfo() {
        return this.navigationMap.get(this.currentChapter);
    }
    
    showKeyboardHint() {
        const hint = document.getElementById('keyboardHint');
        if (hint) {
            hint.classList.add('show');
            setTimeout(() => {
                hint.classList.remove('show');
            }, 3000);
        }
    }
    
    // Show keyboard hint on first interaction
    setupKeyboardHint() {
        let hintShown = false;
        
        const showHintOnce = () => {
            if (!hintShown) {
                this.showKeyboardHint();
                hintShown = true;
            }
        };
        
        // Show hint on first mouse move or scroll
        document.addEventListener('mousemove', showHintOnce, { once: true });
        document.addEventListener('scroll', showHintOnce, { once: true });
        
        // Show hint after 2 seconds if no interaction
        setTimeout(showHintOnce, 2000);
    }
}

// Global instance
window.UniversalNavigation = UniversalNavigation;

// Auto-start
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('/chapters/') && window.location.pathname.includes('bölüm')) {
        console.log('🎯 Chapter page detected, starting Universal Navigation...');
        window.universalNav = new UniversalNavigation();
    }
});
