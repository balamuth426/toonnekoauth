const fs = require('fs');
const path = require('path');

// Kod fazlalıklarını ve çakışmaları tespit eden analiz script'i
class CodeAnalyzer {
    constructor() {
        this.duplicateScripts = new Map();
        this.unusedFunctions = new Map();
        this.conflictingCode = [];
        this.results = [];
    }

    analyzeProject() {
        console.log('🔍 Kod fazlalıkları ve çakışmalar araştırılıyor...\n');
        
        // Chapter dosyalarını analiz et
        this.analyzeChapterFiles();
        
        // Script dosyalarını analiz et
        this.analyzeScriptFiles();
        
        // HTML dosyalarını analiz et
        this.analyzeHTMLFiles();
        
        // Sonuçları raporla
        this.generateReport();
    }

    analyzeChapterFiles() {
        const chaptersDir = 'client/chapters';
        const seriesDirs = fs.readdirSync(chaptersDir).filter(dir => 
            fs.statSync(path.join(chaptersDir, dir)).isDirectory()
        );

        console.log('📊 Chapter dosyaları analiz ediliyor...');
        
        const commonPatterns = new Map();
        
        for (const seriesDir of seriesDirs) {
            const seriesPath = path.join(chaptersDir, seriesDir);
            const chapterFiles = fs.readdirSync(seriesPath).filter(file => file.endsWith('.html'));
            
            for (const chapterFile of chapterFiles) {
                const filePath = path.join(seriesPath, chapterFile);
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Script tag'lerini kontrol et
                const scriptTags = content.match(/<script[^>]*src[^>]*>/g) || [];
                scriptTags.forEach(tag => {
                    const key = `${seriesDir}/${chapterFile}`;
                    if (!commonPatterns.has(tag)) {
                        commonPatterns.set(tag, []);
                    }
                    commonPatterns.get(tag).push(key);
                });

                // Tekrarlanan fonksiyonları kontrol et
                this.checkDuplicateFunctions(content, `${seriesDir}/${chapterFile}`);
                
                // Çakışan ID'leri kontrol et
                this.checkConflictingIDs(content, `${seriesDir}/${chapterFile}`);
            }
        }

        // Çok tekrarlanan script tag'lerini tespit et
        commonPatterns.forEach((files, scriptTag) => {
            if (files.length > 5) {
                console.log(`🔄 Tekrarlanan script: ${scriptTag}`);
                console.log(`   Dosya sayısı: ${files.length}`);
            }
        });
    }

    checkDuplicateFunctions(content, fileName) {
        // JavaScript fonksiyon tanımlarını bul
        const functionMatches = content.match(/function\s+(\w+)\s*\([^)]*\)\s*\{/g) || [];
        const arrowFunctions = content.match(/const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g) || [];
        
        [...functionMatches, ...arrowFunctions].forEach(func => {
            if (!this.duplicateScripts.has(func)) {
                this.duplicateScripts.set(func, []);
            }
            this.duplicateScripts.get(func).push(fileName);
        });
    }

    checkConflictingIDs(content, fileName) {
        // Inline script'lerdeki ID çakışmalarını kontrol et
        const problematicPatterns = [
            'ToonNekoNavigation',
            'updateNavigationButtons',
            'currentReadingMode',
            'showPage',
            'navNextBtn.onclick',
            'navPrevBtn.onclick'
        ];

        problematicPatterns.forEach(pattern => {
            if (content.includes(pattern)) {
                this.conflictingCode.push({
                    file: fileName,
                    pattern: pattern,
                    type: 'Çakışan kod'
                });
            }
        });
    }

    analyzeScriptFiles() {
        console.log('\n📊 Script dosyaları analiz ediliyor...');
        
        const scriptsDir = 'client/scripts';
        const scriptFiles = fs.readdirSync(scriptsDir).filter(file => file.endsWith('.js'));
        
        const exportedFunctions = new Map();
        const globalVariables = new Map();
        
        scriptFiles.forEach(file => {
            const filePath = path.join(scriptsDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Global değişkenleri kontrol et
            const globalVars = content.match(/window\.(\w+)\s*=/g) || [];
            globalVars.forEach(varDecl => {
                const varName = varDecl.match(/window\.(\w+)/)[1];
                if (!globalVariables.has(varName)) {
                    globalVariables.set(varName, []);
                }
                globalVariables.get(varName).push(file);
            });

            // Class tanımlarını kontrol et
            const classes = content.match(/class\s+(\w+)/g) || [];
            classes.forEach(classDecl => {
                const className = classDecl.match(/class\s+(\w+)/)[1];
                if (!exportedFunctions.has(className)) {
                    exportedFunctions.set(className, []);
                }
                exportedFunctions.get(className).push(file);
            });
        });

        // Çakışan global değişkenleri raporla
        globalVariables.forEach((files, varName) => {
            if (files.length > 1) {
                console.log(`⚠️ Çakışan global değişken: window.${varName}`);
                console.log(`   Dosyalar: ${files.join(', ')}`);
            }
        });

        // Çakışan class'ları raporla  
        exportedFunctions.forEach((files, className) => {
            if (files.length > 1) {
                console.log(`⚠️ Çakışan class: ${className}`);
                console.log(`   Dosyalar: ${files.join(', ')}`);
            }
        });
    }

    analyzeHTMLFiles() {
        console.log('\n📊 Ana HTML dosyaları analiz ediliyor...');
        
        const htmlFiles = fs.readdirSync('client').filter(file => file.endsWith('.html'));
        
        const scriptUsage = new Map();
        
        htmlFiles.forEach(file => {
            const filePath = path.join('client', file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Script dosyası kullanımını kontrol et
            const scriptTags = content.match(/<script[^>]*src="[^"]*"/g) || [];
            scriptTags.forEach(tag => {
                const src = tag.match(/src="([^"]*)"/)[1];
                if (!scriptUsage.has(src)) {
                    scriptUsage.set(src, []);
                }
                scriptUsage.get(src).push(file);
            });
        });

        console.log('\n📈 Script kullanım istatistikleri:');
        scriptUsage.forEach((files, scriptSrc) => {
            console.log(`${scriptSrc}: ${files.length} dosyada kullanılıyor`);
        });
    }

    generateReport() {
        console.log('\n' + '='.repeat(50));
        console.log('📋 KOD ANALİZ RAPORU');
        console.log('='.repeat(50));

        console.log('\n🔄 Tekrarlanan Fonksiyonlar:');
        this.duplicateScripts.forEach((files, func) => {
            if (files.length > 1) {
                console.log(`- ${func}: ${files.length} dosyada`);
                files.forEach(file => console.log(`  📁 ${file}`));
            }
        });

        console.log('\n⚠️ Çakışan Kodlar:');
        if (this.conflictingCode.length > 0) {
            this.conflictingCode.forEach(conflict => {
                console.log(`- ${conflict.file}: ${conflict.pattern} (${conflict.type})`);
            });
        } else {
            console.log('✅ Çakışan kod bulunamadı');
        }

        console.log('\n📊 Toplam Bulgular:');
        console.log(`- Tekrarlanan fonksiyon: ${Array.from(this.duplicateScripts.values()).filter(f => f.length > 1).length}`);
        console.log(`- Çakışan kod: ${this.conflictingCode.length}`);
        
        console.log('\n='.repeat(50));
    }
}

// Analizi çalıştır
const analyzer = new CodeAnalyzer();
analyzer.analyzeProject();
