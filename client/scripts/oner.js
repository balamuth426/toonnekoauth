let onerManhwaList = [];
let selected;

fetch('data/manhwalar.json')
  .then(res => res.json())
  .then(data => {
    onerManhwaList = data;
  });

const button = document.getElementById("oner-button");
const previewImage = document.getElementById("preview-image");
const previewTitle = document.getElementById("preview-title");

// Element'lerin varlığını kontrol et
if (!button || !previewImage || !previewTitle) {
  console.log('Öner elementi bulunamadı, script atlanıyor');
  // Bu sayfada öner bölümü yok, çıkış yap
} else {
  
// --- Sonuçta yıldız efektli kutu, animasyonda ise yumuşak renkli dalga ve fade ---
function starBurstEffect(element) {
  // Enerji halkası
  const ring = document.createElement('span');
  ring.className = 'oner-burst-ring';
  element.appendChild(ring);
  setTimeout(() => ring.remove(), 900);

  // Yıldız partiküller
  for (let i = 0; i < 14; i++) {
    const star = document.createElement('span');
    star.className = 'oner-star-particle';
    const angle = (i / 14) * 2 * Math.PI;
    const distance = 54 + Math.random() * 18;
    star.style.setProperty('--x', Math.cos(angle) * distance + 'px');
    star.style.setProperty('--y', Math.sin(angle) * distance + 'px');
    star.style.setProperty('--star-rotate', Math.random() * 360 + 'deg');
    element.appendChild(star);
    setTimeout(() => star.remove(), 900);
  }
}

function waveFadeEffect(element) {
  const wave = document.createElement('span');
  wave.className = 'oner-wave';
  element.appendChild(wave);
  setTimeout(() => wave.remove(), 700);
}

button.addEventListener("click", () => {
  if (onerManhwaList.length === 0) return;

  previewTitle.classList.add("hidden");
  button.disabled = true;
  button.classList.add('loading');
  let speeds = [400, 380, 360, 340, 320, 300, 280, 260, 240, 220, 200, 180, 160, 140, 130, 120,  120, 110, 100];
  let count = 0;

  function animate() {
    const random = onerManhwaList[Math.floor(Math.random() * onerManhwaList.length)];
    previewImage.style.transform = "scale(1.10) rotate(-2deg)";
    previewImage.style.boxShadow = "0 0 40px #6C63FF77, 0 0 0 10px #fff2";
    waveFadeEffect(previewImage.parentElement);
    setTimeout(() => {
      previewImage.src = random.image;
      previewImage.style.transform = "scale(1) rotate(0deg)";
      previewImage.style.boxShadow = "0 0 18px #6C63FF44";
    }, 120);
    selected = random;
    if (count < speeds.length) {
      setTimeout(animate, speeds[count]);
      count++;
    } else {
      setTimeout(() => {
        showResult(selected);
        button.disabled = false;
        button.classList.remove('loading');
        starBurstEffect(button.parentElement);
      }, 200);
    }
  }
  animate();
});

function showResult(item) {
  previewTitle.innerHTML = `
  <a href="${item.link}"  style="color: #6C63FF; text-decoration: none; font-weight: bold;">
    ${item.title}
  </a>
`;

  previewTitle.classList.remove("hidden");
}

} // if bloğunu kapat
