// Modern, fonksiyonel ve topluluk odaklı yorumlar JS'i
// API endpoint: /api/comments
// Her seri sayfasında kullanılabilir

// Global instance tracker for debugging only
window.ToonNekoCommentsInstances = window.ToonNekoCommentsInstances || [];

class CommentsUI {
  constructor(seriesId, chapterNumber = null) {
    console.log(`🔍 CommentsUI Constructor called:`, { seriesId, chapterNumber });
    this.seriesId = seriesId;
    this.chapterNumber = chapterNumber;
    this.comments = [];
    this.user = this.getCurrentUser();
    this.sortBy = 'newest';
    this.loading = false;
    this.lastCommentTime = 0;
    this.instanceId = `${seriesId}-${chapterNumber || 'all'}-${Date.now()}`;
    console.log(`🆔 Instance ID: ${this.instanceId}`);
    this.init();
  }

  getCurrentUser() {
    try {
      // Önce token kontrolü yap
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔒 Token bulunamadı - kullanıcı giriş yapmamış');
        return null; // Token yoksa kullanıcı giriş yapmamış
      }
      
      // Token'ın geçerli olup olmadığını kontrol et (basit format kontrolü)
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          console.warn('⚠️ Geçersiz token formatı');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return null;
        }
        
        // Token payload'ını decode et (exp kontrolü için)
        const payload = JSON.parse(atob(tokenParts[1]));
        const now = Math.floor(Date.now() / 1000);
        
