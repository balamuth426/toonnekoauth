
// Ortak Chapter Fonksiyonları
// Tüm chapter dosyalarında kullanılan ortak fonksiyonlar

class CommonChapterFunctions {
    static showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
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
        suggestionDiv.innerHTML = `
            <div class="suggestion-content">
                <h4>${suggestion.title}</h4>
                <button onclick="this.parentElement.parentElement.remove()">Kapat</button>
            </div>
        `;
        
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
