/**
 * Seri sayfası için dinamik içerik yükleyici
 * manhwalar.json'dan güncel veriyi çekip sayfayı günceller
 */

class SeriesPageLoader {
    constructor(seriesId) {
        this.seriesId = seriesId;
        this.seriesData = null;
        this.init();
    }

    async init() {
        try {
            console.log('SeriesPageLoader başlatılıyor, seriesId:', this.seriesId);
            await this.loadSeriesData();
            // DOM'un tam yüklenmesini bekle
            setTimeout(() => {
                console.log('DOM yüklendi, sayfa içeriği güncelleniyor...');
                this.updatePageContent();
            }, 100);
        } catch (error) {
            console.error('Seri verisi yüklenirken hata:', error);
        }
    }

    async loadSeriesData() {
        try {
            const response = await fetch('../../data/manhwalar.json');
            const allSeries = await response.json();
            
            this.seriesData = allSeries.find(series => series.seriesId === this.seriesId);
            
            if (!this.seriesData) {
                throw new Error(`Seri bulunamadı: ${this.seriesId}`);
            }
            
            console.log('Seri verisi yüklendi:', this.seriesData);
        } catch (error) {
            console.error('manhwalar.json yüklenirken hata:', error);
            throw error;
        }
    }

    updatePageContent() {
        if (!this.seriesData) return;

        // Sayfa başlığını güncelle
        document.title = this.seriesData.title;

        // Kapak görselini güncelle
        const coverImage = document.querySelector('.cover-info-wrapper img.cover');
        if (coverImage && this.seriesData.image) {
            coverImage.src = this.seriesData.image;
            coverImage.alt = this.seriesData.title + ' Kapak';
        }

        // Başlığı güncelle
        const titleElement = document.querySelector('.title');
        if (titleElement) {
            titleElement.textContent = this.seriesData.title;
        }

        // Bilgi kartındaki verileri güncelle
        this.updateInfoCard();

        // Özeti güncelle
        this.updateSummary();

        // Favori butonunu güncelle
        this.updateFavoriteButton();

        // Bölüm butonlarını güncelle
        this.updateChapterButtons();
    }

    updateInfoCard() {
        const infoRows = document.querySelectorAll('.info-row');
        
        infoRows.forEach(row => {
            const label = row.querySelector('.label').textContent.trim();
            const valueElement = row.querySelector('.value');
            
            switch(label) {
                case 'Durum:':
                    if (this.seriesData.status) {
                        valueElement.textContent = this.seriesData.status;
                    }
                    break;
                    
                case 'Tür:':
                    if (this.seriesData.genres && Array.isArray(this.seriesData.genres)) {
                        valueElement.textContent = this.seriesData.genres.join(', ');
                    }
                    break;
                    
                case 'Yazar:':
                    if (this.seriesData.author) {
                        valueElement.textContent = this.seriesData.author;
                    }
                    break;
                    
                case 'Çizer:':
                    if (this.seriesData.artist) {
                        valueElement.textContent = this.seriesData.artist;
                    }
                    break;
                    
                case 'Yayıncı:':
                    if (this.seriesData.publisher) {
                        valueElement.textContent = this.seriesData.publisher;
                    }
                    break;
            }
        });
    }

    updateSummary() {
        const summaryElement = document.querySelector('.summary-card p');
        if (summaryElement && this.seriesData.summary) {
            summaryElement.textContent = this.seriesData.summary;
        }
    }

    updateFavoriteButton() {
        const favoriteBtn = document.getElementById('favorite-btn');
        if (favoriteBtn) {
            favoriteBtn.setAttribute('data-series', this.seriesData.title);
        }
    }

    updateChapterButtons() {
        console.log('updateChapterButtons çağrıldı');
        console.log('availableChapters:', this.seriesData?.availableChapters);
        
        if (!this.seriesData.availableChapters || this.seriesData.availableChapters.length === 0) {
            console.log('Bölüm verisi yok, butonlar güncellenmedi');
            return;
        }

        const buttonsContainer = document.querySelector('.buttons');
        console.log('Butonlar container bulundu:', !!buttonsContainer);
        
        if (buttonsContainer) {
            // İlk bölüm ve son bölüm
            const firstChapter = Math.min(...this.seriesData.availableChapters);
            const lastChapter = Math.max(...this.seriesData.availableChapters);

            // Bölüm URL'lerini oluştur
            const firstChapterUrl = this.getChapterUrl(firstChapter);
            const lastChapterUrl = this.getChapterUrl(lastChapter);

            console.log('İlk bölüm:', firstChapter, 'URL:', firstChapterUrl);
            console.log('Son bölüm:', lastChapter, 'URL:', lastChapterUrl);

            // Butonları yeniden oluştur - tutarlı stil ile
            buttonsContainer.innerHTML = `
                <button id="first-chapter-btn" onclick="window.location.href='${firstChapterUrl}'" style="cursor: pointer;">
                    İlk Bölüm (${firstChapter})
                </button>
                <button id="last-chapter-btn" onclick="window.location.href='${lastChapterUrl}'" style="cursor: pointer;">
                    Son Bölüm (${lastChapter})
                </button>
            `;
            
            console.log(`Bölüm butonları yeniden oluşturuldu: İlk=${firstChapter}, Son=${lastChapter}`);
        } else {
            console.log('Butonlar container bulunamadı');
        }
    }

    getChapterUrl(chapterNumber) {
        // manhwalar.json'daki chapterDetails kullan
        if (this.seriesData.chapterDetails) {
            const chapterDetail = this.seriesData.chapterDetails.find(ch => ch.number === chapterNumber);
            if (chapterDetail) {
                return `../../${chapterDetail.url}`;
            }
        }

        // Fallback: Genel format kullan
        const seriesFolder = this.getSeriesFolderName();
        return `../../chapters/${seriesFolder}/bölüm${chapterNumber}.html`;
    }

    getSeriesFolderName() {
        // SeriesId'den klasör adını türet
        const folderMap = {
            'blackcrow': 'blackcrow chapters',
            'nanomachine': 'nanomachine chapters',
            'sololeveling': 'solo leveling chapters',
            'omniscientreader': 'omniscient reader chapters',
            'damnreincarnation': 'damn reincarnation chapters',
            'martialgodregressedtolevel2': 'martial god regressed to level 2 chapters'
        };
        
        return folderMap[this.seriesId] || `${this.seriesId} chapters`;
    }

    // Seri verisini döndür (diğer scriptler için)
    getSeriesData() {
        return this.seriesData;
    }
}

// Global olarak erişilebilir hale getir
window.SeriesPageLoader = SeriesPageLoader;
