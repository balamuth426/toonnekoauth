// Seri Silme Fonksiyonları
        document.getElementById('confirm-delete').addEventListener('input', function() {
            const deleteBtn = document.getElementById('delete-btn');
            deleteBtn.disabled = this.value !== 'SİL';
        });

        async function deleteSeries() {
            const seriesId = document.getElementById('delete-series').value;
            const confirmText = document.getElementById('confirm-delete').value.toUpperCase();
            if (!seriesId) {
                showStatus('Lütfen silinecek seriyi seçin', 'error');
                return;
            }
            if (confirmText !== 'SİL') {
                showStatus('Silme işlemini onaylamak için "SİL" yazın', 'error');
                return;
            }
            const seriesTitle = document.getElementById('delete-series').selectedOptions[0].textContent;
            if (!confirm(`"${seriesTitle}" serisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
                return;
            }
            toggleLoading(true);
            document.getElementById('delete-result').style.display = 'none';
            try {
                // Eğer backend auth isterse token ekleyin:
                // const token = getAuthToken();
                const response = await fetch(`${API_BASE}/admin/series/${seriesId}`, {
                    method: 'DELETE',
                    // headers: { 'Authorization': `Bearer ${token}` }
                });
                let result;
                try {
                    result = await response.json();
                } catch (jsonErr) {
                    showStatus('Sunucudan geçersiz yanıt alındı', 'error');
                    toggleLoading(false);
                    return;
                }
                if (result && (result.success || result.message)) {
                    showStatus(result.message || 'Seri başarıyla silindi!', 'success');
                    document.getElementById('delete-series').value = '';
                    document.getElementById('confirm-delete').value = '';
                    document.getElementById('delete-btn').disabled = true;
                    document.getElementById('delete-btn').style.opacity = '0.5';
                    const resultDiv = document.getElementById('delete-result');
                    const detailsDiv = document.getElementById('delete-details');
                    detailsDiv.innerHTML = `
                        <div style="color: green;">
                            <strong>✅ Başarıyla silindi:</strong><br>
                            📚 Seri ID: ${seriesId}<br>
                            📁 Klasörler ve dosyalar temizlendi<br>
                            🗄️ Veritabanı kayıtları silindi
                        </div>
                    `;
                    resultDiv.style.display = 'block';
                    loadDeleteSeriesList();
                } else {
                    showStatus(result && result.error ? result.error : 'Seri silinemedi', 'error');
                }
            } catch (error) {
                showStatus(`Seri silinirken hata oluştu: ${error.message}`, 'error');
            }
            toggleLoading(false);
        }

        // Delete tab için serileri yükle
        async function loadDeleteSeriesList() {
            try {
                console.log('Loading series list...');
                const response = await fetch('data/manhwalar.json');
                console.log('Response status:', response.status);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const seriesList = await response.json();
                console.log('Series loaded:', seriesList.length);
                
                const selectElement = document.getElementById('delete-series');
                selectElement.innerHTML = '<option value="">-- Seri Seçin --</option>';
                
                seriesList.forEach(series => {
                    const option = document.createElement('option');
                    option.value = series.seriesId;
                    option.textContent = `${series.title} (${series.seriesId})`;
                    selectElement.appendChild(option);
                });
                
                console.log('Series list loaded successfully');
            } catch (error) {
                console.error('Error loading series list:', error);
                showStatus(`Seri listesi yüklenirken hata oluştu: ${error.message}`, 'error');
            }
        }

        // Silme onayı kontrolü
        document.getElementById('confirm-delete').addEventListener('input', function() {
            const confirmText = this.value.toUpperCase();
            const deleteBtn = document.getElementById('delete-btn');
            const seriesSelected = document.getElementById('delete-series').value;
            
            if (confirmText === 'SİL' && seriesSelected) {
                deleteBtn.disabled = false;
                deleteBtn.style.opacity = '1';
            } else {
                deleteBtn.disabled = true;
                deleteBtn.style.opacity = '0.5';
            }
        });

        // Seri Düzenleme Fonksiyonları
        
        // Edit sekmesi için seri listesini yükle
        async function loadEditSeriesList() {
            try {
                const response = await fetch('http://localhost:5506/client/data/manhwalar.json');
                const series = await response.json();
                
                const select = document.getElementById('edit-series-select');
                select.innerHTML = '<option value="">-- Seri Seçin --</option>';
                
                series.forEach(serie => {
                    const option = document.createElement('option');
                    option.value = serie.seriesId;
                    option.textContent = serie.title;
                    select.appendChild(option);
                });
            } catch (error) {
                console.error('Seri listesi yüklenirken hata:', error);
                showStatus('Seri listesi yüklenemedi', 'error');
            }
        }

        // Etiket ayarları görünürlük kontrolü
        function toggleLabelSettings() {
            const labelValue = document.getElementById('edit-series-label-enabled').value;
            const labelSettings = document.getElementById('label-settings');
            
            // Sadece "true" (Etiketi Göster) durumunda ayarları göster
            labelSettings.style.display = labelValue === 'true' ? 'block' : 'none';
            updateLabelPreview();
        }

        // Etiket önizleme güncelleme
        function updateLabelPreview() {
            const labelValue = document.getElementById('edit-series-label-enabled').value;
            const text = document.getElementById('edit-series-label-text').value;
            const color = document.getElementById('edit-series-label-color').value;
            const preview = document.getElementById('label-preview-badge');
            
            if (labelValue === 'true') {
                // Etiketi göster
                preview.textContent = text;
                preview.style.background = color;
                preview.style.display = 'inline-block';
            } else if (labelValue === 'false') {
                // Etiket var ama gizli (önizlemede göster ama soluk)
                preview.textContent = text + ' (Gizli)';
                preview.style.background = color;
                preview.style.opacity = '0.5';
                preview.style.display = 'inline-block';
            } else {
                // Etiket yok
                preview.style.display = 'none';
                preview.style.opacity = '1';
            }
        }

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
        
        // let allUsers = []; // Removed duplicate declaration

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
                                <p style="margin: 5px 0; color: #666; font-size: 0.9rem;">
                                    📧 ${user.email}
                                </p>
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

        // Seri Silme Fonksiyonları
        document.getElementById('confirm-delete').addEventListener('input', function() {
            const deleteBtn = document.getElementById('delete-btn');
            deleteBtn.disabled = this.value !== 'SİL';
        });

        async function deleteSeries() {
            const seriesId = document.getElementById('delete-series').value;
            const confirmText = document.getElementById('confirm-delete').value.toUpperCase();
            if (!seriesId) {
                showStatus('Lütfen silinecek seriyi seçin', 'error');
                return;
            }
            if (confirmText !== 'SİL') {
                showStatus('Silme işlemini onaylamak için "SİL" yazın', 'error');
                return;
            }
            const seriesTitle = document.getElementById('delete-series').selectedOptions[0].textContent;
            if (!confirm(`"${seriesTitle}" serisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
                return;
            }
            toggleLoading(true);
            document.getElementById('delete-result').style.display = 'none';
            try {
                // Eğer backend auth isterse token ekleyin:
                // const token = getAuthToken();
                const response = await fetch(`${API_BASE}/admin/series/${seriesId}`, {
                    method: 'DELETE',
                    // headers: { 'Authorization': `Bearer ${token}` }
                });
                let result;
                try {
                    result = await response.json();
                } catch (jsonErr) {
                    showStatus('Sunucudan geçersiz yanıt alındı', 'error');
                    toggleLoading(false);
                    return;
                }
                if (result && (result.success || result.message)) {
                    showStatus(result.message || 'Seri başarıyla silindi!', 'success');
                    document.getElementById('delete-series').value = '';
                    document.getElementById('confirm-delete').value = '';
                    document.getElementById('delete-btn').disabled = true;
                    document.getElementById('delete-btn').style.opacity = '0.5';
                    const resultDiv = document.getElementById('delete-result');
                    const detailsDiv = document.getElementById('delete-details');
                    detailsDiv.innerHTML = `
                        <div style="color: green;">
                            <strong>✅ Başarıyla silindi:</strong><br>
                            📚 Seri ID: ${seriesId}<br>
                            📁 Klasörler ve dosyalar temizlendi<br>
                            🗄️ Veritabanı kayıtları silindi
                        </div>
                    `;
                    resultDiv.style.display = 'block';
                    loadDeleteSeriesList();
                } else {
                    showStatus(result && result.error ? result.error : 'Seri silinemedi', 'error');
                }
            } catch (error) {
                showStatus(`Seri silinirken hata oluştu: ${error.message}`, 'error');
            }
            toggleLoading(false);
        }
    }    