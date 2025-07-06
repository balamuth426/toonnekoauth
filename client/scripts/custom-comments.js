// Custom Yorum Sistemi - Mevcut backend entegrasyonu
// Kullanıcı girişi gerekiyor, tamamen kontrol edilebilir

class CommentSystem {
  constructor(containerId, seriesId) {
    this.container = document.getElementById(containerId);
    this.seriesId = seriesId;
    this.apiBase = 'http://localhost:5506/api';
    this.init();
  }

  init() {
    this.render();
    this.loadComments();
  }

  render() {
    this.container.innerHTML = `
      <div class="comment-system">
        <div class="comment-form-section" id="comment-form-section">
          <h3>Yorum Yap</h3>
          <div class="login-required" id="login-required">
            <p>Yorum yapabilmek için <a href="#" id="login-link">giriş yapın</a></p>
          </div>
          <form id="comment-form" style="display:none;">
            <textarea id="comment-text" placeholder="Yorumunuzu yazın..." rows="4" required></textarea>
            <button type="submit">Yorum Gönder</button>
          </form>
        </div>
        <div class="comments-list" id="comments-list">
          <div class="loading">Yorumlar yükleniyor...</div>
        </div>
      </div>
    `;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    const form = document.getElementById('comment-form');
    if (form) {
      form.addEventListener('submit', (e) => this.submitComment(e));
    }
    
    // Kullanıcı girişi kontrolü
    this.checkUserLogin();
  }

  async checkUserLogin() {
    const token = localStorage.getItem('token');
    if (token) {
      document.getElementById('login-required').style.display = 'none';
      document.getElementById('comment-form').style.display = 'block';
    }
  }

  async loadComments() {
    try {
      const response = await fetch(`${this.apiBase}/comments/${this.seriesId}`);
      const comments = await response.json();
      this.renderComments(comments);
    } catch (error) {
      console.error('Yorumlar yüklenemedi:', error);
      document.getElementById('comments-list').innerHTML = 
        '<p>Yorumlar yüklenirken hata oluştu.</p>';
    }
  }

  renderComments(comments) {
    const container = document.getElementById('comments-list');
    if (comments.length === 0) {
      container.innerHTML = '<p>Henüz yorum yok. İlk yorumu siz yapın!</p>';
      return;
    }

    container.innerHTML = comments.map(comment => `
      <div class="comment">
        <div class="comment-header">
          <span class="username">${comment.username}</span>
          <span class="date">${new Date(comment.createdAt).toLocaleDateString('tr-TR')}</span>
        </div>
        <div class="comment-text">${comment.text}</div>
      </div>
    `).join('');
  }

  async submitComment(e) {
    e.preventDefault();
    const text = document.getElementById('comment-text').value;
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${this.apiBase}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          seriesId: this.seriesId,
          text: text
        })
      });

      if (response.ok) {
        document.getElementById('comment-text').value = '';
        this.loadComments(); // Yorumları yeniden yükle
      }
    } catch (error) {
      console.error('Yorum gönderilemedi:', error);
    }
  }
}

// CSS stilleri
const commentStyles = `
<style>
.comment-system {
  background: #2a2a2a;
  padding: 20px;
  border-radius: 10px;
  margin: 20px 0;
}

.comment-form-section h3 {
  color: #ff6f61;
  margin-bottom: 15px;
}

#comment-text {
  width: 100%;
  padding: 12px;
  background: #333;
  border: 1px solid #555;
  border-radius: 6px;
  color: #fff;
  resize: vertical;
  margin-bottom: 10px;
}

button[type="submit"] {
  background: #ff6f61;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.comment {
  background: #333;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 0.9rem;
}

.username {
  color: #ff6f61;
  font-weight: bold;
}

.date {
  color: #999;
}

.comment-text {
  color: #ddd;
  line-height: 1.5;
}
</style>
`;

// Stil ekle
document.head.insertAdjacentHTML('beforeend', commentStyles);
