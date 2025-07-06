// ToonNeko iletişim formu - API üzerinden mail gönderir

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Form field'larını doğru şekilde al
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    console.log('📝 Form verileri:', { name, email, subject, message }); // Debug

    // Temel kontrol
    if (!name || !email || !subject || !message) {
      alert('Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      console.log('🚀 API çağrısı yapılıyor...');
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message })
      });
      
      console.log('📡 API yanıtı alındı:', res.status);
      const data = await res.json();
      console.log('📦 API verisi:', data);
      
      if (data.success) {
        form.reset();
        alert('Mesajınız başarıyla gönderildi!');
      } else {
        alert('Hata: ' + (data.message || 'Mesaj gönderilemedi.'));
      }
    } catch (err) {
      console.error('❌ API hatası:', err);
      alert('Sunucu hatası: ' + err.message);
    }
  });
});
