/**
 * Announcement Manager - Ana sayfada duyuru yönetimi
 */

class AnnouncementManager {
  constructor() {
    console.log('🎯 AnnouncementManager constructor called');
    this.announcementSection = document.getElementById('announcement-section');
    this.announcementContent = document.getElementById('announcement-content');
    this.announcementDate = document.getElementById('announcement-date');
    this.closeButton = document.getElementById('close-announcement');
    
    console.log('🔍 Elements found:');
    console.log('  - announcementSection:', !!this.announcementSection, this.announcementSection);
    console.log('  - announcementContent:', !!this.announcementContent, this.announcementContent);
    console.log('  - announcementDate:', !!this.announcementDate);
    console.log('  - closeButton:', !!this.closeButton);
    
    this.init();
  }

  async init() {
    await this.loadActiveAnnouncement();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Duyuru kapatma
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => {
        this.hideAnnouncement();
      });
    }
  }

  async loadActiveAnnouncement() {
    try {
      console.log('🔄 Loading active announcement...');
      const apiBase = window.APP_CONFIG?.API_BASE || '/api';
      const response = await fetch(`${apiBase}/announcements/active`);
      
      console.log('📊 Response status:', response.status);
      console.log('📋 Response headers:', [...response.headers.entries()]);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Response data:', data);
        
        if (data.success && data.announcement) {
          console.log('✅ Displaying announcement:', data.announcement.title);
          this.displayAnnouncement(data.announcement);
        } else {
          console.log('❌ No active announcement found');
          this.hideAnnouncement();
        }
      } else {
        const errorText = await response.text();
        console.warn('⚠️ Aktif duyuru getirilemedi:', response.status, errorText);
        this.hideAnnouncement();
      }
    } catch (error) {
      console.error('❌ Duyuru yüklenirken hata:', error);
      this.hideAnnouncement();
    }
  }

  displayAnnouncement(announcement) {
    console.log('🎯 displayAnnouncement called with:', announcement);
    console.log('🔍 announcementSection exists:', !!this.announcementSection);
    console.log('🔍 announcementContent exists:', !!this.announcementContent);
    
    if (!this.announcementSection || !this.announcementContent) {
      console.log('❌ Required elements not found!');
      console.log('🔍 announcementSection:', this.announcementSection);
      console.log('🔍 announcementContent:', this.announcementContent);
      return;
    }

    // İçerik güvenliği için HTML escape
    const content = this.escapeHtml(announcement.content);
    console.log('📝 Escaped content:', content);
    
    // Duyuru içeriğini ayarla
    this.announcementContent.innerHTML = content;
    console.log('✅ Content set to announcementContent');
    
    // Tarih bilgisini ayarla
    if (this.announcementDate && announcement.createdAt) {
      const date = new Date(announcement.createdAt);
      const formattedDate = date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      this.announcementDate.textContent = formattedDate;
      console.log('📅 Date set:', formattedDate);
    }

    // Duyuru tipine göre stil uygula
    this.applyAnnouncementStyle(announcement.type);
    console.log('🎨 Style applied for type:', announcement.type);
    
    // Duyuruyu göster
    this.showAnnouncement();
    console.log('👁️ showAnnouncement called');
  }

  applyAnnouncementStyle(type) {
    if (!this.announcementSection) return;

    // Önceki tip sınıflarını temizle
    this.announcementSection.classList.remove('announcement-info', 'announcement-warning', 'announcement-success');
    
    // Yeni tip sınıfını ekle
    switch (type) {
      case 'warning':
        this.announcementSection.classList.add('announcement-warning');
        break;
      case 'success':
        this.announcementSection.classList.add('announcement-success');
        break;
      case 'info':
      default:
        this.announcementSection.classList.add('announcement-info');
        break;
    }
  }

  showAnnouncement() {
    console.log('👁️ showAnnouncement called');
    if (this.announcementSection) {
      console.log('✅ Setting display to block');
      this.announcementSection.style.display = 'block';
      
      // Animasyon için küçük bir gecikme
      setTimeout(() => {
        console.log('✨ Adding announcement-visible class');
        this.announcementSection.classList.add('announcement-visible');
      }, 50);
    } else {
      console.log('❌ announcementSection not found in showAnnouncement');
    }
  }

  hideAnnouncement() {
    if (this.announcementSection) {
      this.announcementSection.classList.remove('announcement-visible');
      
      // Animasyon tamamlandıktan sonra gizle
      setTimeout(() => {
        this.announcementSection.style.display = 'none';
      }, 300);
    }
  }

  // HTML escape için basit fonksiyon
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Manuel olarak duyuru yenileme
  async refreshAnnouncement() {
    await this.loadActiveAnnouncement();
  }
}

// Sayfa yüklendiğinde duyuru yöneticisini başlat
document.addEventListener('DOMContentLoaded', () => {
  window.announcementManager = new AnnouncementManager();
});

// Fallback - eğer DOMContentLoaded kaçırıldıysa
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.announcementManager) {
    }
  });
} else {
  // DOM zaten hazır
  if (!window.announcementManager) {
  }
}
