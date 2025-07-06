// Auth Forms Script - Kayıt ve Giriş modalları için global script

document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth Forms Script yüklendi');

    // Modal kapatma fonksiyonları
    function setupModalClosing() {
        // Register modal kapatma
        const closeRegisterBtn = document.getElementById('close-register-modal');
        const registerModal = document.getElementById('register-modal');
        
        if (closeRegisterBtn && registerModal) {
            closeRegisterBtn.addEventListener('click', function() {
                registerModal.style.display = 'none';
            });
        }

        // Login modal kapatma
        const closeLoginBtn = document.getElementById('close-login-modal');
        const loginModal = document.getElementById('login-modal');
        
        if (closeLoginBtn && loginModal) {
            closeLoginBtn.addEventListener('click', function() {
                loginModal.style.display = 'none';
            });
        }

        // Overlay tıklama ile kapatma - Register modal
        if (registerModal) {
            registerModal.addEventListener('click', function(e) {
                if (e.target === registerModal) {
                    registerModal.style.display = 'none';
                }
            });
        }

        // Overlay tıklama ile kapatma - Login modal
        if (loginModal) {
            loginModal.addEventListener('click', function(e) {
                if (e.target === loginModal) {
                    loginModal.style.display = 'none';
                }
            });
        }

        // ESC tuşu ile kapatma
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (registerModal && registerModal.style.display !== 'none') {
                    registerModal.style.display = 'none';
                }
                if (loginModal && loginModal.style.display !== 'none') {
                    loginModal.style.display = 'none';
                }
            }
        });

        // Modal değiştirme butonları
        const switchToLogin = document.getElementById('switch-to-login');
        const switchToRegister = document.getElementById('switch-to-register');

        if (switchToLogin && registerModal && loginModal) {
            switchToLogin.addEventListener('click', function(e) {
                e.preventDefault();
                registerModal.style.display = 'none';
                loginModal.style.display = 'flex';
            });
        }

        if (switchToRegister && loginModal && registerModal) {
            switchToRegister.addEventListener('click', function(e) {
                e.preventDefault();
                loginModal.style.display = 'none';
                registerModal.style.display = 'flex';
            });
        }
    }

    // Modal kapatma setup'ını çağır
    setupModalClosing();

    // Alert box gösterme fonksiyonu
    function showAlert(message, type = 'error') {
        const alertBox = document.getElementById('alert-box');
        if (alertBox) {
            alertBox.textContent = message;
            alertBox.style.display = 'block';
            
            // Tip'e göre stil
            if (type === 'success') {
                alertBox.style.background = '#4CAF50';
                alertBox.style.color = '#fff';
                alertBox.style.border = 'none';
            } else {
                alertBox.style.background = '#fff';
                alertBox.style.color = '#ff6f61';
                alertBox.style.border = '1.5px solid #ff6f61';
            }
            
            setTimeout(() => {
                alertBox.style.display = 'none';
            }, 3000);
        }
    }

    // Kayıt formu işleme
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;

            if (!username || !email || !password) {
                showAlert('Tüm alanları doldurunuz.');
                return;
            }

            try {
                const response = await fetch('https://toonnekoauth-api.onrender.com/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: username,
                        email: email,
                        password: password
                    })
                });

                if (!response.ok) {
                    // Sunucu hatası varsa, response'u text olarak al
                    const errorText = await response.text();
                    let errorMessage = 'Kayıt başarısız.';
                    
                    try {
                        const errorData = JSON.parse(errorText);
                        errorMessage = errorData.message || errorMessage;
                    } catch (parseError) {
                        console.warn('Error response parse edilemedi:', errorText);
                        errorMessage = `Sunucu hatası (${response.status})`;
                    }
                    
                    showAlert(errorMessage);
                    return;
                }

                const data = await response.json();

                if (response.ok) {
                    showAlert('Kayıt başarılı! Giriş yapabilirsiniz.', 'success');
                    
                    // Modalı kapat
                    const registerModal = document.getElementById('register-modal');
                    if (registerModal) {
                        registerModal.style.display = 'none';
                    }
                    
                    // Formu temizle
                    registerForm.reset();
                    
                    // Login modalı aç
                    setTimeout(() => {
                        const loginModal = document.getElementById('login-modal');
                        if (loginModal) {
                            loginModal.style.display = 'flex';
                        }
                    }, 1000);
                } else {
                    showAlert(data.message || 'Kayıt işlemi başarısız.');
                }
            } catch (error) {
                console.error('Kayıt hatası:', error);
                showAlert('Sunucu hatası. Lütfen tekrar deneyin.');
            }
        });
    }

    // Giriş formu işleme
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const identifier = document.getElementById('login-identifier').value;
            const password = document.getElementById('login-password').value;

            if (!identifier || !password) {
                showAlert('E-posta/kullanıcı adı ve şifre gerekli.');
                return;
            }

            try {
                console.log('Login denemesi başlatılıyor...');
                const response = await fetch('https://toonnekoauth-api.onrender.com/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        identifier: identifier,
                        password: password
                    })
                });

                console.log('Response alındı:', response.status, response.statusText);

                if (!response.ok) {
                    // Sunucu hatası varsa, response'u text olarak al
                    const errorText = await response.text();
                    console.error('Server error response:', errorText);
                    let errorMessage = 'Giriş başarısız.';
                    
                    try {
                        const errorData = JSON.parse(errorText);
                        errorMessage = errorData.message || errorMessage;
                    } catch (parseError) {
                        console.warn('Error response parse edilemedi:', errorText);
                        errorMessage = `Sunucu hatası (${response.status})`;
                    }
                    
                    showAlert(errorMessage);
                    return;
                }

                const data = await response.json();
                console.log('Login response data:', data);

                // Basit token kontrolü
                if (data && data.token && data.user) {
                    console.log('✅ Login başarılı! Token bulundu:', data.token.substring(0, 20) + '...');
                    // Token'ı localStorage'a kaydet
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    showAlert(`Hoş geldin, ${data.user.username}!`, 'success');
                    
                    // Modalı kapat
                    const loginModal = document.getElementById('login-modal');
                    if (loginModal) {
                        loginModal.style.display = 'none';
                    }
                    
                    // Formu temizle
                    loginForm.reset();
                    
                    // Navbar'ı güncelle (auth-navbar.js'deki fonksiyon)
                    console.log('onAuthSuccess çağrılıyor, data:', data);
                    if (typeof window.onAuthSuccess === 'function') {
                        window.onAuthSuccess(data);
                    }
                    
                    // Auth durumu değişti event'ini trigger et
                    window.dispatchEvent(new CustomEvent('authStateChanged', { 
                        detail: { type: 'login', user: data.user } 
                    }));
                } else {
                    console.log('❌ Login başarısız:');
                    console.log('- Data:', data);
                    console.log('- Has token:', !!(data && data.token));
                    console.log('- Has user:', !!(data && data.user));
                    showAlert(data && data.message ? data.message : 'Giriş başarısız.');
                }
            } catch (error) {
                console.error('Giriş hatası:', error);
                showAlert('Sunucu hatası. Lütfen tekrar deneyin.');
            }
        });
    }

    console.log('Auth Forms Script başarıyla kuruldu!');
});

// Yardımcı fonksiyon: API base'i al
function getApiBase() {
  return window.APP_CONFIG?.API_BASE || '/api';
}
