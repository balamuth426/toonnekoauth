// Cache Buster - Güncel timestamp ile cache'i bypass et
const timestamp = new Date().getTime();

// CSS dosyalarını dinamik yükle
function loadCSS(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${href}?v=${timestamp}`;
    document.head.appendChild(link);
}

// Script dosyalarını dinamik yükle  
function loadScript(src, callback) {
    const script = document.createElement('script');
    script.src = `${src}?v=${timestamp}`;
    script.defer = true;
    if (callback) script.onload = callback;
    document.head.appendChild(script);
}

// Navigation sistemini force reload
console.log('🔄 Cache busting with timestamp:', timestamp);

// Dynamic navigation CSS ve JS'i tekrar yükle
loadCSS('../../styles/dynamic-navigation.css');
loadScript('../../scripts/dynamic-navigation.js', () => {
    console.log('✅ Dynamic navigation script reloaded');
});
