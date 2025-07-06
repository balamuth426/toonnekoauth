// API Configuration
const CONFIG = {
    // Development
    development: {
        API_BASE: 'https://toonnekoauth-api.onrender.com/api'
    },
    
    // Production - Deploy edildiğinde güncellenecek
    production: {
        API_BASE: 'https://toonnekoauth-api.onrender.com/api'  // Render URL'inizi buraya yazın
    }
};

// Ortamı otomatik belirle
const ENVIRONMENT = window.location.hostname.includes('localhost') || 
                   window.location.hostname.includes('127.0.0.1') || 
                   window.location.protocol === 'file:' 
                   ? 'development' : 'production';

// Aktif konfigürasyonu export et
const ACTIVE_CONFIG = CONFIG[ENVIRONMENT];

// Global olarak kullanılabilir yap
window.APP_CONFIG = ACTIVE_CONFIG;

// Debug bilgisi
console.log('Environment:', ENVIRONMENT);
console.log('API Base:', ACTIVE_CONFIG.API_BASE);
