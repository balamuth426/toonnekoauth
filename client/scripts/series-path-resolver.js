/**
 * Series Path Resolver
 * Seri ID'sine göre dinamik olarak doğru seri sayfası path'ini bulur
 */

class SeriesPathResolver {
    constructor() {
        this.seriesData = null;
        this.init();
    }

    async init() {
        try {
            await this.loadSeriesData();
        } catch (error) {
            console.error('SeriesPathResolver init error:', error);
        }
    }

    async loadSeriesData() {
        try {
            // Path'i dinamik olarak belirle - chapter sayfalarından da çalışsın
            let dataPath = 'data/manhwalar.json';
            
            // Eğer chapter sayfasındaysak relative path kullan
            if (window.location.pathname.includes('/chapters/')) {
                dataPath = '../../data/manhwalar.json';
            } else if (window.location.pathname.includes('/series/')) {
                dataPath = '../../data/manhwalar.json';
            }
            
            const response = await fetch(dataPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.seriesData = await response.json();
            console.log('SeriesPathResolver: Series data loaded successfully');
        } catch (error) {
            console.error('SeriesPathResolver: Failed to load series data:', error);
            // Fallback: boş veri ile devam et
            this.seriesData = [];
        }
    }

    /**
     * Seri ID'sine göre seri sayfası path'ini döndürür
     * @param {string} seriesId - Seri ID (örn: 'damnreincarnation', 'blackcrow')
     * @returns {string} Seri sayfası path'i veya fallback path
     */
    getSeriesPagePath(seriesId) {
        if (!this.seriesData || !seriesId) {
            console.warn('SeriesPathResolver: No data or seriesId provided');
            return this.getFallbackPath(seriesId);
        }

        // Seri datasında ilgili seriyi bul
        const series = this.seriesData.find(s => s.seriesId === seriesId);
        
        if (series && series.link) {
            // Eğer link relative path ise başına /client/ ekle
            let path = series.link;
            
            if (!path.startsWith('/')) {
                path = `/client/${path}`;
            } else if (!path.startsWith('/client/')) {
                path = `/client${path}`;
            }
            
            return path;
        }

        console.warn(`SeriesPathResolver: No series found for ID: ${seriesId}, using fallback`);
        return this.getFallbackPath(seriesId);
    }

    /**
     * Fallback path oluşturur
     * @param {string} seriesId 
     * @returns {string}
     */
    getFallbackPath(seriesId) {
        if (!seriesId) return '/client/';
        
        // Bilinen seriler için manuel fallback
        const knownSeries = {
            'damnreincarnation': '/client/series/damnreincarnation/damnreincarnationseri.html',
            'blackcrow': '/client/series/blackcrow/blackcrowseri.html',
            'nanomachine': '/client/series/nanomachine/nanomachineseri.html',
            'omniscientreader': '/client/series/omniscientreader/omniscientreaderseri.html',
            'arcanesniper': '/client/series/arcanesniper/arcanesniperseri.html'
        };

        return knownSeries[seriesId] || `/client/series/${seriesId}/${seriesId}seri.html`;
    }

    /**
     * Chapter path'inden seri ID'sini çıkarır
     * @param {string} chapterPath - Chapter dosya path'i
     * @returns {string|null} Seri ID
     */
    extractSeriesIdFromPath(chapterPath = '') {
        // URL'den veya path'den seri ID'sini çıkar
        const path = chapterPath || window.location.pathname;
        
        // Known patterns - Arcane Sniper eklendi
        if (path.includes('damn') || path.includes('reincarnation')) return 'damnreincarnation';
        if (path.includes('blackcrow') || path.includes('black') || path.includes('crow')) return 'blackcrow';
        if (path.includes('nanomachine') || path.includes('nano')) return 'nanomachine';
        if (path.includes('omniscient') || path.includes('reader')) return 'omniscientreader';
        if (path.includes('arcane') || path.includes('sniper')) {
            return 'arcanesniper';
        }
        
        // Generic extraction from folder name - Regex'i düzelt
        const folderMatch = path.match(/chapters\/([^\/]+?)(?:\s+chapters?)?\//) || path.match(/chapters\/([^\/\s]+)/);
        if (folderMatch) {
            let folderName = folderMatch[1].toLowerCase();
            // Clean up folder name to get series ID
            folderName = folderName.replace(/\s+chapters?/g, '').replace(/\s+/g, '');
            return folderName;
        }

        return null;
    }

    /**
     * Şu anki sayfadan seri ID'sini tespit edip seri sayfası path'ini döndürür
     * @returns {string} Seri sayfası path'i
     */
    getCurrentSeriesPagePath() {
        const seriesId = this.extractSeriesIdFromPath();
        return this.getSeriesPagePath(seriesId);
    }

    /**
     * Info butonlarını dinamik olarak günceller
     */
    updateInfoButtons() {
        const infoButtons = document.querySelectorAll('.info-btn, .dynamic-series-link, a[title*="Seri"], a[href*="series"]');
        const seriesPath = this.getCurrentSeriesPagePath();
        
        infoButtons.forEach(button => {
            const oldHref = button.href || button.getAttribute('href');
            button.href = seriesPath;
            console.log(`Updated info button: ${oldHref} → ${seriesPath}`);
        });
        
        console.log(`Updated ${infoButtons.length} info buttons to: ${seriesPath}`);
    }

    /**
     * Test fonksiyonu - sistem düzgün çalışıyor mu kontrol eder
     */
    testSeriesPathResolution() {
        console.log('=== Series Path Resolver Test ===');
        
        // Test cases
        const testCases = [
            { seriesId: 'damnreincarnation', expected: '/client/series/damnreincarnation/damnreincarnationseri.html' },
            { seriesId: 'blackcrow', expected: '/client/series/blackcrow/blackcrowseri.html' },
            { seriesId: 'nanomachine', expected: '/client/series/nanomachine/nanomachineseri.html' },
            { seriesId: 'omniscientreader', expected: '/client/series/omniscientreader/omniscientreaderseri.html' }
        ];

        testCases.forEach(testCase => {
            const result = this.getSeriesPagePath(testCase.seriesId);
            const success = result.includes(testCase.seriesId);
            console.log(`Test ${testCase.seriesId}: ${success ? '✅' : '❌'} - ${result}`);
        });

        // Current page test
        const currentPath = this.getCurrentSeriesPagePath();
        console.log(`Current page series path: ${currentPath}`);
        
        console.log('=== End Test ===');
    }
}

// Global instance oluştur
window.seriesPathResolver = new SeriesPathResolver();

// DOM yüklendiğinde info butonlarını güncelle
document.addEventListener('DOMContentLoaded', function() {
    // SeriesPathResolver'ın yüklenmesini bekle
    setTimeout(() => {
        if (window.seriesPathResolver) {
            window.seriesPathResolver.updateInfoButtons();
            
            // Debug mode'da test çalıştır
            if (window.location.search.includes('debug=true')) {
                window.seriesPathResolver.testSeriesPathResolution();
            }
        }
    }, 1000);
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SeriesPathResolver;
}
