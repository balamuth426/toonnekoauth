// Benzer seriler gridini dinamik doldurur

document.addEventListener('DOMContentLoaded', function() {
  // Başlığı .title class'ından al
  const mainTitle = document.querySelector('.title')?.textContent?.trim() || 'Solo Leveling';
  const grid = document.getElementById('related-grid');
  if (!grid) return;

  // Determine the correct path based on current page location
  const isSeriesPage = window.location.pathname.includes('/series/');
  const dataPath = isSeriesPage ? '../../data/manhwalar.json' : 'data/manhwalar.json';

  fetch(dataPath)
    .then(res => res.json())
    .then(data => {
      // Ana seriyi bul
      const main = data.find(item => item.title === mainTitle);
      if (!main) return;
      // Ortak etikete göre sırala
      const others = data.filter(item => item.title !== mainTitle);
      others.forEach(item => {
        item.commonTags = item.genres.filter(g => main.genres.includes(g)).length;
      });
      others.sort((a, b) => b.commonTags - a.commonTags);
      // İlk 6 seriyi al
      const top6 = others.slice(0, 6);
      // Grid'i doldur
      grid.innerHTML = '';
      console.log('Creating related cards:', top6.length, 'items');
      top6.forEach(item => {
        const card = document.createElement('div');
        card.className = 'related-card';
        
        // Dynamic paths based on current page location
        // Eğer image tam URL ise (http ile başlıyorsa) direkt kullan, değilse relative path ekle
        const imagePath = item.image.startsWith('http') ? item.image : (isSeriesPage ? `../../${item.image}` : item.image);
        const linkPath = isSeriesPage ? `../../${item.link}` : item.link;
        
        console.log('Card HTML structure for:', item.title);
        card.innerHTML = `
          <img src="${imagePath}" alt="${item.title}">
          <div class="series-info">
            <p><a href="${linkPath}">${item.title}</a></p>
            <div class="latest">${item.lastChapter || 'Henüz bölüm yok'}</div>
          </div>
        `;
        grid.appendChild(card);
      });
      // Eksik kalan kutuları gizle
      for (let i = top6.length; i < 6; i++) {
        const empty = document.createElement('div');
        empty.className = 'related-card';
        empty.style.display = 'none';
        grid.appendChild(empty);
      }
    })
    .catch(error => {
      console.error('Error loading manhwa data for related series:', error);
    });
});
