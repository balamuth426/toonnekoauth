// Global Auth Navbar Management
class AuthNavbar {
  constructor() {
    this.init();
  }

  init() {
    this.updateNavbar();
    this.bindEvents();
  }

  // Navbar durumunu güncelle
  updateNavbar() {
    const token = localStorage.getItem('token');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const username = localStorage.getItem('username');

    // Desktop navbar elements
    const authButtonsNav = document.getElementById('auth-buttons-nav');
    const authButtonsNav2 = document.getElementById('auth-buttons-nav-2');
    const userInfoNav = document.getElementById('user-info-nav');
    const userInfoNav2 = document.getElementById('user-info-nav-2');
    
    // Side menu elements
    const sideAuthButtons = document.getElementById('side-auth-buttons');
    const sideUserInfo = document.getElementById('side-user-info');
    const usernameDisplay = document.getElementById('username-display');
    const sideUsernameDisplay = document.getElementById('side-username-display');

    if (token && isLoggedIn && username) {
      // Kullanıcı giriş yapmış
      if (authButtonsNav) authButtonsNav.style.display = 'none';
      if (authButtonsNav2) authButtonsNav2.style.display = 'none';
      if (userInfoNav) userInfoNav.style.display = 'block';
      if (userInfoNav2) userInfoNav2.style.display = 'block';
      if (sideAuthButtons) sideAuthButtons.style.display = 'none';
      if (sideUserInfo) sideUserInfo.style.display = 'block';
      if (usernameDisplay) usernameDisplay.textContent = `Hoş geldin, ${username}`;
      if (sideUsernameDisplay) sideUsernameDisplay.textContent = `Hoş geldin, ${username}`;
    } else {
      // Kullanıcı giriş yapmamış
      if (authButtonsNav) authButtonsNav.style.display = 'block';
      if (authButtonsNav2) authButtonsNav2.style.display = 'block';
      if (userInfoNav) userInfoNav.style.display = 'none';
      if (userInfoNav2) userInfoNav2.style.display = 'none';
      if (sideAuthButtons) sideAuthButtons.style.display = 'block';
      if (sideUserInfo) sideUserInfo.style.display = 'none';
    }
  }

  // Event listener'ları bağla
  bindEvents() {
    // Çıkış butonları
    const logoutBtn = document.getElementById('logout-btn');
    const sideLogoutBtn = document.getElementById('side-logout-btn');

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }

    if (sideLogoutBtn) {
      sideLogoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }

    // Auth modal butonları
    this.bindAuthModalEvents();
  }

  // Auth modal event'lerini bağla
  bindAuthModalEvents() {
    const openRegisterNavbar = document.getElementById('open-register-modal-navbar');
    const openLoginNavbar = document.getElementById('open-login-modal-navbar');
    const openRegisterSide = document.getElementById('open-register-modal-side');
    const openLoginSide = document.getElementById('open-login-modal-side');

    if (openRegisterNavbar) {
      openRegisterNavbar.addEventListener('click', () => {
        const registerModal = document.getElementById('register-modal');
        if (registerModal) {
          registerModal.style.display = 'flex';
        }
      });
    }

    if (openLoginNavbar) {
      openLoginNavbar.addEventListener('click', () => {
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
          loginModal.style.display = 'flex';
        }
      });
    }

    if (openRegisterSide) {
      openRegisterSide.addEventListener('click', () => {
        const registerModal = document.getElementById('register-modal');
        if (registerModal) {
          registerModal.style.display = 'flex';
        }
        this.closeSideMenu();
      });
    }

    if (openLoginSide) {
      openLoginSide.addEventListener('click', () => {
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
          loginModal.style.display = 'flex';
        }
        this.closeSideMenu();
      });
    }
  }

  // Side menu'yu kapat
  closeSideMenu() {
    const sideMenu = document.getElementById('sideMenu');
    const sideOverlay = document.getElementById('sideOverlay');
    if (sideMenu) sideMenu.classList.remove('open');
    if (sideOverlay) sideOverlay.classList.remove('show');
  }

  // Çıkış yap
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('user'); // Bu eksikti!
    localStorage.removeItem('userAvatar'); // Bu da temizlenmeli
    
    // Auth durumu değişti event'ini trigger et
    window.dispatchEvent(new CustomEvent('authStateChanged', { 
      detail: { type: 'logout' } 
    }));
    
    // Mevcut sayfa yoluna göre anasayfaya yönlendir
    const currentPath = window.location.pathname;
    let redirectPath = 'index.html';
    
    // Eğer series klasöründeyse (örn: /client/series/damnreincarnation/)
    if (currentPath.includes('/series/')) {
      redirectPath = '../../index.html';
    }
    // Eğer chapters klasöründeyse (örn: /client/chapters/solo leveling chapters/)
    else if (currentPath.includes('/chapters/')) {
      redirectPath = '../../index.html';
    }
    // Diğer alt klasörler için de kontrol eklenebilir
    
    window.location.href = redirectPath;
  }

  // Login başarılı olduğunda çağrılacak
  onLoginSuccess(userData) {
    console.log('onLoginSuccess çağrıldı, userData:', userData);
    if (!userData) {
      console.error('userData undefined!');
      return;
    }
    if (!userData.token) {
      console.error('userData.token undefined!', userData);
      return;
    }
    
    localStorage.setItem('token', userData.token);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', userData.user ? userData.user.username : userData.username);
    console.log('localStorage güncellendi, navbar güncelleniyor...');
    this.updateNavbar();
  }
}

// Global instance
let authNavbar;

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
  authNavbar = new AuthNavbar();
});

// Global fonksiyonlar diğer scriptler için
window.updateAuthNavbar = function() {
  if (authNavbar) {
    authNavbar.updateNavbar();
  }
};

window.onAuthSuccess = function(userData) {
  console.log('window.onAuthSuccess çağrıldı, userData:', userData);
  if (authNavbar) {
    authNavbar.onLoginSuccess(userData);
  } else {
    console.error('authNavbar instance bulunamadı!');
  }
};
