// Force Clear All Cache and Service Workers
console.log('🧹 Tüm cache ve service worker temizleniyor...');

// Service Worker'ları temizle
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
            registration.unregister().then(function(boolean) {
                console.log('🗑️ Service Worker temizlendi:', boolean);
            });
        }
    });
}

// Cache Storage'ı temizle
if ('caches' in window) {
    caches.keys().then(function(names) {
        for (let name of names) {
            caches.delete(name).then(function(success) {
                console.log('🗑️ Cache temizlendi:', name, success);
            });
        }
    });
}

// LocalStorage navigation verilerini temizle
Object.keys(localStorage).forEach(key => {
    if (key.includes('navigation') || key.includes('chapter') || key.includes('nav')) {
        localStorage.removeItem(key);
        console.log('🗑️ LocalStorage temizlendi:', key);
    }
});

// SessionStorage'ı da temizle
Object.keys(sessionStorage).forEach(key => {
    if (key.includes('navigation') || key.includes('chapter') || key.includes('nav')) {
        sessionStorage.removeItem(key);
        console.log('🗑️ SessionStorage temizlendi:', key);
    }
});

// Browser'a hard reload yaptır
setTimeout(() => {
    console.log('🔄 Hard reload yapılıyor...');
    window.location.reload(true);
}, 2000);