        if (payload.exp && payload.exp < now) {
          console.warn('⏰ Token süresi dolmuş');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return null;
        }
      } catch (tokenError) {
        console.warn('⚠️ Token decode hatası:', tokenError);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return null;
      }
      
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        // Avatar yolunu normalize et - sadece dosya adını al
        let avatar = user.avatar;
        if (avatar && avatar.includes('/')) {
          avatar = avatar.split('/').pop(); // Son kısmı al (dosya adı)
        }
        console.log('👤 Kullanıcı bilgisi yüklendi:', user.username);
        return {
          username: user.username,
          avatar: avatar
        };
      }
      
      // Fallback - eski sistem ile uyumluluk
      const username = localStorage.getItem('username');
      let avatar = localStorage.getItem('userAvatar');
      if (avatar && avatar.includes('/')) {
        avatar = avatar.split('/').pop();
      }
      return username ? { username, avatar } : null;
    } catch (error) {
      console.error('❌ User data parse hatası:', error);
      // Hatalı data'yı temizle
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  }

  async init() {
    console.log('💬 CommentsUI başlatılıyor:', {
      instanceId: this.instanceId,
      seriesId: this.seriesId,
      chapterNumber: this.chapterNumber,
      user: this.user ? this.user.username : 'Giriş yapmamış',
      url: window.location.href,
      pathname: window.location.pathname
    });
    
    // Track this instance for debugging
    window.ToonNekoCommentsInstances.push({
      instanceId: this.instanceId,
      seriesId: this.seriesId,
      chapterNumber: this.chapterNumber,
      createdAt: new Date()
    });
    
    console.log(`📊 Toplam CommentsUI instances: ${window.ToonNekoCommentsInstances.length}`);
    window.ToonNekoCommentsInstances.forEach((instance, i) => {
      console.log(`   ${i + 1}. Instance: ${instance.instanceId} (${instance.seriesId}/${instance.chapterNumber || 'all'})`);
    });
    
    this.renderSkeleton();
    this.bindFormEvents();
    await this.fetchComments();
    this.renderComments();
    this.bindToolbarEvents();
    
    // Kullanıcı durumunu kontrol et ve UI'ı güncelle
    this.updateAuthUI();
  }
  
  updateAuthUI() {
    const commentForm = document.querySelector('.comment-form');
    const loginPrompt = document.querySelector('.login-prompt');
    
    if (this.user) {
      // Kullanıcı giriş yapmış
      if (commentForm) commentForm.style.display = 'block';
      if (loginPrompt) loginPrompt.style.display = 'none';
    } else {
      // Kullanıcı giriş yapmamış
      if (commentForm) commentForm.style.display = 'none';
      if (loginPrompt) loginPrompt.style.display = 'block';
    }
  }

  renderSkeleton() {
    // Try to find specific container first, then fallback to generic
    const specificContainerId = `comments-${this.seriesId}-${this.chapterNumber || 'all'}`;
    let container = document.getElementById(specificContainerId);
    
    if (!container) {
      container = document.querySelector('.comments-section');
    }
    
    if (!container) {
      console.warn(`⚠️ No comments container found for ${this.seriesId}/${this.chapterNumber}`);
      return;
    }
    
    console.log(`📝 Using container: ${container.id || 'generic .comments-section'} for ${this.seriesId}/${this.chapterNumber}`);
    
    // Generate unique IDs for this instance
    const uniqueId = `${this.seriesId}-${this.chapterNumber || 'all'}`;
    
    container.innerHTML = `
      <div class="comments-title">
        <span>Yorumlarınızı Paylaşın</span>
        <span class="comments-rules">Topluluk kurallarına uygun, saygılı ve yapıcı yorumlar yazınız.</span>
      </div>
      <div class="login-prompt" style="display: none;">
        <div class="login-message">
          <i class="fas fa-sign-in-alt"></i>
          <p>Yorum yapmak için <a href="javascript:void(0)" onclick="window.location.reload()">giriş yapın</a></p>
        </div>
      </div>
      <div class="comment-form">
        <textarea id="comment-textarea-${uniqueId}" placeholder="Yorumunuzu yazın..." rows="4" maxlength="500"></textarea>
        <div class="comment-form-bottom">
          <span id="comment-char-count-${uniqueId}">0/500</span>
          <button id="submit-comment-btn-${uniqueId}">Yorum Yap</button>
        </div>
      </div>
      <div class="comments-toolbar">
        <label for="sort-comments-${uniqueId}">Sırala:</label>
        <select id="sort-comments-${uniqueId}">
          <option value="newest">En Yeni</option>
          <option value="oldest">En Eski</option>
          <option value="top">En Beğenilen</option>
        </select>
      </div>
      <div class="comments-list" id="comments-list-${uniqueId}">
        <div class="comments-loader">Yorumlar yükleniyor...</div>
      </div>
    `;
    
    // Store unique ID for later use
    this.uniqueId = uniqueId;
  }

  bindFormEvents() {
    const textarea = document.getElementById(`comment-textarea-${this.uniqueId}`);
    const charCount = document.getElementById(`comment-char-count-${this.uniqueId}`);
    if (textarea && charCount) {
      textarea.addEventListener('input', () => {
        charCount.textContent = `${textarea.value.length}/500`;
      });
    }
    document.getElementById(`submit-comment-btn-${this.uniqueId}`)?.addEventListener('click', () => this.submitComment());
  }

  bindToolbarEvents() {
    document.getElementById(`sort-comments-${this.uniqueId}`)?.addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.renderComments();
    });
  }

  async fetchComments() {
    this.loading = true;
    try {
      // Bölüm-özel yorumlar varsa bölüm numarası ile API çağrısı yap
      const apiUrl = this.chapterNumber 
        ? `${getApiBase()}/comments/${this.seriesId}/${this.chapterNumber}`
        : `${getApiBase()}/comments/${this.seriesId}`;
      
      // Add cache busting
      const cacheBustingUrl = apiUrl + (apiUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
      
      console.log(`🌐 API çağrısı yapılıyor: ${cacheBustingUrl}`);
      console.log(`📊 Constructor parametreleri: seriesId="${this.seriesId}", chapterNumber=${this.chapterNumber}`);
      console.log(`🎯 Final URL: ${cacheBustingUrl}`);
      
      const res = await fetch(cacheBustingUrl);
      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }
      
      this.comments = await res.json();
      
      console.log(`📝 Yorumlar yüklendi: ${this.instanceId} (${this.comments.length} yorum)`);
      console.log(`📋 Yorum detayları:`, this.comments.map(c => ({
        id: c._id,
        author: c.author,
        text: c.text.substring(0, 50) + '...',
        seriesId: c.seriesId,
        chapterNumber: c.chapterNumber
      })));
      console.log(`� Instance comments array reference:`, this.comments);
    } catch (e) {
      console.error('Yorumlar yüklenirken hata:', e);
      this.comments = [];
    }
    this.loading = false;
  }

  getSortedComments() {
    let arr = [...this.comments];
    if (this.sortBy === 'oldest') arr.sort((a, b) => new Date(a.date) - new Date(b.date));
    else if (this.sortBy === 'top') arr.sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
    else arr.sort((a, b) => new Date(b.date) - new Date(a.date));
    return arr;
  }

  renderComments() {
    // Her render'da kullanıcı bilgisini yenile
    this.user = this.getCurrentUser();
    
    console.log(`🎨 Yorumlar render ediliyor: ${this.uniqueId} (${this.comments.length} yorum)`);
    this.comments.forEach((comment, i) => {
      console.log(`   ${i + 1}. ${comment.author}: "${comment.text.substring(0, 30)}..." (seriesId: ${comment.seriesId}, chapter: ${comment.chapterNumber})`);
    });
    
    const list = document.getElementById(`comments-list-${this.uniqueId}`);
    const count = document.getElementById('comments-count');
    if (count) count.textContent = `(${this.comments.length})`;
    if (!list) return;
    if (this.loading) {
      list.innerHTML = '<div class="comments-loader">Yorumlar yükleniyor...</div>';
      return;
    }
    if (!this.comments.length) {
      list.innerHTML = '<p>Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>';
      return;
    }
    list.innerHTML = this.getSortedComments().map(c => this.renderComment(c)).join('');
    this.bindCommentEvents();
  }

  renderComment(comment) {
    const replies = (comment.replies || []).map(r => {
      const canModifyReply = this.user && this.user.username === r.author;
      return `
        <div class="comment-reply" data-reply-id="${r._id}">
          <img src="${r.avatar ? `../../images/avatars/${r.avatar}` : '../../images/default-avatar.svg'}" class="comment-avatar" onerror="this.src='../../images/default-avatar.svg'" />
          <div class="comment-content">
            <span class="comment-author">${r.author}</span>
            <span class="comment-date">${this.formatDate(r.date)}</span>
            ${r.edited ? '<span class="edited-label">(düzenlendi)</span>' : ''}
            <div class="comment-text" data-original-text="${this.escape(r.text)}">${this.escape(r.text)}</div>
            ${canModifyReply ? `
              <div class="reply-actions">
                <button class="edit-reply-btn" onclick="commentsUI.editReply('${comment._id}', '${r._id}')">Düzenle</button>
                <button class="delete-reply-btn" onclick="commentsUI.deleteReply('${comment._id}', '${r._id}')">Sil</button>
              </div>
            ` : ''}
            ${this.user && !canModifyReply ? `
              <div class="reply-actions">
                <button class="report-reply-btn" onclick="commentsUI.reportReply('${comment._id}', '${r._id}')" title="Yanıtı Rapor Et">🚨</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    const canDelete = this.user && this.user.username === comment.author;
    
    return `
      <div class="comment" data-id="${comment._id}">
        <img src="${comment.avatar ? `../../images/avatars/${comment.avatar}` : '../../images/default-avatar.svg'}" class="comment-avatar" onerror="this.src='../../images/default-avatar.svg'" />
        <div class="comment-content">
          <span class="comment-author">${comment.author}</span>
          <span class="comment-date">${this.formatDate(comment.date)}</span>
          ${comment.edited ? '<span class="edited-label">(düzenlendi)</span>' : ''}
          <div class="comment-text" data-original-text="${this.escape(comment.text)}">${this.escape(comment.text)}</div>
          <div class="comment-actions">
            <button class="like-btn" ${!this.user ? 'disabled' : ''}>👍 <span>${comment.likes}</span></button>
            <button class="dislike-btn" ${!this.user ? 'disabled' : ''}>👎 <span>${comment.dislikes}</span></button>
            <button class="reply-btn" ${!this.user ? 'disabled' : ''}>Yanıtla</button>
            ${canDelete ? '<button class="edit-comment-btn">Düzenle</button>' : ''}
            ${canDelete ? '<button class="delete-btn">Sil</button>' : ''}
            ${this.user && !canDelete ? '<button class="report-btn" title="Yorumu Rapor Et">🚨</button>' : ''}
          </div>
          <div class="replies">${replies}</div>
        </div>
      </div>
    `;
  }

  bindCommentEvents() {
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.onclick = async (e) => {
        const id = btn.closest('.comment').dataset.id;
        await this.likeComment(id, true);
      };
    });
    document.querySelectorAll('.dislike-btn').forEach(btn => {
      btn.onclick = async (e) => {
        const id = btn.closest('.comment').dataset.id;
        await this.likeComment(id, false);
      };
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.onclick = async (e) => {
        const id = btn.closest('.comment').dataset.id;
        await this.deleteComment(id);
      };
    });
    document.querySelectorAll('.edit-comment-btn').forEach(btn => {
      btn.onclick = (e) => {
        const commentDiv = btn.closest('.comment');
        const id = commentDiv.dataset.id;
        this.editComment(id);
      };
    });
    document.querySelectorAll('.reply-btn').forEach(btn => {
      btn.onclick = (e) => {
        const commentDiv = btn.closest('.comment');
        this.showReplyForm(commentDiv);
      };
    });
    
    // Rapor butonları için event listener'lar
    document.querySelectorAll('.report-btn').forEach(btn => {
      btn.onclick = (e) => {
        const commentDiv = btn.closest('.comment');
        const commentId = commentDiv.dataset.id;
        this.reportComment(commentId);
      };
    });
  }

  async submitComment() {
    // Token ve kullanıcı kontrolü
    const token = localStorage.getItem('token');
    if (!token || !this.user) {
      this.showAlert('Yorum yapmak için giriş yapmalısınız. Sayfayı yenileyip tekrar deneyin.', 'error');
      return;
    }
    
    const textarea = document.getElementById(`comment-textarea-${this.uniqueId}`);
    const text = textarea.value.trim();
    if (!text) return this.showAlert('Yorumunuzu yazın.', 'error');
    if (text.length > 500) return this.showAlert('Yorum 500 karakteri geçemez.', 'error');
    
    // Rate limit: 30 saniyede bir
    const now = Date.now();
    if (now - this.lastCommentTime < 30000) {
      return this.showAlert('Çok hızlı yorum yapıyorsunuz. Lütfen biraz bekleyin.', 'error');
    }
    this.lastCommentTime = now;
    
    try {
      console.log('💬 Yorum gönderiliyor:', {
        seriesId: this.seriesId,
        chapterNumber: this.chapterNumber,
        text: text.substring(0, 50) + '...',
        user: this.user.username
      });
      
      const res = await fetch(`${getApiBase()}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          seriesId: this.seriesId,
          text,
          chapterNumber: this.chapterNumber
        })
      });
      
      if (!res.ok) {
        const responseText = await res.text();
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { error: responseText };
        }
        
        console.error('❌ Yorum gönderme hatası:', {
          status: res.status,
          statusText: res.statusText,
          error: errorData
        });
        
        // 401 özel handling
        if (res.status === 401) {
          this.showAlert('Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.', 'error');
          // Token'ı temizle
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Sayfayı yenile
          setTimeout(() => window.location.reload(), 2000);
          return;
        }
        
        throw new Error(errorData.error || `Yorum eklenemedi (${res.status})`);
      }
      
      const newComment = await res.json();
      textarea.value = '';
      const charCountElement = document.getElementById(`comment-char-count-${this.uniqueId}`);
      if (charCountElement) charCountElement.textContent = '0/500';
      await this.fetchComments();
      this.renderComments();
      this.showAlert('Yorumunuz başarıyla eklendi!', 'success');
    } catch (e) {
      console.error('submitComment - Error:', e);
      this.showAlert(`Hata: ${e.message}`, 'error');
    }
  }

  async likeComment(id, like) {
    if (!this.user) return this.showAlert('Giriş yapmalısınız.', 'error');
    try {
      await fetch(`http://localhost:5506/api/comments/${id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ like })
      });
      await this.fetchComments();
      this.renderComments();
    } catch (e) {
      this.showAlert('İşlem başarısız.', 'error');
    }
  }

  async deleteComment(id) {
    if (!this.user) return this.showAlert('Giriş yapmalısınız.', 'error');
    if (!confirm('Yorumu silmek istediğinize emin misiniz?')) return;
    try {
      await fetch(`http://localhost:5506/api/comments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      await this.fetchComments();
      this.renderComments();
      this.showAlert('Yorum silindi.', 'success');
    } catch (e) {
      this.showAlert('Silinemedi.', 'error');
    }
  }

  showReplyForm(commentDiv) {
    if (commentDiv.querySelector('.reply-form')) return;
    const form = document.createElement('div');
    form.className = 'reply-form';
    form.innerHTML = `
      <textarea rows="2" placeholder="Yanıt yaz..."></textarea>
      <button class="send-reply-btn">Gönder</button>
      <button class="cancel-reply-btn">İptal</button>
    `;
    commentDiv.querySelector('.replies').prepend(form);
    form.querySelector('.send-reply-btn').onclick = async () => {
      const text = form.querySelector('textarea').value.trim();
      if (!text) return this.showAlert('Yanıtınızı yazın.', 'error');
      await this.sendReply(commentDiv.dataset.id, text);
      form.remove();
    };
    form.querySelector('.cancel-reply-btn').onclick = () => form.remove();
  }

  async sendReply(commentId, text) {
    if (!this.user) return this.showAlert('Giriş yapmalısınız.', 'error');
    try {
      await fetch(`http://localhost:5506/api/comments/${commentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ text })
      });
      await this.fetchComments();
      this.renderComments();
      this.showAlert('Yanıt eklendi.', 'success');
    } catch (e) {
      this.showAlert('Yanıt eklenemedi.', 'error');
    }
  }

  formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  escape(str) {
    return str.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  showAlert(msg, type = 'info') {
    // Eğer sayfa kendi showNotification fonksiyonuna sahipse, onu kullan
    if (typeof showNotification === 'function') {
      showNotification(msg, type);
      return;
    }
    
    // Yoksa kendi alert sistemini kullan
    let box = document.getElementById('alert-box');
    if (!box) {
      box = document.createElement('div');
      box.id = 'alert-box';
      document.body.appendChild(box);
    }
    box.textContent = msg;
    box.style.position = 'fixed';
    box.style.top = '20px';
    box.style.right = '20px';
    box.style.background = type === 'success' ? '#4caf50' : type === 'error' ? '#e85c50' : '#444';
    box.style.color = '#fff';
    box.style.padding = '10px 16px';
    box.style.borderRadius = '6px';
    box.style.zIndex = 9999;
    box.style.fontSize = '0.9rem';
    box.style.maxWidth = '300px';
    box.style.wordWrap = 'break-word';
    box.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)';
    box.style.display = 'block';
    box.style.opacity = '1';
    box.style.transition = 'opacity 0.3s ease';
    
    // 1.5 saniye sonra soluklaştır, 2 saniye sonra gizle
    setTimeout(() => { box.style.opacity = '0.7'; }, 1500);
    setTimeout(() => { box.style.display = 'none'; box.style.opacity = '1'; }, 2000);
  }

  // Yanıt silme
  async deleteReply(commentId, replyId) {
    if (!this.user) return this.showAlert('Giriş yapmalısınız.', 'error');
    if (!confirm('Bu yanıtı silmek istediğinizden emin misiniz?')) return;
    
    try {
      const res = await fetch(`http://localhost:5506/api/comments/${commentId}/reply/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (!res.ok) throw new Error('Yanıt silinemedi');
      
      await this.fetchComments();
      this.renderComments();
      this.showAlert('Yanıt silindi.', 'success');
    } catch (err) {
      this.showAlert('Yanıt silinemedi.', 'error');
    }
  }

  // Yanıt düzenleme
  async editReply(commentId, replyId) {
    if (!this.user) return this.showAlert('Giriş yapmalısınız.', 'error');
    
    const replyDiv = document.querySelector(`[data-reply-id="${replyId}"]`);
    if (!replyDiv) return;
    
    const textDiv = replyDiv.querySelector('.comment-text');
    const originalText = textDiv.dataset.originalText;
    
    // Düzenleme formunu göster
    const editForm = document.createElement('div');
    editForm.className = 'edit-reply-form';
    editForm.innerHTML = `
      <textarea class="edit-reply-textarea" maxlength="500">${originalText}</textarea>
      <div class="edit-reply-actions">
        <button class="save-edit-btn">Kaydet</button>
        <button class="cancel-edit-btn">İptal</button>
      </div>
    `;
    
    textDiv.style.display = 'none';
    replyDiv.querySelector('.reply-actions').style.display = 'none';
    textDiv.parentNode.appendChild(editForm);
    
    const textarea = editForm.querySelector('.edit-reply-textarea');
    textarea.focus();
    
    // Kaydet butonu
    editForm.querySelector('.save-edit-btn').onclick = async () => {
      const newText = textarea.value.trim();
      if (!newText) return this.showAlert('Yanıt boş olamaz.', 'error');
      
      try {
        const res = await fetch(`http://localhost:5506/api/comments/${commentId}/reply/${replyId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({ text: newText })
        });
        
        if (!res.ok) throw new Error('Yanıt düzenlenemedi');
        
        await this.fetchComments();
        this.renderComments();
        this.showAlert('Yanıt düzenlendi.', 'success');
      } catch (err) {
        this.showAlert('Yanıt düzenlenemedi.', 'error');
      }
    };
    
    // İptal butonu
    editForm.querySelector('.cancel-edit-btn').onclick = () => {
      editForm.remove();
      textDiv.style.display = 'block';
      replyDiv.querySelector('.reply-actions').style.display = 'block';
    };
  }

  // Ana yorum düzenleme
  async editComment(commentId) {
    if (!this.user) return this.showAlert('Giriş yapmalısınız.', 'error');
    
    const commentDiv = document.querySelector(`[data-id="${commentId}"]`);
    if (!commentDiv) return;
    
    const textDiv = commentDiv.querySelector('.comment-text');
    const originalText = textDiv.dataset.originalText;
    
    // Düzenleme formunu göster
    const editForm = document.createElement('div');
    editForm.className = 'edit-comment-form';
    editForm.innerHTML = `
      <textarea class="edit-comment-textarea" maxlength="500">${originalText}</textarea>
      <div class="edit-comment-actions">
        <button class="save-comment-edit-btn">Kaydet</button>
        <button class="cancel-comment-edit-btn">İptal</button>
      </div>
    `;
    
    textDiv.style.display = 'none';
    commentDiv.querySelector('.comment-actions').style.display = 'none';
    textDiv.parentNode.appendChild(editForm);
    
    const textarea = editForm.querySelector('.edit-comment-textarea');
    textarea.focus();
    
    // Kaydet butonu
    editForm.querySelector('.save-comment-edit-btn').onclick = async () => {
      const newText = textarea.value.trim();
      if (!newText) return this.showAlert('Yorum boş olamaz.', 'error');
      
      try {
        const res = await fetch(`http://localhost:5506/api/comments/${commentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({ text: newText })
        });
        
        if (!res.ok) throw new Error('Yorum düzenlenemedi');
        
        await this.fetchComments();
        this.renderComments();
        this.showAlert('Yorum düzenlendi.', 'success');
      } catch (err) {
        this.showAlert('Yorum düzenlenemedi.', 'error');
      }
    };
    
    // İptal butonu
    editForm.querySelector('.cancel-comment-edit-btn').onclick = () => {
      editForm.remove();
      textDiv.style.display = 'block';
      commentDiv.querySelector('.comment-actions').style.display = 'block';
    };
  }

  // Yorum rapor etme
  async reportComment(commentId) {
    if (!this.user) {
      this.showAlert('Rapor etmek için giriş yapmalısınız.', 'error');
      return;
    }

    const reportModal = this.createReportModal(commentId);
    document.body.appendChild(reportModal);
  }

  // Yanıt rapor etme
  async reportReply(commentId, replyId) {
    if (!this.user) {
      this.showAlert('Rapor etmek için giriş yapmalısınız.', 'error');
      return;
    }

    const reportModal = this.createReportModal(commentId, replyId);
    document.body.appendChild(reportModal);
  }

  // Rapor modalı oluştur
  createReportModal(commentId, replyId = null) {
    const modal = document.createElement('div');
    modal.className = 'report-modal';
    modal.innerHTML = `
      <div class="report-modal-content">
        <div class="report-modal-header">
          <h3>${replyId ? 'Yanıtı Rapor Et' : 'Yorumu Rapor Et'}</h3>
          <button class="report-modal-close">&times;</button>
        </div>
        <div class="report-modal-body">
          <p>Bu ${replyId ? 'yanıt' : 'yorum'} neden uygunsuz?</p>
          <div class="report-reasons">
            <label><input type="radio" name="reason" value="spam"> Spam/Reklam</label>
            <label><input type="radio" name="reason" value="harassment"> Taciz/Zorbalık</label>
            <label><input type="radio" name="reason" value="hate-speech"> Nefret Söylemi</label>
            <label><input type="radio" name="reason" value="inappropriate"> Uygunsuz İçerik</label>
            <label><input type="radio" name="reason" value="misinformation"> Yanlış Bilgi</label>
            <label><input type="radio" name="reason" value="other"> Diğer</label>
          </div>
          <textarea 
            placeholder="Ek açıklama (opsiyonel)..." 
            class="report-description"
            maxlength="200"
          ></textarea>
        </div>
        <div class="report-modal-footer">
          <button class="report-cancel-btn">İptal</button>
          <button class="report-submit-btn">Rapor Gönder</button>
        </div>
      </div>
    `;

    // Modal event listeners
    modal.querySelector('.report-modal-close').onclick = () => modal.remove();
    modal.querySelector('.report-cancel-btn').onclick = () => modal.remove();
    
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };

    modal.querySelector('.report-submit-btn').onclick = async () => {
      const reason = modal.querySelector('input[name="reason"]:checked');
      if (!reason) {
        this.showAlert('Lütfen bir rapor nedeni seçin.', 'error');
        return;
      }

      const description = modal.querySelector('.report-description').value.trim();
      
      try {
        const response = await fetch('http://localhost:5506/api/reports/report-comment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            commentId,
            replyId,
            reason: reason.value,
            description,
            seriesId: this.seriesId,
            chapterNumber: this.chapterNumber
          })
        });

        const result = await response.json();
        
        if (response.ok) {
          this.showAlert(result.message, 'success');
          modal.remove();
        } else {
          this.showAlert(result.error || 'Rapor gönderilemedi.', 'error');
        }
      } catch (error) {
        console.error('Report error:', error);
        this.showAlert('Rapor gönderilirken hata oluştu.', 'error');
      }
    };

    return modal;
  }
}

// Yardımcı fonksiyon: API base'i al
function getApiBase() {
  return window.APP_CONFIG?.API_BASE || '/api';
}

// Global debugging
console.log('📦 CommentsUI class loaded, preventing global pollution');

// Make sure no global variables are accidentally shared
if (typeof window !== 'undefined') {
  // Clear any potential global comment state
  window.commentsData = undefined;
  window.currentComments = undefined;
  window.sharedComments = undefined;
  
  console.log('🧹 Global comment state cleared');
}

// Kullanım: yeni seri sayfasında
// const comments = new CommentsUI('sololeveling');
