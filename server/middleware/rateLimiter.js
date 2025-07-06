const rateLimit = require('express-rate-limit');

// Admin login rate limiting
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5, // 5 deneme hakkı
  message: {
    error: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // 100 request per IP
  message: {
    error: 'Çok fazla istek gönderildi. 15 dakika sonra tekrar deneyin.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiting for sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 3, // 3 deneme hakkı
  message: {
    error: 'Güvenlik sınırı aşıldı. 1 saat sonra tekrar deneyin.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { 
  adminLoginLimiter, 
  apiLimiter, 
  strictLimiter 
};
