const fs = require('fs');
const path = require('path');

// Kalan eski kodları temizleyen gelişmiş script
function deepCleanChapterFiles() {
    const chaptersDir = 'client/chapters';
    const seriesDirs = fs.readdirSync(chaptersDir).filter(dir => 
        fs.statSync(path.join(chaptersDir, dir)).isDirectory()
    );

    let totalCleaned = 0;

    for (const seriesDir of seriesDirs) {
        const seriesPath = path.join(chaptersDir, seriesDir);
        const chapterFiles = fs.readdirSync(seriesPath).filter(file => file.endsWith('.html'));
        
        for (const chapterFile of chapterFiles) {
            const filePath = path.join(seriesPath, chapterFile);
            let content = fs.readFileSync(filePath, 'utf8');
            const originalContent = content;

            console.log(`🔧 Temizleniyor: ${seriesDir}/${chapterFile}`);

            // 1. Eski navigation fonksiyonlarını kaldır
            content = content.replace(
                /function updateNavigationButtons\(\)[\s\S]*?\n\s*\}/g,
                ''
            );

            content = content.replace(
                /function showPage\(pageNum\)[\s\S]*?\n\s*\}/g,
                ''
            );

            // 2. Eski değişkenleri kaldır
            content = content.replace(
                /let currentReadingMode = ['"]list['"];.*?\n/g,
                ''
            );
            content = content.replace(
                /let currentPage = \d+;.*?\n/g,
                ''
            );
            content = content.replace(
                /const totalPages = \d+;.*?\n/g,
                ''
            );

            // 3. Navigation buton çağrılarını kaldır
            content = content.replace(
                /updateNavigationButtons\(\);?\s*\n?/g,
                ''
            );

            // 4. Eski event listener'ları temizle
            content = content.replace(
                /\/\/ Sayfa yüklendiğinde navigation'ı başlat[\s\S]*?console\.log\('✅.*?'\);[\s\S]*?\}\);/g,
                ''
            );

            // 5. Boş script tag'leri kaldır
            content = content.replace(
                /<script>\s*<\/script>/g,
                ''
            );

            // 6. Fazla boşlukları temizle
            content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

            // 7. Duplicate inline CSS'leri temizle
            const cssBlocks = content.match(/<style>[\s\S]*?<\/style>/g) || [];
            if (cssBlocks.length > 1) {
                // İlkini sakla, diğerlerini sil
                const firstCss = cssBlocks[0];
                content = content.replace(/<style>[\s\S]*?<\/style>/g, '');
                content = content.replace('</head>', `${firstCss}\n</head>`);
            }

            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                totalCleaned++;
                console.log(`   ✅ Temizlendi`);
            } else {
                console.log(`   ⏭️ Değişiklik yok`);
            }
        }
    }

    console.log(`\n📊 Toplam temizlenen dosya: ${totalCleaned}`);
}

// Tekrarlanan fonksiyonları script dosyasına taşı
function createCommonChapterScript() {
    const commonFunctions = `
// Ortak Chapter Fonksiyonları
// Tüm chapter dosyalarında kullanılan ortak fonksiyonlar

class CommonChapterFunctions {
    static showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = \`notification \${type}\`;
        notification.innerHTML = \`
            <div class="notification-content">
                <i class="fas \${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>\${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        \`;
        
        document.body.appendChild(notification);
        
        // Animasyon
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Otomatik kaldırma
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    static updateImageSelector() {
        const resimListesi = document.getElementById('resimListesi');
        if (resimListesi) {
            resimListesi.addEventListener('change', function() {
                const selectedPage = parseInt(this.value);
                const images = document.querySelectorAll('.okuma-img');
                
                images.forEach((img, index) => {
                    img.style.display = index + 1 === selectedPage ? 'block' : 'none';
                });
            });
        }
    }

    static handleSwipe() {
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;

        document.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', function(e) {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            // Yatay swipe'ı kontrol et
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    // Sağa swipe - önceki bölüm
                    const prevBtn = document.getElementById('navPrevBtn');
                    if (prevBtn && prevBtn.style.display !== 'none') {
                        prevBtn.click();
                    }
                } else {
                    // Sola swipe - sonraki bölüm
                    const nextBtn = document.getElementById('navNextBtn');
                    if (nextBtn && nextBtn.style.display !== 'none') {
                        nextBtn.click();
                    }
                }
            }
        });
    }

    static checkCompletionSuggestions() {
        // Bölüm tamamlandığında öneri sistemi
        setTimeout(() => {
            const suggestions = [
                { title: 'Benzer Seri Önerisi', action: 'benzer-seri' },
                { title: 'Favorilere Ekle', action: 'favorilere-ekle' },
                { title: 'Yorum Yap', action: 'yorum-yap' }
            ];
            
            const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
            this.showCompletionSuggestion(randomSuggestion);
        }, 3000);
    }

    static showCompletionSuggestion(suggestion) {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'completion-suggestion';
        suggestionDiv.innerHTML = \`
            <div class="suggestion-content">
                <h4>\${suggestion.title}</h4>
                <button onclick="this.parentElement.parentElement.remove()">Kapat</button>
            </div>
        \`;
        
        document.body.appendChild(suggestionDiv);
        
        setTimeout(() => {
            suggestionDiv.remove();
        }, 5000);
    }

    static init() {
        // Ortak fonksiyonları başlat
        this.updateImageSelector();
        this.handleSwipe();
        this.checkCompletionSuggestions();
    }
}

// Sayfa yüklendiğinde ortak fonksiyonları başlat
document.addEventListener('DOMContentLoaded', function() {
    CommonChapterFunctions.init();
});

// Global erişim için
window.CommonChapterFunctions = CommonChapterFunctions;
`;

    fs.writeFileSync('client/scripts/common-chapter-functions.js', commonFunctions, 'utf8');
    console.log('✅ Ortak chapter fonksiyonları scripts/common-chapter-functions.js dosyasına taşındı');
}

console.log('🧹 Gelişmiş kod temizliği başlatılıyor...\n');

// Temizleme işlemlerini çalıştır
deepCleanChapterFiles();
createCommonChapterScript();

console.log('\n✅ Gelişmiş temizlik tamamlandı!');
