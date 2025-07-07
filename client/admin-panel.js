// API Base URL - local development için
        const API_BASE = location.hostname === 'localhost'
  ? 'http://localhost:5506/api'
  : 'https://toonnekoauth-api.onrender.com/api';
        
        // Giriş kontrolü
        function checkAuthentication() {
            const token = localStorage.getItem('token');
            if (!token) {
                // Ana içeriği gizle
                document.querySelector('.admin-container').style.display = 'none';
                // Giriş sayfasına yönlendir veya giriş modalı göster
                showLoginForm();
                return false;
            }
            return true;
        }

        // Basit giriş formu göster
        function showLoginForm() {
            const loginHtml = `
                <div id="login-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center;">
                    <div style="background: white; padding: 30px; border-radius: 15px; width: 400px; max-width: 90%;">
                        <h2 style="text-align: center; margin-bottom: 20px; color: #333;">Admin Paneli Girişi</h2>
                        <form id="admin-login-form">
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Kullanıcı Adı veya Email:</label>
                                <input type="text" id="admin-username" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" required>
                            </div>
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Şifre:</label>
                                <input type="password" id="admin-password" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" required>
                            </div>
                            <button type="submit" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">Giriş Yap</button>
                            <div id="login-error" style="color: #dc3545; text-align: center; margin-top: 10px; display: none;"></div>
                        </form>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', loginHtml);
            
            document.getElementById('admin-login-form').addEventListener('submit', handleAdminLogin);
        }
        
        // Admin girişi işle
        async function handleAdminLogin(e) {
            e.preventDefault();
            
            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;
            const errorDiv = document.getElementById('login-error');
            
        try {
            const response = await fetch('http://localhost:5506/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ identifier: username, password })
            });
            
            const data = await response.json();
            
            if (response.ok && data.token) {
                // Admin kontrolü
                if (!data.user.isAdmin) {
                    errorDiv.textContent = 'Bu hesap admin yetkisine sahip değil.';
                    errorDiv.style.display = 'block';
                    return;
                }
                
                localStorage.setItem('token', data.token);
                document.getElementById('login-overlay').remove();
                
                // Ana içeriği göster
                document.querySelector('.admin-container').style.display = 'block';
                
                // Hoş geldin mesajı
                alert(`Hoş geldiniz, ${data.user.username}!`);
            } else {
                errorDiv.textContent = data.message || 'Giriş başarısız';
                errorDiv.style.display = 'block';
            }
        } 
        catch (error) {
            errorDiv.textContent = 'Giriş yapılırken hata oluştu: ' + error.message;
            errorDiv.style.display = 'block';
        }
        
        // Google Drive Helper Functions
        function extractFileId(driveUrl) {
            const match = driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            return match ? match[1] : null;
        }
        
        function createProxyUrl(fileId) {
            return `${API_BASE}/image/proxy-image/${fileId}`;
        }
        
        function createDirectUrls(fileId) {
            return {
                proxy: `${API_BASE}/image/proxy-image/${fileId}`,
                high: `https://drive.google.com/uc?export=view&id=${fileId}`,
                download: `https://drive.usercontent.google.com/download?id=${fileId}&authuser=0`,
                medium: `https://drive.google.com/uc?id=${fileId}`,
                thumbnail: `https://drive.google.com/thumbnail?id=${fileId}&sz=s1600`
            }
        }
        
        // Tab switching
        function switchTab(tabName) {
            // Remove active class from all tabs
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none';
            });
            
            // Add active class to selected tab
            event.target.classList.add('active');
            const targetTab = document.getElementById(tabName + '-tab');
            targetTab.classList.add('active');
            targetTab.style.display = 'block';
            
            // Manage tab açıldığında serileri yükle
            if (tabName === 'manage') {
                loadSeriesList();
            }
            
            // Chapter tab açıldığında serileri yükle
            if (tabName === 'chapter') {
                loadChapterSeriesList();
            }
            
            // Edit tab açıldığında serileri yükle
            if (tabName === 'edit') {
                loadEditSeriesList();
            }
            
            // Delete tab açıldığında serileri yükle
            if (tabName === 'delete') {
                loadDeleteSeriesList();
            }
            
            // Comments tab açıldığında verileri yükle
            if (tabName === 'comments') {
                loadReportsStats();
                loadReports();
                loadCommentsSeriesList();
            }
            
            // Stats tab açıldığında istatistikleri yükle
            if (tabName === 'stats') {
                loadStatsOverview();
                loadDetailedStats();
                loadStatsSeriesList();
            }
            
            // Announcements tab açıldığında duyuruları yükle
            if (tabName === 'announcements') {
                loadAnnouncements();
            }
        }

        // Show status message
        function showStatus(message, type) {
            const statusDiv = document.getElementById('status-message');
            statusDiv.textContent = message;
            statusDiv.className = `status-message ${type}`;
            statusDiv.style.display = 'block';
            
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }

        // Show/hide loading
        function toggleLoading(show) {
            document.getElementById('loading').style.display = show ? 'block' : 'none';
        }

        // Show/hide loading (alias for consistency)
        function showLoading(show) {
            toggleLoading(show);
        }

        // Get auth token (assuming it's stored in localStorage)
        function getAuthToken() {
            // Test için varsayılan token
            return localStorage.getItem('token') || 'test-admin-token-for-development';
        }

        // Image input management
        function addImageInput() {
            const container = document.getElementById('image-inputs');
            const inputCount = container.children.length;
            
            const newInputDiv = document.createElement('div');
            newInputDiv.className = 'image-input-item';
            newInputDiv.innerHTML = `
                <input type="url" placeholder="Sayfa ${inputCount + 1} Google Drive linki" required>
                <button type="button" class="btn btn-danger btn-small" onclick="removeImageInput(this)">Sil</button>
            `;
            
            container.appendChild(newInputDiv);
        }

        function removeImageInput(button) {
            const container = document.getElementById('image-inputs');
            if (container.children.length > 1) {
                button.parentElement.remove();
                
                // Update placeholders
                const inputs = container.querySelectorAll('input');
                inputs.forEach((input, index) => {
                    input.placeholder = `Sayfa ${index + 1} Google Drive linki`;
                });
            }
        }

        // Cover image validation
        async function validateCoverImage() {
            const coverUrl = document.getElementById('series-cover').value;
            if (!coverUrl) {
                showStatus('Lütfen kapak görseli linkini girin', 'error');
                return;
            }

            const fileId = extractFileId(coverUrl);
            if (!fileId) {
                showStatus('Geçersiz Google Drive link formatı!', 'error');
                return;
            }

            toggleLoading(true);
            showStatus(`File ID: ${fileId} - Test başlatılıyor...`, 'info');
            
            try {
                // Test multiple URL formats
                const proxyUrl = `${API_BASE}/image/proxy-image/${fileId}`;
                const directUrls = createDirectUrls(fileId);
                
                console.log('Testing URLs:', { proxyUrl, directUrls });
                
                // Clear previous preview
                const previewDiv = document.getElementById('cover-preview');
                previewDiv.innerHTML = `
                    <h4>Görsel Test Sonuçları:</h4>
                    <div id="test-results"></div>
                `;
                previewDiv.style.display = 'block';
                
                const resultsDiv = document.getElementById('test-results');
                
                // Test proxy URL first (recommended)
                await testImageFormat(resultsDiv, 'Server Proxy (Önerilen)', proxyUrl, true);
                
                // Test direct formats
                await testImageFormat(resultsDiv, 'High Quality Direct', directUrls.high, false);
                await testImageFormat(resultsDiv, 'Download Format', directUrls.download, false);
                await testImageFormat(resultsDiv, 'Medium Quality', directUrls.medium, false);
                
            } catch (error) {
                showStatus('Doğrulama sırasında hata oluştu: ' + error.message, 'error');
                console.error('Validation error:', error);
            }
            
            toggleLoading(false);
        }
        
        async function testImageFormat(container, formatName, url, isRecommended) {
            return new Promise((resolve) => {
                const testDiv = document.createElement('div');
                testDiv.style.cssText = `
                    margin: 10px 0; 
                    padding: 10px; 
                    border: 1px solid #ddd; 
                    border-radius: 5px;
                    background: ${isRecommended ? '#e8f5e8' : '#f8f9fa'};
                `;
                
                testDiv.innerHTML = `
                    <h5>${isRecommended ? '🛡️' : '🌐'} ${formatName}</h5>
                    <div style="font-size: 12px; color: #666; word-break: break-all; margin: 5px 0;">${url}</div>
                    <p id="status-${formatName.replace(/\s+/g, '-').toLowerCase()}">Test ediliyor...</p>
                    <div id="image-container-${formatName.replace(/\s+/g, '-').toLowerCase()}"></div>
                `;
                
                container.appendChild(testDiv);
                
                const statusEl = document.getElementById(`status-${formatName.replace(/\s+/g, '-').toLowerCase()}`);
                const imgContainer = document.getElementById(`image-container-${formatName.replace(/\s+/g, '-').toLowerCase()}`);
                
                const img = new Image();
                img.style.cssText = 'max-width: 200px; max-height: 200px; border: 2px solid #ddd; border-radius: 5px; margin-top: 10px;';
                
                const startTime = Date.now();
                
                img.onload = function() {
                    const loadTime = Date.now() - startTime;
                    img.style.borderColor = '#28a745';
                    statusEl.innerHTML = `✅ Başarılı! (${loadTime}ms)<br><small>${img.naturalWidth} x ${img.naturalHeight}px</small>`;
                    imgContainer.appendChild(img);
                    
                    if (isRecommended) {
                        showStatus(`✅ Kapak görseli başarıyla yüklendi! (${formatName})`, 'success');
                    }
                    resolve(true);
                };
                
                img.onerror = function() {
                    const loadTime = Date.now() - startTime;
                    img.style.borderColor = '#dc3545';
                    statusEl.innerHTML = `❌ Yüklenemedi (${loadTime}ms)<br><small>CORS veya erişim hatası</small>`;
                    
                    // Show error placeholder
                    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNmM3NTdkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPkVycm9yPC90ZXh0Pjwvc3ZnPg==';
                    imgContainer.appendChild(img);
                    resolve(false);
                };
                
                img.src = url;
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    if (statusEl.textContent === 'Test ediliyor...') {
                        statusEl.innerHTML = '⏰ Zaman aşımı (10s+)';
                        resolve(false);
                    }
                }, 10000);
            });
        }

        // Preview chapter images
        async function previewImages() {
            const imageInputs = document.querySelectorAll('#image-inputs input');
            const urls = Array.from(imageInputs).map(input => input.value).filter(url => url);
            
            if (urls.length === 0) {
                showStatus('Lütfen en az bir görsel linki girin', 'error');
                return;
            }

            toggleLoading(true);
            
            const previewContainer = document.getElementById('preview-images-container');
            previewContainer.innerHTML = '';
            
            // Convert URLs to proxy format and display images
            for (let i = 0; i < urls.length; i++) {
                const fileId = extractFileId(urls[i]);
                
                if (fileId) {
                    const proxyUrl = createProxyUrl(fileId);
                    
                    const imgContainer = document.createElement('div');
                    imgContainer.style.cssText = 'margin: 10px; text-align: center; border: 1px solid #ddd; padding: 10px; border-radius: 5px;';
                    
                    const img = document.createElement('img');
                    img.className = 'preview-image';
                    img.alt = `Sayfa ${i + 1}`;
                    img.style.cssText = 'max-width: 150px; border: 2px solid #28a745; border-radius: 5px;';
                    
                    const label = document.createElement('p');
                    label.innerHTML = `<strong>Sayfa ${i + 1}</strong><br><small>Proxy URL</small>`;
                    
                    img.onload = function() {
                        img.style.borderColor = '#28a745';
                        label.innerHTML = `<strong>Sayfa ${i + 1} ✅</strong><br><small>${img.naturalWidth}x${img.naturalHeight}px</small>`;
                    };
                    
                    img.onerror = function() {
                        img.style.borderColor = '#dc3545';
                        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNmM3NTdkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPkVycm9yPC90ZXh0Pjwvc3ZnPg==';
                        label.innerHTML = `<strong>Sayfa ${i + 1} ❌</strong><br><small>Yüklenemedi</small>`;
                    };
                    
                    img.src = proxyUrl;
                    
                    imgContainer.appendChild(label);
                    imgContainer.appendChild(img);
                    previewContainer.appendChild(imgContainer);
                } else {
                    const errorDiv = document.createElement('div');
                    errorDiv.textContent = `Sayfa ${i + 1}: Geçersiz Google Drive link`;
                    errorDiv.style.color = 'red';
                    previewContainer.appendChild(errorDiv);
                }
            }
            
            document.getElementById('images-preview').style.display = 'block';
            toggleLoading(false);
        }

        // Form submissions
        document.getElementById('series-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            // Client-side validasyon
            if (!data.title || data.title.trim().length === 0) {
                showStatus('Seri başlığı gerekli', 'error');
                return;
            }
            
            if (!data.seriesId || data.seriesId.trim().length === 0) {
                showStatus('Seri ID gerekli', 'error');
                return;
            }
            
            // Seri ID normalize et (sadece alfanumerik karakterler)
            data.seriesId = data.seriesId.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            if (data.seriesId.length < 3) {
                showStatus('Seri ID en az 3 karakter olmalı', 'error');
                return;
            }
            
            if (!data.coverImageUrl || data.coverImageUrl.trim().length === 0) {
                showStatus('Kapak görseli gerekli', 'error');
                return;
            }
            
            // Google Drive link kontrolü
            if (!data.coverImageUrl.includes('drive.google.com') || !data.coverImageUrl.includes('/file/d/')) {
                showStatus('Geçerli bir Google Drive linki girin', 'error');
                return;
            }
            
            // Parse genre
            if (data.genre) {
                data.genre = data.genre.split(',').map(g => g.trim());
            }
            
            toggleLoading(true);
            
            try {
                const response = await fetch(`${API_BASE}/admin/create-series`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                
                if (result.success) {
                    showStatus('Seri başarıyla oluşturuldu!', 'success');
                    e.target.reset();
                    document.getElementById('cover-preview').style.display = 'none';
                } else {
                    // Detaylı hata mesajı göster
                    let errorMessage = result.error || 'Seri oluşturulamadı';
                    if (result.details && Array.isArray(result.details)) {
                        errorMessage += ':\n' + result.details.join('\n');
                    }
                    if (result.existingTitle) {
                        errorMessage += '\nMevcut seri: ' + result.existingTitle;
                    }
                    showStatus(errorMessage, 'error');
                }
            } catch (error) {
                showStatus('Bağlantı hatası', 'error');
                console.error('Series creation error:', error);
            }
            
            toggleLoading(false);
        });

        document.getElementById('chapter-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const imageInputs = document.querySelectorAll('#image-inputs input');
            const imageUrls = Array.from(imageInputs).map(input => input.value).filter(url => url);
            
            // Client-side validasyon
            if (!formData.get('seriesId') || formData.get('seriesId').trim().length === 0) {
                showStatus('Seri ID gerekli', 'error');
                return;
            }
            
            if (!formData.get('chapterNumber') || isNaN(parseInt(formData.get('chapterNumber')))) {
                showStatus('Geçerli bir bölüm numarası gerekli', 'error');
                return;
            }
            
            if (parseInt(formData.get('chapterNumber')) <= 0) {
                showStatus('Bölüm numarası 0\'dan büyük olmalı', 'error');
                return;
            }
            
            if (imageUrls.length === 0) {
                showStatus('Lütfen en az bir görsel linki girin', 'error');
                return;
            }
            
            // Google Drive linklerini kontrol et
            for (let i = 0; i < imageUrls.length; i++) {
                const url = imageUrls[i];
                if (!url.includes('drive.google.com') || !url.includes('/file/d/')) {
                    showStatus(`${i + 1}. görsel için geçerli bir Google Drive linki girin`, 'error');
                    return;
                }
            }
            
            const data = {
                seriesId: formData.get('seriesId').toLowerCase().replace(/[^a-z0-9]/g, ''),
                chapterNumber: parseInt(formData.get('chapterNumber')),
                title: formData.get('title') || `Bölüm ${formData.get('chapterNumber')}`,
                imageUrls: imageUrls
            };
            
            toggleLoading(true);
            
            try {
                const response = await fetch(`${API_BASE}/admin/create-chapter-with-images`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                
                if (result.success) {
                    showStatus(`Bölüm başarıyla oluşturuldu! (${result.imageCount} görsel)`, 'success');
                    e.target.reset();
                    document.getElementById('image-inputs').innerHTML = `
                        <div class="image-input-item">
                            <input type="url" placeholder="Sayfa 1 Google Drive linki" required>
                            <button type="button" class="btn btn-danger btn-small" onclick="removeImageInput(this)">Sil</button>
                        </div>
                    `;
                    document.getElementById('images-preview').style.display = 'none';
                } else {
                    // Detaylı hata mesajı göster
                    let errorMessage = result.error || 'Bölüm oluşturulamadı';
                    if (result.details && Array.isArray(result.details)) {
                        errorMessage += ':\n' + result.details.join('\n');
                    }
                    if (result.validIds && Array.isArray(result.validIds)) {
                        errorMessage += '\nGeçerli seri ID\'leri: ' + result.validIds.join(', ');
                    }
                    showStatus(errorMessage, 'error');
                }
            } catch (error) {
                showStatus('Bağlantı hatası', 'error');
                console.error('Chapter creation error:', error);
            }
            
            toggleLoading(false);
        });

        document.getElementById('validate-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const driveUrl = formData.get('driveUrl');
            
            toggleLoading(true);
            
            try {
                const response = await fetch(`${API_BASE}/admin/validate-drive-link`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getAuthToken()}`
                    },
                    body: JSON.stringify({ driveUrl })
                });

                const result = await response.json();
                
                const resultDiv = document.getElementById('validation-details');
                resultDiv.innerHTML = `
                    <p><strong>Geçerli:</strong> ${result.isValid ? '✅ Evet' : '❌ Hayır'}</p>
                    <p><strong>Direct URL:</strong> <a href="${result.directUrl}" target="_blank">${result.directUrl}</a></p>
                    <p><strong>Thumbnail URL:</strong> <a href="${result.thumbnailUrl}" target="_blank">${result.thumbnailUrl}</a></p>
                    ${result.isValid ? `<img src="${result.directUrl}" class="preview-image" style="max-width: 300px; margin-top: 15px;">` : ''}
                `;
                
                document.getElementById('validation-result').style.display = 'block';
                
                showStatus(result.isValid ? 'Link geçerli!' : 'Link geçersiz!', result.isValid ? 'success' : 'error');
            } catch (error) {
                showStatus('Doğrulama hatası', 'error');
                console.error('Validation error:', error);
            }
            
            toggleLoading(false);
        });

        // Auto-generate series ID from title
        document.getElementById('series-title').addEventListener('input', (e) => {
            const title = e.target.value;
            const seriesId = title.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\s+/g, '');
            document.getElementById('series-id').value = seriesId;
        });

        // Bölüm Yönetimi Fonksiyonları
        async function loadSeriesList() {
            try {
                const response = await fetch(`${API_BASE}/admin/series-list`);
                const series = await response.json();
                
                const select = document.getElementById('manage-series');
                select.innerHTML = '<option value="">-- Seri Seçin --</option>';
                
                series.forEach(s => {
                    const option = document.createElement('option');
                    option.value = s.seriesId;
                    option.textContent = `${s.title} (${s.chapterCount} bölüm)`;
                    select.appendChild(option);
                });
                
            } catch (error) {
                showStatus('Seriler yüklenirken hata oluştu', 'error');
                console.error('Load series error:', error);
            }
        }

        // Yeni Bölüm Ekleme için serileri yükle
        async function loadChapterSeriesList() {
            try {
                const response = await fetch(`${API_BASE}/admin/series-list`);
                const series = await response.json();
                
                const select = document.getElementById('chapter-series');
                select.innerHTML = '<option value="">-- Seri Seçin --</option>';
                
                series.forEach(s => {
                    const option = document.createElement('option');
                    option.value = s.seriesId;
                    option.textContent = `${s.title} (${s.chapterCount} bölüm)`;
                    select.appendChild(option);
                });
                
            } catch (error) {
                showStatus('Seriler yüklenirken hata oluştu', 'error');
                console.error('Load chapter series error:', error);
            }
        }

        async function loadSeriesChapters(seriesId) {
            if (!seriesId) {
                document.getElementById('chapters-list-container').style.display = 'none';
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/admin/series/${seriesId}/chapters`);
                const data = await response.json();
                
                if (data.success) {
                    displayChaptersList(data.chapters, seriesId);
                    document.getElementById('chapters-list-container').style.display = 'block';
                } else {
                    showStatus('Bölümler yüklenirken hata oluştu', 'error');
                }
                
            } catch (error) {
                showStatus('Bölümler yüklenirken hata oluştu', 'error');
                console.error('Load chapters error:', error);
            }
        }

        function displayChaptersList(chapters, seriesId) {
            const container = document.getElementById('chapters-list');
            
            if (!chapters || chapters.length === 0) {
                container.innerHTML = '<p class="no-chapters">Bu seride henüz bölüm yok.</p>';
                return;
            }

            const chaptersHtml = chapters.map(chapter => `
                <div class="chapter-card">
                    <h4>Bölüm ${chapter.number}: ${chapter.title || 'Başlıksız'}</h4>
                    <div class="chapter-info">
                        📅 ${new Date(chapter.uploadDate).toLocaleDateString('tr-TR')}<br>
                        🖼️ ${chapter.imageCount} görsel<br>
                        📁 ${chapter.filename}
                    </div>
                    <div class="chapter-actions">
                        <button class="btn btn-small" onclick="editChapter('${seriesId}', ${chapter.number})">✏️ Düzenle</button>
                        <button class="btn btn-danger btn-small" onclick="confirmDeleteChapter('${seriesId}', ${chapter.number})">🗑️ Sil</button>
                    </div>
                </div>
            `).join('');

            container.innerHTML = `<div class="chapters-grid">${chaptersHtml}</div>`;
        }

        async function editChapter(seriesId, chapterNumber) {
            try {
                const response = await fetch(`${API_BASE}/admin/series/${seriesId}/chapters/${chapterNumber}`);
                const data = await response.json();
                
                if (data.success) {
                    showEditForm(data.chapter, seriesId);
                } else {
                    showStatus('Bölüm bilgileri alınamadı', 'error');
                }
                
            } catch (error) {
                showStatus('Bölüm bilgileri alınırken hata oluştu', 'error');
                console.error('Edit chapter error:', error);
            }
        }

        function showEditForm(chapter, seriesId) {
            document.getElementById('edit-series-id').value = seriesId;
            document.getElementById('edit-chapter-original-number').value = chapter.number;
            document.getElementById('edit-chapter-number').value = chapter.number;
            document.getElementById('edit-chapter-title').value = chapter.title || '';
            
            // Görsel URL'lerini yükle
            const imageContainer = document.getElementById('edit-image-inputs');
            imageContainer.innerHTML = '';
            
            if (chapter.imageUrls && chapter.imageUrls.length > 0) {
                chapter.imageUrls.forEach((url, index) => {
                    addEditImageInput(url);
                });
            } else {
                addEditImageInput();
            }
            
            document.getElementById('chapter-edit-form').style.display = 'block';
            document.getElementById('chapter-edit-form').scrollIntoView({ behavior: 'smooth' });
        }

        function addEditImageInput(url = '') {
            const container = document.getElementById('edit-image-inputs');
            const inputCount = container.children.length;
            
            const newInputDiv = document.createElement('div');
            newInputDiv.className = 'edit-image-input-item';
            newInputDiv.innerHTML = `
                <input type="url" placeholder="Sayfa ${inputCount + 1} Google Drive linki" value="${url}" oninput="updateImagePreview(this)">
                <button type="button" class="btn btn-danger btn-small" onclick="removeEditImageInput(this)">Sil</button>
                <img src="${url ? getPreviewUrl(url) : ''}" class="image-preview" style="max-width:60px; max-height:60px; vertical-align:middle; margin-left:8px; display:${url ? 'inline-block' : 'none'};" onclick="showImageModal(this.src)" title="Önizle">
            `;
            container.appendChild(newInputDiv);
        }

        function getPreviewUrl(url) {
            // Google Drive linkinden fileId çıkarıp thumbnail oluştur
            const fileId = extractFileId(url);
            if (fileId) {
                return `https://drive.google.com/thumbnail?id=${fileId}&sz=s400`;
            }
            return url;
        }

        function updateImagePreview(input) {
            const url = input.value;
            const img = input.parentElement.querySelector('.image-preview');
            if (url) {
                img.src = getPreviewUrl(url);
                img.style.display = 'inline-block';
            } else {
                img.src = '';
                img.style.display = 'none';
            }
        }

        function showImageModal(src) {
            // Basit modal: yeni sekmede aç
            window.open(src, '_blank');
        }

        function cancelEdit() {
            document.getElementById('chapter-edit-form').style.display = 'none';
        }

        async function confirmDeleteChapter(seriesId, chapterNumber) {
            if (confirm(`Bölüm ${chapterNumber}'ü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
                await deleteChapterConfirmed(seriesId, chapterNumber);
            }
        }

        async function deleteChapterConfirmed(seriesId, chapterNumber) {
            toggleLoading(true);
            
            try {
                const response = await fetch(`${API_BASE}/moderator/delete-chapter/${seriesId}/${chapterNumber}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }
                
                const result = await response.json();
                
                if (result.success) {
                    showStatus('Bölüm başarıyla silindi!', 'success');
                    loadSeriesChapters(seriesId); // Listeyi yenile
                } else {
                    showStatus(result.error || 'Bölüm silinemedi', 'error');
                }
            } catch (error) {
                showStatus('Bölüm silinirken hata oluştu', 'error');
                console.error('Delete chapter error:', error);
            }
            
            toggleLoading(false);
        }

        async function deleteChapter() {
            const seriesId = document.getElementById('edit-series-id').value;
            const chapterNumber = document.getElementById('edit-chapter-original-number').value;
            await confirmDeleteChapter(seriesId, chapterNumber);
        }

        // Edit Chapter Form Submit
        document.getElementById('edit-chapter-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const imageInputs = document.querySelectorAll('#edit-image-inputs input');
            const imageUrls = Array.from(imageInputs).map(input => input.value).filter(url => url);
            
            if (imageUrls.length === 0) {
                showStatus('Lütfen en az bir görsel linki girin', 'error');
                return;
            }
            
            const data = {
                seriesId: document.getElementById('edit-series-id').value,
                originalChapterNumber: document.getElementById('edit-chapter-original-number').value,
                newChapterNumber: document.getElementById('edit-chapter-number').value,
                title: document.getElementById('edit-chapter-title').value,
                imageUrls: imageUrls
            };
            
            toggleLoading(true);
            
            try {
                const response = await fetch(`${API_BASE}/admin/update-chapter`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                
                if (result.success) {
                    showStatus('Bölüm başarıyla güncellendi!', 'success');
                    cancelEdit();
                    loadSeriesChapters(data.seriesId); // Listeyi yenile
                } else {
                    showStatus(result.error || 'Bölüm güncellenemedi', 'error');
                }
            } catch (error) {
                showStatus('Bağlantı hatası', 'error');
                console.error('Update chapter error:', error);
            }
        });
    }    
    