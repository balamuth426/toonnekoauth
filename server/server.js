const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Load environment variables with explicit path
dotenv.config({ path: path.join(__dirname, '.env') });

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/toonnekoauth', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB bağlantısı başarılı: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
};

// Veritabanı bağlantısını başlat
connectDB();

const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');
const profileRoute = require('./routes/profile');
const progressRoutes = require('./routes/progress');
const ratingRoutes = require('./routes/ratings');
const readingRoutes = require('./routes/reading');
const favoritesRoutes = require('./routes/favorites');
const commentsRoutes = require('./routes/comments');
const chaptersRoutes = require('./routes/chapters');
const manhwaRoutes = require('./routes/manhwa');
const adminRoutes = require('./routes/admin');
const moderatorRoutes = require('./routes/moderator');
const reportsRoutes = require('./routes/reports');
const announcementsRoutes = require('./routes/announcements');
const imageProxyRoutes = require('./routes/image-proxy');
const contactRoutes = require('./routes/contact');
const statsRoutes = require('./routes/stats');
const healthRoutes = require('./routes/health');
const app = express();

// CORS ayarları - production için sadece Netlify ve Render domainlerine izin ver
const allowedOrigins = [
  'https://toonneko.netlify.app',
  'https://www.toonneko.netlify.app',
  'https://toonnekoauth-api.onrender.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Preflight (OPTIONS) istekleri için CORS header'ı döndür
app.options('*', cors(corsOptions));

// Request logging middleware - En üste ekle
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Global debug middleware - hangi middleware'lerin çalıştığını göster
app.use((req, res, next) => {
  console.log('🔍 Global middleware called for:', req.path);
  console.log('🔍 Headers:', req.headers['authorization'] ? 'Has auth header' : 'No auth header');
  next();
});

// Manual CORS headers for extra compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express.json());

// Test endpoint - en üstte
app.get('/test-stats', (req, res) => {
  console.log('🧪 Test stats endpoint called');
  res.json({ message: 'Test stats works!' });
});

// API routes
app.use('/api/stats', statsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/reading', readingRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/profile', profileRoute);
app.use('/api/comments', commentsRoutes);
app.use('/api/chapters', chaptersRoutes);
app.use('/api/manhwa', manhwaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/moderator', moderatorRoutes);
app.use('/api/image', imageProxyRoutes);
app.use('/api/reports', reportsRoutes);
// Debug middleware for announcements
app.use('/api/announcements', (req, res, next) => {
  console.log('🔍 Announcements route middleware - Request path:', req.path);
  console.log('🔍 Full URL:', req.url);
  console.log('🔍 Method:', req.method);
  next();
});

app.use('/api/announcements', announcementsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/image', imageProxyRoutes);
app.use('/api', healthRoutes); // Health check routes

// Simple test route
app.get('/api/simple-test', (req, res) => {
  console.log('🧪 Simple test route called');
  res.json({ message: 'Simple test works', timestamp: new Date() });
});

// Static files middleware - API route'lardan SONRA
const clientPath = path.join(__dirname, '../client');
console.log('Static files path:', clientPath);

// Chapter routing - özel routing için
app.get('/chapters/:series/:chapter', (req, res, next) => {
  const { series, chapter } = req.params;
  console.log('🔍 Chapter request:', { series, chapter });
  
  // Build file path
  const chapterFilePath = path.join(clientPath, 'chapters', `${series} chapters`, chapter);
  
  // File exists check
  if (require('fs').existsSync(chapterFilePath)) {
    console.log('✅ Chapter file found:', chapterFilePath);
    res.sendFile(chapterFilePath);
  } else {
    console.log('❌ Chapter file not found:', chapterFilePath);
    next(); // Continue to static middleware
  }
});

// Fallback for encoded URLs
app.get('/chapters/*', (req, res, next) => {
  const requestedPath = req.path;
  console.log('🔍 Fallback chapter request:', requestedPath);
  
  // Decode URL encoding
  const decodedPath = decodeURIComponent(requestedPath);
  const fullPath = path.join(clientPath, decodedPath);
  
  // File exists check
  if (require('fs').existsSync(fullPath)) {
    console.log('✅ Chapter file found:', fullPath);
    res.sendFile(fullPath);
  } else {
    console.log('❌ Chapter file not found:', fullPath);
    next(); // Continue to static middleware
  }
});

// JavaScript dosyaları için no-cache headers
app.use('/scripts', express.static(path.join(clientPath, 'scripts'), {
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Diğer static dosyalar için normal cache
app.use(express.static(clientPath));

// DATA KLASÖRÜNÜ DE STATİK SUN
const dataPath = path.join(__dirname, '../client/data');
console.log('Static data path:', dataPath);
app.use('/client/data', express.static(dataPath));
app.use('/data', express.static(dataPath)); // Direct /data path eklendi

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Express Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

console.log('Favorites route loaded successfully');
console.log('Available routes:');
console.log('- /api/auth');
console.log('- /api/progress');
console.log('- /api/ratings');
console.log('- /api/reading');
console.log('- /api/favorites');
console.log('- /api/profile');
console.log('- /api/comments');
console.log('- /api/chapters');
console.log('- /api/manhwa');
console.log('- /api/admin');
console.log('- /api/moderator');
console.log('- /api/image');
console.log('- /api/reports');
console.log('- /api/announcements');
console.log('- /api/contact');
console.log('- /api/stats');

const PORT = process.env.PORT || 5506;

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
  console.log('🚀 ToonNeko Server çalışıyor!');
  console.log('📁 Static dosyalar:', path.join(__dirname, '../client'));
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
});
