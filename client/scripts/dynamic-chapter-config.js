// Dynamic Chapter Configuration Helper
// Bu script manhwalar.json'dan otomatik olarak bölüm sayısını alır

async function getDynamicChapterConfig(seriesId, currentChapter) {
  try {
    // manhwalar.json'dan seri bilgilerini al
    const response = await fetch('../../data/manhwalar.json');
    const manhwalar = await response.json();
    
    // İlgili seriyi bul
    const series = manhwalar.find(s => s.seriesId === seriesId);
    
    if (!series) {
      console.warn(`⚠️ Seri bulunamadı: ${seriesId}`);
      return null;
    }

    // Folder name mapping for different series
    const folderNameMap = {
      'blackcrow': 'blackcrow chapters',
      'sololeveling': 'solo leveling chapters',
      'nanomachine': 'nanomachine chapters',
      'damnreincarnation': 'damn reincarnation chapters',
      'omniscientreader': 'omniscient reader chapters',
      'martialgodregressedtolevel2': 'martial god regressed to level 2 chapters'
    };

    const folderName = folderNameMap[seriesId] || `${seriesId} chapters`;
    
    // Dynamic config oluştur
    const config = {
      seriesName: seriesId,
      seriesDisplayName: series.title,
      currentChapter: currentChapter,
      totalChapters: series.chapterCount,
      availableChapters: series.availableChapters || [],
      seriesUrl: `../../series/${seriesId}/${seriesId}seri.html`,
      chapterUrlPattern: `../${folderName}/bölüm{chapter}.html`,
      chapterDetails: series.chapterDetails || []
    };
    
    console.log('📊 Dynamic chapter config loaded:', config);
    return config;
    
  } catch (error) {
    console.error('❌ Failed to load dynamic chapter config:', error);
    return null;
  }
}

// Navigation butonlarını dinamik olarak güncelle
function updateNavigationButtons(config) {
  if (!config) return;
  
  const { currentChapter, totalChapters, availableChapters } = config;
  
  // Eğer availableChapters tanımlanmamışsa, 1'den totalChapters'a kadar tümünü mevcut kabul et
  const chapters = availableChapters || Array.from({length: totalChapters}, (_, i) => i + 1);
  
  console.log(`🔄 updateNavigationButtons called - Chapter ${currentChapter}/${totalChapters}, Available: [${chapters.join(',')}]`);
  
  // Önceki bölüm butonları
  const prevButtons = document.querySelectorAll('#navPrevBtn, #navPrevBtn2, #prevChapter, #prevChapterBottom');
  prevButtons.forEach(btn => {
    if (btn) {
      const prevChapter = currentChapter - 1;
      const hasPrev = prevChapter >= 1 && chapters.includes(prevChapter);
      
      btn.disabled = !hasPrev;
      btn.style.setProperty('display', hasPrev ? 'inline-flex' : 'none', 'important');
      
      if (hasPrev) {
        btn.onclick = () => navigateToChapter(prevChapter, config);
      }
      
      console.log(`⬅️ Prev button (${btn.id}): ${hasPrev ? 'SHOW' : 'HIDE'} - Chapter ${prevChapter}`);
    }
  });
  
  // Sonraki bölüm butonları
  const nextButtons = document.querySelectorAll('#navNextBtn, #navNextBtn2, #nextChapter, #nextChapterBottom');
  nextButtons.forEach(btn => {
    if (btn) {
      const nextChapter = currentChapter + 1;
      const hasNext = nextChapter <= totalChapters && chapters.includes(nextChapter);
      
      btn.disabled = !hasNext;
      btn.style.setProperty('display', hasNext ? 'inline-flex' : 'none', 'important');
      
      if (hasNext) {
        btn.onclick = () => navigateToChapter(nextChapter, config);
      }
      
      console.log(`➡️ Next button (${btn.id}): ${hasNext ? 'SHOW' : 'HIDE'} - Chapter ${nextChapter}`);
    }
  });
  
  // Bölüm seçici dropdown'ı güncelle
  updateChapterSelector(config);
  
  console.log(`✅ Navigation updated - Chapter ${currentChapter}: Prev=${currentChapter > 1 && chapters.includes(currentChapter - 1)}, Next=${currentChapter < totalChapters && chapters.includes(currentChapter + 1)}`);
}

// Bölüm seçici dropdown'ı güncelle
function updateChapterSelector(config) {
  const { currentChapter, availableChapters } = config;
  const selector = document.getElementById('bolumSec') || document.getElementById('chapterSelect');
  
  if (selector) {
    // Mevcut seçenekleri temizle
    selector.innerHTML = '';
    
    // Mevcut bölümleri ekle
    availableChapters.forEach(chapterNum => {
      const option = document.createElement('option');
      option.value = chapterNum;
      option.textContent = `Bölüm ${chapterNum}`;
      option.selected = chapterNum === currentChapter;
      selector.appendChild(option);
    });
    
    // Change event listener ekle
    selector.onchange = function() {
      const selectedChapter = parseInt(this.value);
      if (selectedChapter !== currentChapter) {
        navigateToChapter(selectedChapter, config);
      }
    };
  }
}

// Bölüm navigasyonu
function navigateToChapter(chapterNumber, config) {
  const { chapterUrlPattern } = config;
  const url = chapterUrlPattern.replace('{chapter}', chapterNumber);
  window.location.href = url;
}

// Sayfa yüklendiğinde dynamic config'i al ve uygula
window.initializeDynamicChapterNavigation = async function(seriesId, currentChapter) {
  const config = await getDynamicChapterConfig(seriesId, currentChapter);
  
  if (config) {
    // Global olarak erişilebilir yap
    window.DYNAMIC_CHAPTER_CONFIG = config;
    
    // Navigation butonlarını güncelle
    updateNavigationButtons(config);
    
    return config;
  }
  
  return null;
};

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getDynamicChapterConfig,
    updateNavigationButtons,
    navigateToChapter,
    updateChapterSelector
  };
}
