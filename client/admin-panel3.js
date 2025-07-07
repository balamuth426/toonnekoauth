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
