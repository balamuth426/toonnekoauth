#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Bölümlerdeki görsel durumunu kontrol et
function checkImageContent() {
    console.log('🖼️ Bölümlerdeki görsel içerikleri kontrol ediyorum...\n');
    
    const chaptersDir = path.join(__dirname, 'client', 'chapters');
    const seriesDirs = fs.readdirSync(chaptersDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    
    seriesDirs.forEach(seriesDir => {
        const seriesPath = path.join(chaptersDir, seriesDir);
        const chapterFiles = fs.readdirSync(seriesPath)
            .filter(file => file.endsWith('.html') && file.startsWith('bölüm'));
        
        console.log(`📂 ${seriesDir}:`);
        
        chapterFiles.forEach(file => {
            const filePath = path.join(seriesPath, file);
            
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Okuma alanı var mı?
                const hasOkumaAlani = content.includes('okuma-alani');
                
                // Görseller var mı?
                const imageMatches = content.match(/<img[^>]*src="[^"]*proxy-image[^"]*"[^>]*>/g) || [];
                
                // Görsel URL'lerini çıkar
                const imageUrls = imageMatches.map(img => {
                    const match = img.match(/src="([^"]*proxy-image[^"]*)"/) ;
                    return match ? match[1] : null;
                }).filter(Boolean);
                
                console.log(`  📄 ${file}:`);
                console.log(`    📦 Okuma alanı: ${hasOkumaAlani ? '✅' : '❌'}`);
                console.log(`    🖼️ Görsel sayısı: ${imageUrls.length}`);
                
                if (imageUrls.length > 0) {
                    imageUrls.forEach((url, index) => {
                        console.log(`      ${index + 1}. ${url}`);
                    });
                } else {
                    console.log(`    ⚠️ Hiç görsel bulunamadı!`);
                }
                
            } catch (error) {
                console.log(`  ❌ ${file}: ${error.message}`);
            }
            
            console.log('');
        });
    });
}

checkImageContent();
