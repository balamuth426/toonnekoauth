 // Seçilen seriyi düzenleme formuna yükle
        async function loadSeriesForEdit() {
            const seriesId = document.getElementById('edit-series-select').value;
            const formContainer = document.getElementById('edit-series-form-container');
            
            if (!seriesId) {
                formContainer.style.display = 'none';
                return;
            }

            try {
                const response = await fetch('http://localhost:5506/client/data/manhwalar.json');
                const series = await response.json();
                const selectedSeries = series.find(s => s.seriesId === seriesId);

                if (!selectedSeries) {
                    showStatus('Seri bulunamadı', 'error');
                    return;
                }

                // Form alanlarını doldur
                document.getElementById('edit-series-title').value = selectedSeries.title || '';
                document.getElementById('edit-series-status').value = selectedSeries.status || 'Devam Ediyor';
                document.getElementById('edit-series-summary').value = selectedSeries.summary || '';
                document.getElementById('edit-series-cover').value = selectedSeries.image || '';
                document.getElementById('edit-series-author').value = selectedSeries.author || '';
                document.getElementById('edit-series-artist').value = selectedSeries.artist || '';
                document.getElementById('edit-series-publisher').value = selectedSeries.publisher || '';
                
                // Genres array'ini virgülle ayrılmış string'e çevir
                const genresString = selectedSeries.genres ? selectedSeries.genres.join(', ') : '';
                document.getElementById('edit-series-genres').value = genresString;

                // Etiket bilgilerini yükle
                const label = selectedSeries.label;
                let labelStatus = 'none'; // Varsayılan: Etiket yok
                
                if (label) {
                    if (label.enabled === true) {
                        labelStatus = 'true'; // Etiketi göster
                    } else if (label.enabled === false) {
                        labelStatus = 'false'; // Etiketi gizle
                    }
                    // Etiket var ise text ve color'ı yükle
                    document.getElementById('edit-series-label-text').value = label.text || 'Yeni';
                    document.getElementById('edit-series-label-color').value = label.color || '#4CAF50';
                } else {
                    // Etiket yok ise varsayılan değerler
                    document.getElementById('edit-series-label-text').value = 'Yeni';
                    document.getElementById('edit-series-label-color').value = '#4CAF50';
                }
                
                document.getElementById('edit-series-label-enabled').value = labelStatus;
                toggleLabelSettings();

                // Kapak önizlemesini göster
                if (selectedSeries.image) {
                    document.getElementById('edit-preview-image').src = selectedSeries.image;
                    document.getElementById('edit-cover-preview').style.display = 'block';
                }

                formContainer.style.display = 'block';
            } catch (error) {
                console.error('Seri yüklenirken hata:', error);
                showStatus('Seri bilgileri yüklenemedi', 'error');
            }
        }

        // Kapak görselini doğrula (düzenleme formu için)
        function validateEditCoverImage() {
            const url = document.getElementById('edit-series-cover').value;
            const previewContainer = document.getElementById('edit-cover-preview');
            const previewImage = document.getElementById('edit-preview-image');

            if (!url) {
                showStatus('Lütfen bir görsel URL\'si girin', 'error');
                previewContainer.style.display = 'none';
                return;
            }

            // Google Drive linkini proxy URL'ye dönüştür
            let imageUrl = url;
            const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (driveMatch) {
                const fileId = driveMatch[1];
                imageUrl = `http://localhost:5506/api/image/proxy-image/${fileId}`;
            }

            // Loading göster
            previewImage.src = '';
            previewContainer.style.display = 'block';
            previewImage.style.display = 'none';
            
            // Temporary loading message
            const loadingMsg = document.createElement('div');
            loadingMsg.innerHTML = '🔄 Görsel yükleniyor...';
            loadingMsg.style.padding = '20px';
            loadingMsg.style.textAlign = 'center';
            loadingMsg.id = 'temp-loading';
            previewContainer.appendChild(loadingMsg);

            previewImage.onload = function() {
                const tempLoading = document.getElementById('temp-loading');
                if (tempLoading) tempLoading.remove();
                
                previewImage.style.display = 'block';
                showStatus('Görsel başarıyla yüklendi', 'success');
            };
            
            previewImage.onerror = function() {
                const tempLoading = document.getElementById('temp-loading');
                if (tempLoading) tempLoading.remove();
                
                previewContainer.style.display = 'none';
                showStatus('Görsel yüklenemedi. URL\'yi kontrol edin', 'error');
            };
            
            previewImage.src = imageUrl;
        }

        // Düzenleme formunu temizle ve gizle
        function cancelEdit() {
            document.getElementById('edit-series-select').value = '';
            document.getElementById('edit-series-form-container').style.display = 'none';
            document.getElementById('edit-cover-preview').style.display = 'none';
            document.getElementById('edit-series-form').reset();
        }

        // Seri düzenleme form submit
        document.getElementById('edit-series-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const seriesId = document.getElementById('edit-series-select').value;
            if (!seriesId) {
                showStatus('Lütfen bir seri seçin', 'error');
                return;
            }

            // Loading göster
            showLoading(true);
            
            // Status mesajını temizle
            const statusDiv = document.getElementById('status-message');
            statusDiv.style.display = 'none';

            try {
                // Form verilerini manuel olarak topla
                const editData = {
                    seriesId: seriesId,
                    title: document.getElementById('edit-series-title').value,
                    status: document.getElementById('edit-series-status').value,
                    summary: document.getElementById('edit-series-summary').value,
                    image: document.getElementById('edit-series-cover').value,
                    author: document.getElementById('edit-series-author').value,
                    artist: document.getElementById('edit-series-artist').value,
                    publisher: document.getElementById('edit-series-publisher').value,
                    genres: document.getElementById('edit-series-genres').value.split(',').map(g => g.trim()).filter(g => g)
                };

                // Etiket işleme
                const labelValue = document.getElementById('edit-series-label-enabled').value;
                if (labelValue === 'none') {
                    // Etiket tamamen kaldır
                    editData.removeLabel = true;
                } else {
                    // Etiket ekle/güncelle
                    editData.label = {
                        enabled: labelValue === 'true',
                        text: document.getElementById('edit-series-label-text').value,
                        color: document.getElementById('edit-series-label-color').value
                    };
                }

                // Zorunlu alanları kontrol et
                if (!editData.title || !editData.status || !editData.image) {
                    showLoading(false);
                    showStatus('Lütfen tüm zorunlu alanları doldurun (Başlık, Durum, Kapak Görseli)', 'error');
                    return;
                }

                // Google Drive linkini proxy URL'ye dönüştür
                const driveMatch = editData.image.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                if (driveMatch) {
                    const fileId = driveMatch[1];
                    editData.image = `http://localhost:5506/api/image/proxy-image/${fileId}`;
                }

                console.log('Gönderilen veri:', editData); // Debug için

                const response = await fetch('http://localhost:5506/api/manhwa/edit', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(editData)
                });

                const result = await response.json();
                console.log('Sunucu yanıtı:', result); // Debug için

                if (response.ok) {
                    showStatus('Seri başarıyla güncellendi!', 'success');
                    // Edit sekmesindeki seri listesini yenile
                    loadEditSeriesList();
                    // Seçili seriyi yeniden yükle
                    loadSeriesForEdit();
                } else {
                    showStatus(result.error || 'Seri güncellenirken hata oluştu', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showStatus('Beklenmeyen bir hata oluştu: ' + error.message, 'error');
            } finally {
                showLoading(false);
            }
        });

        // Görsel URL alanında değişiklik olduğunda otomatik önizleme
        document.getElementById('edit-series-cover').addEventListener('input', function() {
            // 1 saniye bekle sonra otomatik doğrula
            clearTimeout(this.previewTimeout);
            this.previewTimeout = setTimeout(() => {
                if (this.value.trim()) {
                    validateEditCoverImage();
                }
            }, 1000);
        });

        // Seri seçimi değiştiğinde onay kontrolü
        document.getElementById('delete-series').addEventListener('change', function() {
            const confirmText = document.getElementById('confirm-delete').value.toUpperCase();
            const deleteBtn = document.getElementById('delete-btn');
            
            if (confirmText === 'SİL' && this.value) {
                deleteBtn.disabled = false;
                deleteBtn.style.opacity = '1';
            } else {
                deleteBtn.disabled = true;
                deleteBtn.style.opacity = '0.5';
            }
        });

        // ===== KULLANICI YÖNETİMİ FONKSİYONLARI =====
        
        let allUsers = [];

        // Kullanıcıları yükle
        async function loadUsers() {
            try {
                console.log('Kullanıcıları yüklemeye çalışıyor...');

                // Test endpoint kullan (geçici çözüm)
                const response = await fetch('http://localhost:5506/api/admin/test-users', {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                console.log('Response status:', response.status);
                console.log('Response ok:', response.ok);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Server error response:', errorText);
                    throw new Error(`Server error ${response.status}: ${errorText}`);
                }

                const data = await response.json();
                console.log('Response data:', JSON.stringify(data, null, 2));
                
                // API direkt kullanıcı array'i döndürüyor
                if (Array.isArray(data)) {
                    allUsers = data;
                    renderUsers(allUsers);
                    updateUserStats(allUsers);
                } else if (data.success) {
                    allUsers = data.users;
                    renderUsers(allUsers);
                    updateUserStats(allUsers);
                } else {
                    throw new Error(data.error || data.details || 'Kullanıcılar yüklenemedi');
                }
            } catch (error) {
                console.error('Kullanıcıları yükleme hatası:', error);
                document.getElementById('users-loading').innerHTML = `
                    <div style="color: #dc3545; font-size: 16px;">
                        ❌ Kullanıcılar yüklenemedi: ${error.message}
                        <br><small>Detaylar için tarayıcı console'unu kontrol edin.</small>
                    </div>
                `;
            }
        }

        // Kullanıcı istatistiklerini güncelle
        function updateUserStats(users) {
            const totalUsers = users.length;
            const adminUsers = users.filter(u => u.isAdmin).length;
            const moderatorUsers = users.filter(u => u.isModerator).length;
            const blockedUsers = users.filter(u => u.isBlocked).length;

            document.getElementById('total-users-count').textContent = totalUsers;
            document.getElementById('admin-users-count').textContent = adminUsers;
            document.getElementById('moderator-users-count').textContent = moderatorUsers;
            document.getElementById('blocked-users-count').textContent = blockedUsers;
        }

        // Kullanıcıları render et
        function renderUsers(users) {
            const container = document.getElementById('users-list');
            const loadingDiv = document.getElementById('users-loading');
            
            loadingDiv.style.display = 'none';
            container.style.display = 'block';

            if (users.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: #666; padding: 40px;">Kullanıcı bulunamadı</div>';
                return;
            }

            const usersHTML = users.map(user => {
                const statusBadges = [];
                if (user.isAdmin) statusBadges.push('<span style="background: #28a745; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-left: 8px;">Admin</span>');
                if (user.isModerator) statusBadges.push('<span style="background: #ffc107; color: black; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-left: 8px;">Moderatör</span>');
                if (user.isBlocked) statusBadges.push('<span style="background: #dc3545; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-left: 8px;">Engelli</span>');
                
                return `
                    <div class="user-card" style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin-bottom: 15px; border-left: 4px solid ${user.isAdmin ? '#28a745' : user.isModerator ? '#ffc107' : user.isBlocked ? '#dc3545' : '#667eea'};">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="margin-bottom: 8px;">
                                    👤 ${user.username}
                                    ${statusBadges.join('')}
                                </h4>
                                <p style="color: #666; margin-bottom: 8px;">📧 ${user.email}</p>
                                <div style="font-size: 14px; color: #888;">
                                    <span>📅 Kayıt: ${new Date(user.createdAt).toLocaleDateString('tr-TR')}</span>
                                    <span style="margin-left: 20px;">⭐ ${user.ratings ? user.ratings.length : 0} puan</span>
                                    <span style="margin-left: 20px;">❤️ ${user.favorites ? user.favorites.length : 0} favori</span>
                                    <span style="margin-left: 20px;">📖 ${user.readSeries ? user.readSeries.length : 0} okunan</span>
                                    ${user.isModerator ? `<span style="margin-left: 20px;">🛡️ ${user.moderatorSeries ? user.moderatorSeries.length : 0} seri</span>` : ''}
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button onclick="viewUserDetails('${user._id}')" style="background: #17a2b8; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">👁️ Detay</button>
                                <button onclick="toggleUserAdmin('${user._id}', ${!user.isAdmin})" 
                                        style="background: ${user.isAdmin ? '#6c757d' : '#28a745'}; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">
                                    ${user.isAdmin ? '👤 Admin Al' : '⭐ Admin Yap'}
                                </button>
                                <button onclick="toggleUserBlock('${user._id}', ${!user.isBlocked})" 
                                        style="background: ${user.isBlocked ? '#28a745' : '#ffc107'}; color: ${user.isBlocked ? 'white' : 'black'}; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">
                                    ${user.isBlocked ? '✅ Engel Kaldır' : '🚫 Engelle'}
                                </button>
                                <button onclick="deleteUser('${user._id}', '${user.username}')" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">🗑️ Sil</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = usersHTML;
        }

        // Kullanıcı arama
        function filterUsers() {
            const searchTerm = document.getElementById('user-search').value.toLowerCase();
            const filteredUsers = allUsers.filter(user => 
                user.username.toLowerCase().includes(searchTerm) || 
                user.email.toLowerCase().includes(searchTerm)
            );
            renderUsers(filteredUsers);
        }

        // Admin yetkisi değiştir - GEÇİCİ MOCK
        async function toggleUserAdmin(userId, makeAdmin) {
            if (!confirm(`Bu kullanıcıyı ${makeAdmin ? 'admin yapmak' : 'admin yetkisini almak'} istediğinizden emin misiniz?`)) {
                return;
            }

            try {
                // GEÇİCİ: Mock response döndür
                console.log(`🔧 Mock işlem: Kullanıcı ${userId} ${makeAdmin ? 'admin yapıldı' : 'admin yetkisi kaldırıldı'}`);
                alert(`Kullanıcı ${makeAdmin ? 'admin yapıldı' : 'admin yetkisi kaldırıldı'} (Mock işlem)`);
                await loadUsers(); // Listeyi yenile
            } catch (error) {
                console.error('Mock admin işlemi hatası:', error);
                alert('Hata: ' + error.message);
            }
        }

        // Kullanıcı engelleme - GEÇİCİ MOCK
        async function toggleUserBlock(userId, blockUser) {
            if (!confirm(`Bu kullanıcıyı ${blockUser ? 'engellemek' : 'engel kaldırmak'} istediğinizden emin misiniz?`)) {
                return;
            }

            try {
                // GEÇİCİ: Mock response döndür
                console.log(`🔧 Mock işlem: Kullanıcı ${userId} ${blockUser ? 'engellendi' : 'engeli kaldırıldı'}`);
                alert(`Kullanıcı ${blockUser ? 'engellendi' : 'engeli kaldırıldı'} (Mock işlem)`);
                await loadUsers(); // Listeyi yenile
            } catch (error) {
                console.error('Mock block işlemi hatası:', error);
                alert('Hata: ' + error.message);
            }
        }

        // Kullanıcı silme - GEÇİCİ MOCK
        async function deleteUser(userId, username) {
            if (!confirm(`"${username}" kullanıcısını kalıcı olarak silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz!`)) {
                return;
            }

            try {
                // GEÇİCİ: Mock response döndür
                console.log(`🔧 Mock işlem: Kullanıcı ${username} (${userId}) silindi`);
                alert(`Kullanıcı "${username}" silindi (Mock işlem)`);
                await loadUsers(); // Listeyi yenile
                await loadUsers(); // Listeyi yenile
            } catch (error) {
                console.error('Mock silme işlemi hatası:', error);
                alert('Hata: ' + error.message);
            }
        }

        // Kullanıcı detaylarını görüntüle
        async function viewUserDetails(userId) {
            try {
                // allUsers array'inden kullanıcıyı bul
                const user = allUsers.find(u => u._id === userId);
                
                if (!user) {
                    throw new Error('Kullanıcı bulunamadı');
                }
                
                const modalContent = document.getElementById('user-detail-content');
                    
                    modalContent.innerHTML = `
                        <div style="margin-bottom: 20px;">
                            <h4>👤 ${user.username}</h4>
                            <p><strong>📧 E-posta:</strong> ${user.email}</p>
                            <p><strong>📅 Kayıt Tarihi:</strong> ${new Date(user.createdAt).toLocaleString('tr-TR')}</p>
                            <p><strong>🔄 Son Güncelleme:</strong> ${new Date(user.updatedAt).toLocaleString('tr-TR')}</p>
                            <p><strong>🕐 Son Giriş:</strong> ${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('tr-TR') : 'Bilinmiyor'}</p>
                            <p><strong>⭐ Admin:</strong> ${user.isAdmin ? '✅ Evet' : '❌ Hayır'}</p>
                            <p><strong>�️ Moderatör:</strong> ${user.isModerator ? '✅ Evet' : '❌ Hayır'}</p>
                            ${user.isModerator && user.moderatorSeries ? `<p><strong>📚 Atanmış Seriler:</strong> ${user.moderatorSeries.length} seri</p>` : ''}
                            <p><strong>�🚫 Engelli:</strong> ${user.isBlocked ? '✅ Evet' : '❌ Hayır'}</p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <h5>📊 Kullanıcı Aktivitesi</h5>
                            <p><strong>⭐ Verilen Puanlar:</strong> ${user.ratings ? user.ratings.length : 0}</p>
                            <p><strong>❤️ Favoriler:</strong> ${user.favorites ? user.favorites.length : 0}</p>
                            <p><strong>📖 Okunan Seriler:</strong> ${user.readSeries ? user.readSeries.length : 0}</p>
                            <p><strong>📈 Okuma İlerlemesi:</strong> ${user.readingProgress ? user.readingProgress.length : 0} seri</p>
                        </div>
                        
                        ${user.favorites && user.favorites.length > 0 ? `
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                                <h5>❤️ Favori Seriler</h5>
                                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
                                    ${user.favorites.map(fav => `<span style="background: #667eea; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">${fav}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                    `;
                    
                    // Moderatör yönetimi bölümünü göster (admin olmayan kullanıcılar için)
                    const moderatorSection = document.getElementById('moderator-assignment-section');
                    if (!user.isAdmin) {
                        moderatorSection.style.display = 'block';
                        // Önce serileri yükle, sonra moderatör atamasını ayarla
                        await loadSeriesForUserModeratorAssignment();
                        setupModeratorAssignment(user);
                    } else {
                        moderatorSection.style.display = 'none';
                    }
                    
                    document.getElementById('user-detail-modal').style.display = 'block';
            } catch (error) {
                alert('Kullanıcı detayları yüklenemedi: ' + error.message);
            }
        }

        // Modal kapatma
        function closeUserModal() {
            document.getElementById('user-detail-modal').style.display = 'none';
        }

        // Tab değiştiğinde kullanıcıları yükle
        const originalSwitchTab = switchTab;
        switchTab = function(tabName) {
            originalSwitchTab(tabName);
            if (tabName === 'users') {
                loadUsers();
                loadSeriesForUserModeratorAssignment();
            }
            if (tabName === 'moderators') {
                loadModerators();
                loadSeriesForModeratorAssignment();
            }
        };

        // Sayfa yüklendiğinde giriş kontrolü
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Admin panel loading...');
            
            // URL parametresi ile localStorage temizleme
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('clear') === 'true') {
                localStorage.clear();
                console.log('localStorage cleared');
            }
            
            // Debug: localStorage durumunu kontrol et
            const currentToken = localStorage.getItem('token');
            console.log('Current token:', currentToken);
            
            // Eğer token yoksa veya geçersizse giriş formu göster
            if (!currentToken) {
                console.log('No token found, showing login form');
                document.querySelector('.admin-container').style.display = 'none';
                showLoginForm();
            } else {
                console.log('Token found, verifying...');
                // Token'ı verify et
                verifyToken(currentToken);
            }

            // Etiket ayarları event listener'ları
            const labelTextSelect = document.getElementById('edit-series-label-text');
            const labelColorSelect = document.getElementById('edit-series-label-color');
            
            if (labelTextSelect) {
                labelTextSelect.addEventListener('change', updateLabelPreview);
            }
            if (labelColorSelect) {
                labelColorSelect.addEventListener('change', updateLabelPreview);
            }
        });
        
        // Token doğrulama fonksiyonu
        async function verifyToken(token) {
            try {
                const response = await fetch('http://localhost:5506/api/admin/test-users', {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    console.log('Token valid, showing admin panel');
                    document.querySelector('.admin-container').style.display = 'block';
                } else {
                    console.log('Token invalid, clearing and showing login');
                    localStorage.removeItem('token');
                    document.querySelector('.admin-container').style.display = 'none';
                    showLoginForm();
                }
            } catch (error) {
                console.log('Token verification failed:', error);
                localStorage.removeItem('token');
                document.querySelector('.admin-container').style.display = 'none';
                showLoginForm();
            }
        }

        // Yorum Yönetimi Fonksiyonları
        let currentReportsPage = 1;
        let currentCommentsPage = 1;

        // Rapor istatistiklerini yükle
        async function loadReportsStats() {
            try {
                const response = await fetch(`${API_BASE}/reports/admin/stats`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.ok) {
                    const stats = await response.json();
                    document.getElementById('pending-reports').textContent = stats.pendingReports;
                    document.getElementById('total-reports').textContent = stats.totalReports;
                    document.getElementById('reported-comments').textContent = stats.reportedComments;
                }
            } catch (error) {
                console.error('Stats yüklenirken hata:', error);
            }
        }

        // Raporları yükle
        async function loadReports(page = 1) {
            try {
                const status = document.getElementById('report-status-filter').value;
                const seriesId = document.getElementById('series-filter').value;
                
                const params = new URLSearchParams({
                    page,
                    status,
                    limit: 10
                });
                
                if (seriesId) params.append('seriesId', seriesId);
                
                const response = await fetch(`${API_BASE}/reports/admin/reports?${params}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    renderReports(data.reports);
                    renderReportsPagination(data.page, data.totalPages);
                    currentReportsPage = data.page;
                }
            } catch (error) {
                console.error('Raporlar yüklenirken hata:', error);
            }
        }

        // Raporları render et
        function renderReports(reports) {
            const listDiv = document.getElementById('reports-list');
            
            if (reports.length === 0) {
                listDiv.innerHTML = '<p style="text-align: center; color: #666;">Rapor bulunamadı.</p>';
                return;
            }

            listDiv.innerHTML = reports.map(report => `
                <div class="report-item" style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 15px; background: white;">
                    <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 15px;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 8px 0; color: #333;">
                                ${report.seriesTitle} - ${report.replyId ? 'Yanıt' : 'Yorum'}
                                <span class="report-status status-${report.status}" style="
                                    padding: 4px 8px; 
                                    border-radius: 4px; 
                                    font-size: 0.8rem; 
                                    margin-left: 10px;
                                    background: ${getStatusColor(report.status)};
                                    color: white;
                                ">${getStatusText(report.status)}</span>
                            </h4>
                            <p style="margin: 5px 0; color: #666; font-size: 0.9rem;">
                                <strong>Rapor Eden:</strong> ${report.reportedBy} | 
                                <strong>Neden:</strong> ${getReasonText(report.reason)} | 
                                <strong>Tarih:</strong> ${new Date(report.reportDate).toLocaleString('tr-TR')}
                            </p>
                            ${report.description ? `<p style="margin: 5px 0; color: #666;"><strong>Açıklama:</strong> ${report.description}</p>` : ''}
                        </div>
                    </div>
                    
                    ${report.commentId ? `
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                            <p style="margin: 0; font-size: 0.9rem;"><strong>Yorum İçeriği:</strong></p>
                            <p style="margin: 5px 0 0 0; font-style: italic;">${report.commentId.text || 'Yorum içeriği yüklenemedi'}</p>
                            <p style="margin: 5px 0 0 0; font-size: 0.8rem; color: #666;">
                                <strong>Yazan:</strong> ${report.commentId.author || 'Bilinmiyor'}
                            </p>
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        ${report.status === 'pending' ? `
                            <button onclick="updateReportStatus('${report._id}', 'reviewed', 'none')" 
                                style="background: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                                ✅ İncelendi
                            </button>
                            <button onclick="deleteCommentFromReport('${report.commentId._id}', '${report.replyId || ''}', '${report._id}')" 
                                style="background: #f44336; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                                🗑️ Yorumu Sil
                            </button>
                            <button onclick="updateReportStatus('${report._id}', 'dismissed', 'none')" 
                                style="background: #9E9E9E; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                                ❌ Reddet
                            </button>
                        ` : `
                            <span style="color: #666; font-size: 0.9rem;">
                                ${report.reviewedBy ? `${report.reviewedBy} tarafından ${new Date(report.reviewedAt).toLocaleString('tr-TR')} tarihinde işlendi` : 'İşlendi'}
                            </span>
                        `}
                    </div>
                </div>
            `).join('');
        }

        // Rapor durumunu güncelle
        async function updateReportStatus(reportId, status, action) {
            try {
                const response = await fetch(`${API_BASE}/reports/admin/reports/${reportId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ status, action })
                });
                
                if (response.ok) {
                    showStatus('Rapor durumu güncellendi', 'success');
                    loadReports(currentReportsPage);
                    loadReportsStats();
                } else {
                    showStatus('Rapor güncellenirken hata oluştu', 'error');
                }
            } catch (error) {
                console.error('Rapor güncelleme hatası:', error);
                showStatus('Rapor güncellenirken hata oluştu', 'error');
            }
        }

        // Yorumu rapordan sil
        async function deleteCommentFromReport(commentId, replyId, reportId) {
            if (!confirm('Bu yorumu/yanıtı silmek istediğinizden emin misiniz?')) return;
            
            try {
                const url = `${API_BASE}/reports/admin/comment/${commentId}${replyId ? `?replyId=${replyId}` : ''}`;
                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.ok) {
                    // Raporu da çözümlendi olarak işaretle
                    await updateReportStatus(reportId, 'resolved', 'comment_deleted');
                    showStatus('Yorum silindi ve rapor çözümlendi', 'success');
                } else {
                    showStatus('Yorum silinirken hata oluştu', 'error');
                }
            } catch (error) {
                console.error('Yorum silme hatası:', error);
                showStatus('Yorum silinirken hata oluştu', 'error');
            }
        }

        // Yorum yönetimi için seri listesini yükle
        async function loadCommentsSeriesList() {
            try {
                const response = await fetch(`${API_BASE}/admin/series-list`);
                const series = await response.json();
                
                const seriesFilter = document.getElementById('series-filter');
                const commentSeriesSelect = document.getElementById('comment-series-select');
                
                // Filtre için
                seriesFilter.innerHTML = '<option value="">Tüm Seriler</option>';
                series.forEach(s => {
                    const option = document.createElement('option');
                    option.value = s.seriesId;
                    option.textContent = `${s.title} (${s.chapterCount} bölüm)`;
                    seriesFilter.appendChild(option);
                });
                
                // Yorum yönetimi için
                commentSeriesSelect.innerHTML = '<option value="">-- Seri Seçin --</option>';
                series.forEach(s => {
                    const option = document.createElement('option');
                    option.value = s.seriesId;
                    option.textContent = `${s.title} (${s.chapterCount} bölüm)`;
                    commentSeriesSelect.appendChild(option);
                });
                
            } catch (error) {
                console.error('Seri listesi yüklenirken hata:', error);
            }
        }

        // Seri bazında yorumları yükle
        async function loadSeriesComments(page = 1) {
            const seriesId = document.getElementById('comment-series-select').value;
            if (!seriesId) {
                document.getElementById('series-comments').style.display = 'none';
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE}/reports/admin/comments/${seriesId}?page=${page}&limit=10`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    renderSeriesComments(data.comments);
                    renderSeriesCommentsPagination(data.page, data.totalPages);
                    document.getElementById('series-comments').style.display = 'block';
                }
            } catch (error) {
                console.error('Seri yorumları yüklenirken hata:', error);
            }
        }

        // Seri yorumlarını render et
        function renderSeriesComments(comments) {
            const listDiv = document.getElementById('series-comments-list');
            
            if (comments.length === 0) {
                listDiv.innerHTML = '<p style="text-align: center; color: #666;">Bu seride yorum bulunamadı.</p>';
                return;
            }

            listDiv.innerHTML = comments.map(comment => {
                // Yorum konumunu belirle
                let location = 'Ana Seri Sayfası';
                if (comment.chapterNumber) {
                    location = `Bölüm ${comment.chapterNumber}`;
                } else if (comment.seriesId && comment.seriesId.includes('-chapter-')) {
                    // Eski sistemde seriesId'den bölüm numarasını çıkar
                    const chapterMatch = comment.seriesId.match(/-chapter-(\d+)$/);
                    if (chapterMatch) {
                        location = `Bölüm ${chapterMatch[1]}`;
                    }
                }
                
                return `
                <div class="comment-item" style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 10px; background: white;">
                    <div style="display: flex; justify-content: between; align-items: start;">
                        <div style="flex: 1;">
                            <p style="margin: 0 0 8px 0;">
                                <strong>${comment.author}</strong> - 
                                <span style="color: #666; font-size: 0.9rem;">${new Date(comment.date).toLocaleString('tr-TR')}</span>
                                <span style="background: #2196F3; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8rem; margin-left: 10px;">${location}</span>
                                ${comment.deleted ? '<span style="color: red; font-size: 0.8rem; margin-left: 10px;">[SİLİNDİ]</span>' : ''}
                                ${comment.reported ? '<span style="background: #ff4444; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8rem; margin-left: 10px;">RAPORLANDI</span>' : ''}
                            </p>
                            <p style="margin: 0; font-style: italic;">${comment.text}</p>
                            <p style="margin: 8px 0 0 0; font-size: 0.8rem; color: #666;">
                                👍 ${comment.likes} | 👎 ${comment.dislikes} | 💬 ${comment.replies ? comment.replies.length : 0} yanıt
                            </p>
                        </div>
                        <div style="margin-left: 15px;">
                            ${!comment.deleted ? `
                                <button onclick="deleteComment('${comment._id}')" 
                                    style="background: #f44336; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                                    🗑️ Sil
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    ${comment.replies && comment.replies.length > 0 ? `
                        <div style="margin-top: 15px; padding-left: 20px; border-left: 3px solid #eee;">
                            <h5 style="margin: 0 0 10px 0; color: #666;">Yanıtlar:</h5>
                            ${comment.replies.map(reply => `
                                <div style="background: #f9f9f9; padding: 10px; border-radius: 4px; margin-bottom: 8px;">
                                    <p style="margin: 0 0 5px 0; font-size: 0.9rem;">
                                        <strong>${reply.author}</strong> - 
                                        <span style="color: #666; font-size: 0.8rem;">${new Date(reply.date).toLocaleString('tr-TR')}</span>
                                        ${reply.deleted ? '<span style="color: red; font-size: 0.8rem; margin-left: 10px;">[SİLİNDİ]</span>' : ''}
                                    </p>
                                    <p style="margin: 0; font-size: 0.9rem; font-style: italic;">${reply.text}</p>
                                    ${!reply.deleted ? `
                                        <button onclick="deleteReply('${comment._id}', '${reply._id}')" 
                                            style="background: #f44336; color: white; border: none; padding: 3px 8px; border-radius: 3px; cursor: pointer; font-size: 0.7rem; margin-top: 5px;">
                                            🗑️ Sil
                                        </button>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
            }).join('');
        }

        // Yorum sil
        async function deleteComment(commentId) {
            if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) return;
            
            try {
                const response = await fetch(`${API_BASE}/reports/admin/comment/${commentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.ok) {
                    showStatus('Yorum silindi', 'success');
                    loadSeriesComments(currentCommentsPage);
                } else {
                    showStatus('Yorum silinirken hata oluştu', 'error');
                }
            } catch (error) {
                console.error('Yorum silme hatası:', error);
                showStatus('Yorum silinirken hata oluştu', 'error');
            }
        }

        // Yanıt sil
        async function deleteReply(commentId, replyId) {
            if (!confirm('Bu yanıtı silmek istediğinizden emin misiniz?')) return;
            
            try {
                const response = await fetch(`${API_BASE}/reports/admin/comment/${commentId}?replyId=${replyId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.ok) {
                    showStatus('Yanıt silindi', 'success');
                    loadSeriesComments(currentCommentsPage);
                } else {
                    showStatus('Yanıt silinirken hata oluştu', 'error');
                }
            } catch (error) {
                console.error('Yanıt silme hatası:', error);
                showStatus('Yanıt silinirken hata oluştu', 'error');
            }
        }