// Force refresh and clear cache
console.log('🔄 Force cache clear ve refresh...');

// Service Worker'ı temizle
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
            registration.unregister();
        }
    });
}

// Cache'i temizle
if ('caches' in window) {
    caches.keys().then(function(names) {
        for (let name of names) {
            caches.delete(name);
        }
    });
}

// LocalStorage'ı temizle (sadece navigation ile ilgili)
Object.keys(localStorage).forEach(key => {
    if (key.includes('navigation') || key.includes('chapter')) {
        localStorage.removeItem(key);
    }
});

// Sayfa reload
setTimeout(() => {
    window.location.reload(true);
}, 1000);
