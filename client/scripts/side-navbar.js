// Duplicate loading guard
if (window.sideNavbarInitialized) {
  console.log('side-navbar.js already loaded, skipping...');
} else {
  window.sideNavbarInitialized = true;
  
  // DOM ready kontrolü
  function initSideNavbar() {
    const hamburger = document.querySelector('.hamburger');
    const sideMenu = document.getElementById('sideMenu');
    const closeMenu = document.getElementById('closeMenu');
    const sideOverlay = document.getElementById('sideOverlay');
    
    console.log('Side navbar elements:', { hamburger, sideMenu, closeMenu, sideOverlay });

function openMenu() {
  sideMenu.classList.add('open');
  sideOverlay.classList.add('active');
  hamburger.classList.add('active');
  document.body.style.overflow = 'hidden'; // Sayfanın scroll olmasını engelle
  
  // Arama sonuçlarını gizle
  const searchResults = document.getElementById('search-results');
  if (searchResults) {
    searchResults.classList.add('hidden');
  }
  
  setTimeout(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
  }, 10);
}

function closeSideMenu() {
  sideMenu.classList.remove('open');
  sideOverlay.classList.remove('active');
  hamburger.classList.remove('active');
  document.body.style.overflow = ''; // Scroll'u geri aç
  
  // Arama input'unu temizle ve sonuçları gizle
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  if (searchInput) {
    searchInput.value = '';
  }
  if (searchResults) {
    searchResults.classList.add('hidden');
  }
  
  document.removeEventListener('mousedown', handleOutsideClick);
  document.removeEventListener('touchstart', handleOutsideClick);
}

function handleOutsideClick(e) {
  if (
    sideMenu.classList.contains('open') &&
    !sideMenu.contains(e.target) &&
    !hamburger.contains(e.target)
  ) {
    closeSideMenu();
  }
}

if (hamburger && sideMenu && closeMenu && sideOverlay) {
  // Hamburger click/touch events
  hamburger.addEventListener('click', function() {
    if (sideMenu.classList.contains('open')) {
      closeSideMenu();
    } else {
      openMenu();
    }
  });
  
  // Touch event for mobile
  hamburger.addEventListener('touchend', function(e) {
    e.preventDefault(); // Prevent double click
    if (sideMenu.classList.contains('open')) {
      closeSideMenu();
    } else {
      openMenu();
    }
  });
  
  closeMenu.addEventListener('click', closeSideMenu);
  closeMenu.addEventListener('touchend', closeSideMenu);
  
  sideOverlay.addEventListener('click', closeSideMenu);
  sideOverlay.addEventListener('touchend', closeSideMenu);
  
  // Escape key to close
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeSideMenu();
  });
  
  // Swipe to close (left swipe on menu)
  let touchStartX = 0;
  sideMenu.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    });
    
      sideMenu.addEventListener('touchend', function(e) {
        const touchEndX = e.changedTouches[0].clientX;
        const swipeDistance = touchStartX - touchEndX;
        
        // If swiped left more than 50px, close menu
        if (swipeDistance > 50) {
          closeSideMenu();
        }
      });
    }
  }
  
  // DOM ready kontrolü ile init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSideNavbar);
  } else {
    initSideNavbar();
  }
}
