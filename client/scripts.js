console.log('Welcome to My Manhwa Site!');

document.addEventListener("DOMContentLoaded", function() {
  // Uyarı kutusu fonksiyonu
  window.showAlert = function(msg, type = 'error') {
    const box = document.getElementById('alert-box');
    if (!box) return;
    box.textContent = msg;
    box.style.display = 'block';
    box.style.background = type === 'success' ? '#e8fff3' : '#fff';
    box.style.color = type === 'success' ? '#1a7f4f' : '#ff6f61';
    box.style.borderColor = type === 'success' ? '#1a7f4f' : '#ff6f61';
    box.style.opacity = '1';
    setTimeout(() => {
      box.style.opacity = '0';
      setTimeout(() => { box.style.display = 'none'; }, 400);
    }, 3500);
  };
  
  // Auth formları auth-forms.js'te handle ediliyor
  
  // Çıkış yap
  
  // Logout ve Auth UI auth-navbar.js'te handle ediliyor
  
  // Event listener for Register button
  const registerButton = document.getElementById('register-button');
  if (registerButton) {
    registerButton.addEventListener('click', () => {
      const registerModal = document.getElementById('register-modal');
      if (registerModal) {
        registerModal.style.display = 'block';
      }
    });
  }

  // Event listener for Login button
  const loginButton = document.getElementById('login-button');
  if (loginButton) {
    loginButton.addEventListener('click', () => {
      const loginModal = document.getElementById('login-modal');
      if (loginModal) {
        loginModal.style.display = 'block';
      }
    });
  }

  // Debugging modal visibility
  console.log('Register Modal:', document.getElementById('register-modal').style.display);
  console.log('Login Modal:', document.getElementById('login-modal').style.display);

  // Debugging event listeners
  if (registerButton) {
    registerButton.addEventListener('click', () => {
      console.log('Register button clicked');
      const registerModal = document.getElementById('register-modal');
      if (registerModal) {
        registerModal.style.display = 'block';
        console.log('Register modal opened');
      } else {
        console.log('Register modal not found');
      }
    });
  }

  if (loginButton) {
    loginButton.addEventListener('click', () => {
      console.log('Login button clicked');
      const loginModal = document.getElementById('login-modal');
      if (loginModal) {
        loginModal.style.display = 'block';
        console.log('Login modal opened');
      } else {
        console.log('Login modal not found');
      }
    });
  }

  // Event listeners for different register button IDs
  const registerButtons = [
    'register-button',
    'open-register-modal-navbar', 
    'open-register-modal-side',
    'open-register-modal-from-login'
  ];
  
  registerButtons.forEach(buttonId => {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const registerModal = document.getElementById('register-modal');
        if (registerModal) {
          registerModal.style.display = 'flex';
          console.log('Register modal opened from:', buttonId);
        }
      });
    }
  });

  // Event listeners for different login button IDs
  const loginButtons = [
    'login-button',
    'open-login-modal-navbar',
    'open-login-modal-side', 
    'open-login-modal-from-register'
  ];
  
  loginButtons.forEach(buttonId => {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
          loginModal.style.display = 'flex';
          console.log('Login modal opened from:', buttonId);
        }
      });
    }
  });

  // Event listeners for closing modals
  const closeButtons = [
    'close-register-modal',
    'close-login-modal',
    'close-logout-modal'
  ];
  
  closeButtons.forEach(buttonId => {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener('click', () => {
        const modal = button.closest('.modal');
        if (modal) {
          modal.style.display = 'none';
        }
      });
    }
  });

  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
});
