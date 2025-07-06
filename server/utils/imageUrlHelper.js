/**
 * Google Drive image URL helper utilities
 */

/**
 * Google Drive link'ini direct access link'ine çevirir
 * @param {string} driveUrl - Google Drive paylaşım URL'i
 * @param {string} quality - 'high', 'medium', 'low' kalite seçeneği
 * @returns {string} - Direct access URL
 */
function convertDriveLinkToDirectAccess(driveUrl, quality = 'high') {
  try {
    // Google Drive file ID'sini extract et
    const fileIdMatch = driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      
      switch (quality) {
        case 'high':
          // En yüksek kalite - export=view parametresi
          return `https://drive.google.com/uc?export=view&id=${fileId}`;
        case 'medium':
          // Orta kalite - standart uc formatı
          return `https://drive.google.com/uc?id=${fileId}`;
        case 'download':
          // Direct download - en kaliteli ama bazen CORS problemi
          return `https://drive.usercontent.google.com/download?id=${fileId}&authuser=0`;
        case 'low':
        default:
          // Düşük kalite thumbnail
          return `https://drive.google.com/thumbnail?id=${fileId}&sz=s1600`; // s1600 daha yüksek
      }
    }
    
    // Eğer zaten direct access formatındaysa, olduğu gibi döndür
    if (driveUrl.includes('drive.google.com/uc?')) {
      return driveUrl;
    }
    
    // Eğer usercontent formatındaysa, olduğu gibi döndür
    if (driveUrl.includes('drive.usercontent.google.com')) {
      return driveUrl;
    }
    
    // Eğer sadece file ID verilmişse
    if (driveUrl.match(/^[a-zA-Z0-9_-]+$/)) {
      return `https://drive.google.com/uc?export=view&id=${driveUrl}`;
    }
    
    return driveUrl;
  } catch (error) {
    console.error('Drive link conversion error:', error);
    return driveUrl;
  }
}

/**
 * Image URL'inin geçerliliğini kontrol eder
 * @param {string} imageUrl - Kontrol edilecek URL
 * @returns {Promise<boolean>} - URL'in geçerli olup olmadığı
 */
async function validateImageUrl(imageUrl) {
  try {
    // Google Drive URL'leri için özel kontrol
    if (imageUrl.includes('drive.google.com') || imageUrl.includes('drive.usercontent.google.com')) {
      // Google Drive URL'i ise, format kontrolü yap
      const hasFileId = imageUrl.includes('/file/d/') || 
                       imageUrl.includes('uc?id=') || 
                       imageUrl.includes('uc?export=view&id=') ||
                       imageUrl.includes('download?id=') ||
                       imageUrl.includes('thumbnail?id=');
      
      console.log('Google Drive URL validation:', {
        url: imageUrl,
        hasFileId: hasFileId
      });
      
      return hasFileId;
    }
    
    // Diğer URL'ler için basit format kontrolü
    try {
      const url = new URL(imageUrl);
      const isValid = url.protocol === 'http:' || url.protocol === 'https:';
      console.log('General URL validation:', {
        url: imageUrl,
        isValid: isValid
      });
      return isValid;
    } catch {
      console.log('URL parsing failed for:', imageUrl);
      return false;
    }
  } catch (error) {
    console.error('Image validation error:', error);
    return false;
  }
}

/**
 * Thumbnail URL'i oluşturur (Google Drive için)
 * @param {string} driveUrl - Google Drive URL'i
 * @param {string} size - Thumbnail boyutu (s220, s400, s800, s1600)
 * @returns {string} - Thumbnail URL
 */
function createThumbnailUrl(driveUrl, size = 's1600') {
  const directUrl = convertDriveLinkToDirectAccess(driveUrl, 'medium');
  const fileIdMatch = directUrl.match(/id=([a-zA-Z0-9_-]+)/);
  
  if (fileIdMatch) {
    const fileId = fileIdMatch[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
  }
  
  return directUrl;
}

/**
 * Çoklu kalite URL'leri oluşturur
 * @param {string} driveUrl - Google Drive URL'i
 * @returns {object} - Farklı kalitelerde URL'ler
 */
function createMultiQualityUrls(driveUrl) {
  const fileIdMatch = driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  
  if (!fileIdMatch) {
    return { original: driveUrl };
  }
  
  const fileId = fileIdMatch[1];
  
  return {
    high: `https://drive.google.com/uc?export=view&id=${fileId}`,
    medium: `https://drive.google.com/uc?id=${fileId}`,
    download: `https://drive.usercontent.google.com/download?id=${fileId}&authuser=0`,
    thumbnail_large: `https://drive.google.com/thumbnail?id=${fileId}&sz=s1600`,
    thumbnail_medium: `https://drive.google.com/thumbnail?id=${fileId}&sz=s800`,
    thumbnail_small: `https://drive.google.com/thumbnail?id=${fileId}&sz=s400`
  };
}

module.exports = {
  convertDriveLinkToDirectAccess,
  validateImageUrl,
  createThumbnailUrl,
  createMultiQualityUrls
};
