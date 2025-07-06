#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Bu script sadece manuel çalıştırılmalı ve dikkatli kullanılmalı
// Fiziksel dosya ve JSON arasındaki tutarsızlıkları giderir

console.log('🔧 Chapter Sync Fix Tool');
console.log('⚠️  DİKKAT: Bu script fiziksel dosyalar ile JSON arasındaki tutarsızlıkları düzeltir');
console.log('⚠️  Sadece gerektiğinde ve dikkatli kullanın!\n');

const manhwalarPath = path.join(__dirname, 'client/data/manhwalar.json');
const chaptersDir = path.join(__dirname, 'client/chapters');

function fixChapterSync() {
    try {
        // manhwalar.json'u oku
        const manhwalarData = JSON.parse(fs.readFileSync(manhwalarPath, 'utf8'));
        
        const folderNameMap = {
            'blackcrow': 'blackcrow chapters',
            'sololeveling': 'solo leveling chapters',
            'nanomachine': 'nanomachine chapters',
            'damnreincarnation': 'damn reincarnation chapters',
            'omniscientreader': 'omniscient reader chapters',
            'martialgodregressedtolevel2': 'martial god regressed to level 2 chapters'
        };
        
        let hasChanges = false;
        
        for (const series of manhwalarData) {
            if (!series.seriesId || !folderNameMap[series.seriesId]) continue;
            
            const folderName = folderNameMap[series.seriesId];
            const seriesChaptersPath = path.join(chaptersDir, folderName);
            
            console.log(`\n📁 Kontrol ediliyor: ${series.title} (${series.seriesId})`);
            
            if (!fs.existsSync(seriesChaptersPath)) {
                console.log(`  ⚠️ Klasör bulunamadı: ${folderName}`);
                continue;
            }
            
            // Fiziksel dosyaları oku
            const files = fs.readdirSync(seriesChaptersPath);
            const htmlFiles = files.filter(file => file.endsWith('.html'));
            const physicalChapters = htmlFiles.map(file => {
                const match = file.match(/bölüm(\d+)\.html/);
                return match ? parseInt(match[1]) : null;
            }).filter(num => num !== null).sort((a, b) => a - b);
            
            console.log(`  💾 JSON'da: ${series.chapters ? series.chapters.length : 0} bölüm`);
            console.log(`  📁 Fiziksel: ${physicalChapters.length} bölüm (${physicalChapters.join(', ')})`);
            
            // JSON'daki chapters array'ini fiziksel dosyalara göre güncelle
            if (series.chapters) {
                const jsonChapters = series.chapters.map(ch => ch.number).sort((a, b) => a - b);
                
                if (JSON.stringify(jsonChapters) !== JSON.stringify(physicalChapters)) {
                    console.log(`  🔧 Tutarsızlık bulundu! JSON güncelleniyor...`);
                    
                    // Fiziksel dosyalarda olmayan bölümleri JSON'dan kaldır
                    series.chapters = series.chapters.filter(ch => physicalChapters.includes(ch.number));
                    
                    // availableChapters güncelle
                    series.availableChapters = physicalChapters;
                    
                    // chapterDetails güncelle
                    if (series.chapterDetails) {
                        series.chapterDetails = series.chapterDetails.filter(ch => physicalChapters.includes(ch.number));
                    }
                    
                    // chapterCount güncelle
                    series.chapterCount = physicalChapters.length;
                    
                    // lastChapter güncelle
                    if (physicalChapters.length > 0) {
                        series.lastChapter = `Bölüm ${Math.max(...physicalChapters)}`;
                    } else {
                        series.lastChapter = '';
                    }
                    
                    hasChanges = true;
                    console.log(`  ✅ ${series.title} güncellendi`);
                } else {
                    console.log(`  ✅ ${series.title} zaten senkronize`);
                }
            }
        }
        
        if (hasChanges) {
            // Backup oluştur
            const backupPath = manhwalarPath + '.backup.' + Date.now();
            fs.copyFileSync(manhwalarPath, backupPath);
            console.log(`\n💾 Backup oluşturuldu: ${backupPath}`);
            
            // Güncellenmiş veriyi kaydet
            fs.writeFileSync(manhwalarPath, JSON.stringify(manhwalarData, null, 2));
            console.log('✅ manhwalar.json güncellendi');
        } else {
            console.log('\n✅ Hiçbir değişiklik gerekmedi - her şey senkronize');
        }
        
    } catch (error) {
        console.error('❌ Hata:', error);
    }
}

// Kullanıcı onayı al
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Bu script JSON dosyasını fiziksel dosyalara göre güncelleyecek. Devam etmek istiyor musunuz? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        fixChapterSync();
    } else {
        console.log('İşlem iptal edildi.');
    }
    rl.close();
});
