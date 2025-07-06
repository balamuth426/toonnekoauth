const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Google Drive image proxy endpoint
router.get('/proxy-image/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { quality = 'high' } = req.query;
    
    console.log(`🔥 PROXY REQUEST - File ID: ${fileId}, Quality: ${quality}`);
    
    // Farklı kalite URL'leri dene
    const qualityUrls = [
      `https://drive.usercontent.google.com/download?id=${fileId}&authuser=0`,
      `https://drive.google.com/uc?export=view&id=${fileId}`,
      `https://drive.google.com/uc?id=${fileId}`,
      `https://drive.google.com/thumbnail?id=${fileId}&sz=s1600`
    ];
    
    console.log(`📋 URLs to try:`, qualityUrls);
    
    let success = false;
    
    for (const url of qualityUrls) {
      try {
        console.log(`Trying to proxy: ${url}`);
        
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        
        await new Promise((resolve, reject) => {
          const request = protocol.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              'Accept': 'image/*,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate, br',
              'DNT': '1',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1'
            }
          }, (response) => {
            if (response.statusCode === 200 && response.headers['content-type']?.startsWith('image/')) {
              // Başarılı image response
              console.log(`✅ SUCCESS with ${url}`);
              console.log(`📷 Content-Type: ${response.headers['content-type']}`);
              console.log(`📏 Content-Length: ${response.headers['content-length']}`);
              
              res.set({
                'Content-Type': response.headers['content-type'],
                'Content-Length': response.headers['content-length'],
                'Cache-Control': 'public, max-age=3600',
                'Access-Control-Allow-Origin': '*'
              });
              
              response.pipe(res);
              success = true;
              resolve();
            } else if (response.statusCode === 302 || response.statusCode === 301 || response.statusCode === 303) {
              // Redirect - follow it (303 dahil)
              const redirectUrl = response.headers.location;
              console.log(`Redirected to: ${redirectUrl}`);
              const redirectUrlObj = new URL(redirectUrl);
              const redirectProtocol = redirectUrlObj.protocol === 'https:' ? https : http;
              redirectProtocol.get(redirectUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                  'Accept': 'image/*,*/*;q=0.8'
                }
              }, (redirectResponse) => {
                if (redirectResponse.statusCode === 200 && redirectResponse.headers['content-type']?.startsWith('image/')) {
                  res.set({
                    'Content-Type': redirectResponse.headers['content-type'],
                    'Content-Length': redirectResponse.headers['content-length'],
                    'Cache-Control': 'public, max-age=3600',
                    'Access-Control-Allow-Origin': '*'
                  });
                  redirectResponse.pipe(res);
                  success = true;
                  resolve();
                } else {
                  reject(new Error(`Redirect failed: ${redirectResponse.statusCode}`));
                }
              }).on('error', reject);
            } else {
              console.log(`❌ FAILED with ${url} - Status: ${response.statusCode}, Content-Type: ${response.headers['content-type']}`);
              reject(new Error(`HTTP ${response.statusCode}`));
            }
          }).on('error', reject);
        });
        
        if (success) break;
        
      } catch (error) {
        console.log(`Failed with URL ${url}: ${error.message}`);
        continue;
      }
    }
    
    if (!success) {
      res.status(404).json({ error: 'Görsel bulunamadı veya erişilemiyor. Google Drive paylaşım ayarlarını kontrol edin.' });
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error: ' + error.message });
  }
});

// Batch image info endpoint
router.post('/batch-image-info', async (req, res) => {
  try {
    const { fileIds } = req.body;
    
    if (!Array.isArray(fileIds)) {
      return res.status(400).json({ error: 'fileIds must be an array' });
    }
    
    const results = await Promise.all(
      fileIds.map(async (fileId) => {
        const qualityUrls = [
          `https://drive.usercontent.google.com/download?id=${fileId}&authuser=0`,
          `https://drive.google.com/uc?export=view&id=${fileId}`,
          `https://drive.google.com/uc?id=${fileId}`
        ];
        
        for (const url of qualityUrls) {
          try {
            await new Promise((resolve, reject) => {
              const urlObj = new URL(url);
              const protocol = urlObj.protocol === 'https:' ? https : http;
              
              const request = protocol.request(url, { method: 'HEAD' }, (response) => {
                if (response.statusCode === 200) {
                  resolve();
                } else {
                  reject(new Error(`HTTP ${response.statusCode}`));
                }
              });
              
              request.on('error', reject);
              request.setTimeout(5000, () => reject(new Error('Timeout')));
              request.end();
            });
            
            return {
              fileId,
              status: 'available',
              proxyUrl: `/api/image/proxy-image/${fileId}`,
              directUrl: url
            };
            
          } catch (error) {
            continue;
          }
        }
        
        return {
          fileId,
          status: 'unavailable',
          proxyUrl: `/api/image/proxy-image/${fileId}`,
          directUrl: null
        };
      })
    );
    
    res.json({ results });
    
  } catch (error) {
    console.error('Batch image info error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
