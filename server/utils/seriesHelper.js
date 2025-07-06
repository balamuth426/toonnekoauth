/**
 * Series Configuration Helper
 * Tüm seri adlandırma ve mapping işlemlerini merkezileştirir
 */

// Mevcut seri ID'leri ve klasör mapping'leri
const SERIES_CONFIG = {
  'sololeveling': {
    folderName: 'solo leveling chapters',
    displayName: 'Solo Leveling',
    id: 'sololeveling'
  },
  'nanomachine': {
    folderName: 'nanomachine chapters',
    displayName: 'Nanomachine',
    id: 'nanomachine'
  },
  'omniscientreader': {
    folderName: 'omniscient reader chapters',
    displayName: 'Omniscient Reader',
    id: 'omniscientreader'
  },
  'damnreincarnation': {
    folderName: 'damn reincarnation chapters',
    displayName: 'Damn Reincarnation',
    id: 'damnreincarnation'
  },
  'martialgodregressedtolevel2': {
    folderName: 'martial god regressed to level 2 chapters',
    displayName: 'Martial God Regressed to Level 2',
    id: 'martialgodregressedtolevel2'
  },
  'blackcrow': {
    folderName: 'blackcrow chapters',
    displayName: 'Black Crow',
    id: 'blackcrow'
  }
};

/**
 * Seri ID'sinden klasör adını döndürür
 * @param {string} seriesId - Seri ID'si
 * @returns {string} Klasör adı
 */
function getSeriesFolderName(seriesId) {
  const config = SERIES_CONFIG[seriesId];
  if (!config) {
    // Bilinmeyen seri için default format
    return `${seriesId} chapters`;
  }
  return config.folderName;
}

/**
 * Seri ID'sinden display adını döndürür
 * @param {string} seriesId - Seri ID'si
 * @returns {string} Display adı
 */
function getSeriesDisplayName(seriesId) {
  const config = SERIES_CONFIG[seriesId];
  if (!config) {
    // Bilinmeyen seri için capitalize edilmiş versiyon
    return seriesId.charAt(0).toUpperCase() + seriesId.slice(1);
  }
  return config.displayName;
}

/**
 * Seri ID'sinin geçerli olup olmadığını kontrol eder
 * manhwalar.json dosyasından dinamik olarak kontrol eder
 * @param {string} seriesId - Seri ID'si
 * @returns {boolean} Geçerli mi?
 */
function isValidSeriesId(seriesId) {
  // Önce hard-coded listede kontrol et
  if (SERIES_CONFIG.hasOwnProperty(seriesId)) {
    return true;
  }
  
  // manhwalar.json dosyasından dinamik kontrol
  try {
    const fs = require('fs');
    const path = require('path');
    const manhwalarPath = path.join(__dirname, '../../client/data/manhwalar.json');
    const manhwalarData = JSON.parse(fs.readFileSync(manhwalarPath, 'utf8'));
    
    // Seri ID'si manhwalar.json'da var mı kontrol et
    const seriesExists = manhwalarData.some(series => series.seriesId === seriesId);
    return seriesExists;
  } catch (error) {
    console.warn('manhwalar.json okunamadı, hard-coded listeyle devam ediliyor:', error.message);
    return false;
  }
}

/**
 * Tüm geçerli seri ID'lerini döndürür
 * manhwalar.json dosyasından dinamik olarak okur
 * @returns {string[]} Seri ID'leri
 */
function getAllSeriesIds() {
  // Hard-coded listeden başla
  const hardCodedIds = Object.keys(SERIES_CONFIG);
  
  try {
    const fs = require('fs');
    const path = require('path');
    const manhwalarPath = path.join(__dirname, '../../client/data/manhwalar.json');
    const manhwalarData = JSON.parse(fs.readFileSync(manhwalarPath, 'utf8'));
    
    // manhwalar.json'dan tüm seri ID'lerini al
    const dynamicIds = manhwalarData.map(series => series.seriesId);
    
    // İkisini birleştir ve unique hale getir
    const allIds = [...new Set([...hardCodedIds, ...dynamicIds])];
    return allIds;
  } catch (error) {
    console.warn('manhwalar.json okunamadı, hard-coded listeyle devam ediliyor:', error.message);
    return hardCodedIds;
  }
}

/**
 * Seri için tam konfigürasyonu döndürür
 * @param {string} seriesId - Seri ID'si
 * @returns {object|null} Konfigürasyon objesi
 */
function getSeriesConfig(seriesId) {
  return SERIES_CONFIG[seriesId] || null;
}

/**
 * Seri ID normalize edilir (güvenlik için)
 * @param {string} seriesId - Seri ID'si
 * @returns {string} Normalize edilmiş ID
 */
function normalizeSeriesId(seriesId) {
  if (!seriesId || typeof seriesId !== 'string') {
    throw new Error('Geçersiz seri ID');
  }
  
  // Sadece alfanumerik karakterlere izin ver
  const normalized = seriesId.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (!normalized) {
    throw new Error('Seri ID boş olamaz');
  }
  
  return normalized;
}

/**
 * Yeni seri validasyonu
 * @param {object} seriesData - Seri verisi
 * @returns {object} Validasyon sonucu
 */
function validateSeriesData(seriesData) {
  const errors = [];
  
  if (!seriesData.title || seriesData.title.trim().length === 0) {
    errors.push('Seri başlığı gerekli');
  }
  
  if (!seriesData.seriesId || seriesData.seriesId.trim().length === 0) {
    errors.push('Seri ID gerekli');
  }
  
  try {
    const normalizedId = normalizeSeriesId(seriesData.seriesId);
    if (normalizedId.length < 3) {
      errors.push('Seri ID en az 3 karakter olmalı');
    }
  } catch (error) {
    errors.push(error.message);
  }
  
  if (!seriesData.image || seriesData.image.trim().length === 0) {
    errors.push('Kapak görseli gerekli');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Bölüm validasyonu
 * @param {object} chapterData - Bölüm verisi
 * @returns {object} Validasyon sonucu
 */
function validateChapterData(chapterData) {
  const errors = [];
  
  if (!chapterData.seriesId || !isValidSeriesId(chapterData.seriesId)) {
    errors.push('Geçerli bir seri ID gerekli');
  }
  
  if (!chapterData.chapterNumber || isNaN(parseInt(chapterData.chapterNumber))) {
    errors.push('Geçerli bir bölüm numarası gerekli');
  }
  
  if (parseInt(chapterData.chapterNumber) <= 0) {
    errors.push('Bölüm numarası 0\'dan büyük olmalı');
  }
  
  if (!chapterData.imageUrls || !Array.isArray(chapterData.imageUrls) || chapterData.imageUrls.length === 0) {
    errors.push('En az bir görsel URL\'si gerekli');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

module.exports = {
  SERIES_CONFIG,
  getSeriesFolderName,
  getSeriesDisplayName,
  isValidSeriesId,
  getAllSeriesIds,
  getSeriesConfig,
  normalizeSeriesId,
  validateSeriesData,
  validateChapterData
};
