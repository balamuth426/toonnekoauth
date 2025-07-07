// Pagination render fonksiyonları
        function renderReportsPagination(currentPage, totalPages) {
            const paginationDiv = document.getElementById('reports-pagination');
            if (totalPages <= 1) {
                paginationDiv.innerHTML = '';
                return;
            }
            
            let html = '';
            for (let i = 1; i <= totalPages; i++) {
                html += `<button onclick="loadReports(${i})" 
                    style="margin: 0 2px; padding: 5px 10px; border: 1px solid #ddd; background: ${i === currentPage ? '#667eea' : 'white'}; color: ${i === currentPage ? 'white' : 'black'}; cursor: pointer; border-radius: 3px;">
                    ${i}
                </button>`;
            }
            paginationDiv.innerHTML = html;
        }

        function renderSeriesCommentsPagination(currentPage, totalPages) {
            const paginationDiv = document.getElementById('series-comments-pagination');
            if (totalPages <= 1) {
                paginationDiv.innerHTML = '';
                return;
            }
            
            let html = '';
            for (let i = 1; i <= totalPages; i++) {
                html += `<button onclick="loadSeriesComments(${i})" 
                    style="margin: 0 2px; padding: 5px 10px; border: 1px solid #ddd; background: ${i === currentPage ? '#667eea' : 'white'}; color: ${i === currentPage ? 'white' : 'black'}; cursor: pointer; border-radius: 3px;">
                    ${i}
                </button>`;
            }
            paginationDiv.innerHTML = html;
        }

        // Yardımcı fonksiyonlar
        function getStatusColor(status) {
            const colors = {
                'pending': '#ff4444',
                'reviewed': '#4CAF50',
                'resolved': '#2196F3',
                'dismissed': '#9E9E9E'
            };
            return colors[status] || '#666';
        }

        function getStatusText(status) {
            const texts = {
                'pending': 'Bekliyor',
                'reviewed': 'İncelendi',
                'resolved': 'Çözüldü',
                'dismissed': 'Reddedildi'
            };
            return texts[status] || status;
        }

        function getReasonText(reason) {
            const reasons = {
                'spam': 'Spam/Reklam',
                'harassment': 'Taciz/Zorbalık',
                'hate-speech': 'Nefret Söylemi',
                'inappropriate': 'Uygunsuz İçerik',
                'misinformation': 'Yanlış Bilgi',
                'other': 'Diğer'
            };
            return reasons[reason] || reason;
        }

        // Duyuru Yönetimi Fonksiyonları
        let announcementCurrentPage = 1;
        let announcementTotalPages = 1;
        const announcementItemsPerPage = 10;

        // Duyuru formu submit event listener
        document.getElementById('announcement-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            await createAnnouncement();
        });

        // Duyuru filtreleme
        document.getElementById('announcement-filter').addEventListener('change', function() {
            announcementCurrentPage = 1;
            loadAnnouncements();
        });

        // Duyuru listesi yenileme
        document.getElementById('refresh-announcements').addEventListener('click', function() {
            loadAnnouncements();
        });

        // Duyuru formu temizleme
        document.getElementById('clear-announcement-form').addEventListener('click', function() {
            clearAnnouncementForm();
        });

        async function createAnnouncement() {
            const form = document.getElementById('announcement-form');
            const formData = new FormData(form);
            
            const announcementData = {
                title: formData.get('title'),
                content: formData.get('content'),
                type: formData.get('type'),
                isActive: formData.has('isActive')
            };

            try {
                showStatus('Duyuru ekleniyor...', 'info');
                
                const response = await fetch('http://localhost:5506/api/announcements', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                    body: JSON.stringify(announcementData)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    showStatus('✅ Duyuru başarıyla eklendi!', 'success');
                    clearAnnouncementForm();
                    loadAnnouncements();
                } else {
                    showStatus('❌ ' + (result.message || 'Duyuru eklenirken hata oluştu'), 'error');
                }
            } catch (error) {
                console.error('Duyuru ekleme hatası:', error);
                showStatus('❌ Duyuru eklenirken hata oluştu', 'error');
            }
        }

        async function loadAnnouncements() {
            try {
                const filter = document.getElementById('announcement-filter').value;
                const response = await fetch(`http://localhost:5506/api/announcements?page=${announcementCurrentPage}&limit=${announcementItemsPerPage}&filter=${filter}`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    displayAnnouncements(result.announcements);
                    updateAnnouncementPagination(result.pagination);
                } else {
                    showStatus('❌ Duyurular yüklenirken hata oluştu', 'error');
                }
            } catch (error) {
                console.error('Duyuru yükleme hatası:', error);
                showStatus('❌ Duyurular yüklenirken hata oluştu', 'error');
            }
        }

        function displayAnnouncements(announcements) {
            const container = document.getElementById('announcements-list');
            
            if (!announcements || announcements.length === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 40px; color: #888;">Henüz duyuru bulunmuyor.</div>';
                return;
            }

            container.innerHTML = announcements.map(announcement => `
                <div class="announcement-item">
                    <div class="announcement-header-item">
                        <h4 class="announcement-title-item">${escapeHtml(announcement.title)}</h4>
                        <div>
                            <span class="announcement-type-badge announcement-type-${announcement.type}">
                                ${getTypeLabel(announcement.type)}
                            </span>
                            <span class="announcement-status-badge ${announcement.isActive ? 'announcement-active' : 'announcement-inactive'}">
                                ${announcement.isActive ? 'Aktif' : 'Pasif'}
                            </span>
                        </div>
                    </div>
                    <div class="announcement-content-item">${escapeHtml(announcement.content)}</div>
                    <div class="announcement-meta">
                        <span class="announcement-date">${formatDate(announcement.createdAt)}</span>
                        <div class="announcement-actions">
                            <button class="btn-edit-announcement" onclick="editAnnouncement('${announcement._id}')">
                                ✏️ Düzenle
                            </button>
                            <button class="btn-toggle-announcement" onclick="toggleAnnouncement('${announcement._id}', ${!announcement.isActive})">
                                ${announcement.isActive ? '🔴 Pasifleştir' : '🟢 Aktifleştir'}
                            </button>
                            <button class="btn-delete-announcement" onclick="deleteAnnouncement('${announcement._id}')">
                                🗑️ Sil
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function updateAnnouncementPagination(pagination) {
            announcementTotalPages = pagination.totalPages;
            announcementCurrentPage = pagination.currentPage;

            const container = document.getElementById('announcements-pagination');
            
            if (announcementTotalPages <= 1) {
                container.innerHTML = '';
                return;
            }

            let paginationHTML = '';
            
            // Previous button
            paginationHTML += `
                <button class="pagination-btn" onclick="changeAnnouncementPage(${announcementCurrentPage - 1})" 
                        ${announcementCurrentPage <= 1 ? 'disabled' : ''}>
                    ← Önceki
                </button>
            `;

            // Page numbers
            for (let i = 1; i <= announcementTotalPages; i++) {
                if (i === 1 || i === announcementTotalPages || (i >= announcementCurrentPage - 2 && i <= announcementCurrentPage + 2)) {
                    paginationHTML += `
                        <button class="pagination-btn ${i === announcementCurrentPage ? 'active' : ''}" 
                                onclick="changeAnnouncementPage(${i})">
                            ${i}
                        </button>
                    `;
                } else if (i === announcementCurrentPage - 3 || i === announcementCurrentPage + 3) {
                    paginationHTML += '<span class="pagination-ellipsis">...</span>';
                }
            }

            // Next button
            paginationHTML += `
                <button class="pagination-btn" onclick="changeAnnouncementPage(${announcementCurrentPage + 1})" 
                        ${announcementCurrentPage >= announcementTotalPages ? 'disabled' : ''}>
                    Sonraki →
                </button>
            `;

            container.innerHTML = paginationHTML;
        }

        function changeAnnouncementPage(page) {
            if (page >= 1 && page <= announcementTotalPages) {
                announcementCurrentPage = page;
                loadAnnouncements();
            }
        }

        async function toggleAnnouncement(announcementId, isActive) {
            try {
                const response = await fetch(`http://localhost:5506/api/announcements/${announcementId}/toggle`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    showStatus(`✅ Duyuru ${isActive ? 'aktifleştirildi' : 'pasifleştirildi'}!`, 'success');
                    loadAnnouncements();
                } else {
                    showStatus('❌ ' + (result.message || 'Duyuru güncellenirken hata oluştu'), 'error');
                }
            } catch (error) {
                console.error('Duyuru güncelleme hatası:', error);
                showStatus('❌ Duyuru güncellenirken hata oluştu', 'error');
            }
        }

        async function deleteAnnouncement(announcementId) {
            if (!confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) {
                return;
            }

            try {
                const response = await fetch(`http://localhost:5506/api/announcements/${announcementId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    showStatus('✅ Duyuru başarıyla silindi!', 'success');
                    loadAnnouncements();
                } else {
                    showStatus('❌ ' + (result.message || 'Duyuru silinirken hata oluştu'), 'error');
                }
            } catch (error) {
                console.error('Duyuru silme hatası:', error);
                showStatus('❌ Duyuru silinirken hata oluştu', 'error');
            }
        }

        async function editAnnouncement(announcementId) {
            try {
                const response = await fetch(`http://localhost:5506/api/announcements/${announcementId}`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // Form alanlarını doldur
                    document.getElementById('announcement-title').value = result.announcement.title;
                    document.getElementById('announcement-content').value = result.announcement.content;
                    document.getElementById('announcement-type').value = result.announcement.type;
                    document.getElementById('announcement-active').checked = result.announcement.isActive;

                    // Form submit handler'ını güncelleme moduna çevir
                    const form = document.getElementById('announcement-form');
                    form.onsubmit = async function(e) {
                        e.preventDefault();
                        await updateAnnouncement(announcementId);
                    };

                    // Form butonunu güncelle
                    const submitBtn = form.querySelector('button[type="submit"]');
                    submitBtn.textContent = '✏️ Duyuru Güncelle';
                    submitBtn.style.background = '#ff9800';

                    // Sayfayı yukarı kaydır
                    form.scrollIntoView({ behavior: 'smooth' });
                } else {
                    showStatus('❌ Duyuru bilgileri yüklenirken hata oluştu', 'error');
                }
            } catch (error) {
                console.error('Duyuru yükleme hatası:', error);
                showStatus('❌ Duyuru bilgileri yüklenirken hata oluştu', 'error');
            }
        }

        async function updateAnnouncement(announcementId) {
            const form = document.getElementById('announcement-form');
            const formData = new FormData(form);
            
            const announcementData = {
                title: formData.get('title'),
                content: formData.get('content'),
                type: formData.get('type'),
                isActive: formData.has('isActive')
            };

            try {
                showStatus('Duyuru güncelleniyor...', 'info');
                
                const response = await fetch(`http://localhost:5506/api/announcements/${announcementId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                    body: JSON.stringify(announcementData)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    showStatus('✅ Duyuru başarıyla güncellendi!', 'success');
                    clearAnnouncementForm();
                    loadAnnouncements();
                } else {
                    showStatus('❌ ' + (result.message || 'Duyuru güncellenirken hata oluştu'), 'error');
                }
            } catch (error) {
                console.error('Duyuru güncelleme hatası:', error);
                showStatus('❌ Duyuru güncellenirken hata oluştu', 'error');
            }
        }

        function clearAnnouncementForm() {
            const form = document.getElementById('announcement-form');
            form.reset();
            
            // Form submit handler'ını yeni duyuru moduna çevir
            form.onsubmit = async function(e) {
                e.preventDefault();
                await createAnnouncement();
            };

            // Form butonunu sıfırla
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.textContent = '📢 Duyuru Ekle';
            submitBtn.style.background = '#667eea';
        }

        function getTypeLabel(type) {
            switch (type) {
                case 'info': return 'ℹ️ Bilgi';
                case 'warning': return '⚠️ Uyarı';
                case 'success': return '✅ Başarı';
                default: return 'ℹ️ Bilgi';
            }
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // İstatistikler için fonksiyonlar
        
        // Ana istatistikleri yükle
        async function loadStatsOverview() {
            try {
                // Seri bazında istatistikler
                const seriesResponse = await fetch(`${API_BASE}/stats/series-stats`);
                const seriesData = await seriesResponse.json();
                
                if (seriesData.success) {
                    const stats = seriesData.data;
                    
                    // Toplam okuma hesapla
                    const totalReads = stats.reduce((sum, series) => sum + series.totalReads, 0);
                    const weeklyReads = stats.reduce((sum, series) => sum + series.weeklyReads, 0);
                    const totalSeries = stats.length;
                    
                    // Bugünkü okuma sayısını al (haftalık veriden tahmin et)
                    const todayReads = Math.round(weeklyReads / 7);
                    
                    // İstatistik kartlarını güncelle
                    document.getElementById('total-reads-today').textContent = formatNumber(todayReads);
                    document.getElementById('total-reads-week').textContent = formatNumber(weeklyReads);
                    document.getElementById('total-reads-all').textContent = formatNumber(totalReads);
                    document.getElementById('total-series-read').textContent = totalSeries;
                    
                    // En popüler seriler tablosunu güncelle
                    updatePopularSeriesTable(stats);
                }
            } catch (error) {
                console.error('Stats overview error:', error);
                showStatus('İstatistik verileri yüklenirken hata oluştu', 'error');
            }
        }
        
        // Detaylı istatistikleri yükle
        async function loadDetailedStats(page = 1) {
            try {
                const seriesFilter = document.getElementById('stats-series-filter').value;
                const periodFilter = document.getElementById('stats-period-filter').value;
                
                let url = `${API_BASE}/stats/admin/detailed-stats?page=${page}&limit=20`;
                if (seriesFilter) {
                    url += `&seriesId=${encodeURIComponent(seriesFilter)}`;
                }
                
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.success) {
                    updateDetailedStatsTable(data.data);
                    updateStatsPagination(data.pagination);
                }
            } catch (error) {
                console.error('Detailed stats error:', error);
                showStatus('Detaylı istatistikler yüklenirken hata oluştu', 'error');
            }
        }
        
        // İstatistikler için seri listesini yükle
        async function loadStatsSeriesList() {
            try {
                const response = await fetch(`${API_BASE}/stats/series-stats`);
                const data = await response.json();
                
                if (data.success) {
                    const select = document.getElementById('stats-series-filter');
                    select.innerHTML = '<option value="">Tüm Seriler</option>';
                    
                    data.data.forEach(series => {
                        const option = document.createElement('option');
                        option.value = series._id;
                        option.textContent = `${series.seriesTitle} (${formatNumber(series.totalReads)} okuma)`;
                        select.appendChild(option);
                    });
                }
            } catch (error) {
                console.error('Stats series list error:', error);
            }
        }
        
        // En popüler seriler tablosunu güncelle
        function updatePopularSeriesTable(seriesStats) {
            const tbody = document.getElementById('popular-series-table');
            
            if (!seriesStats || seriesStats.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="padding: 20px; text-align: center; color: #666;">Henüz okuma verisi yok</td></tr>';
                return;
            }
            
            const sortedSeries = seriesStats
                .sort((a, b) => b.totalReads - a.totalReads)
                .slice(0, 20);
            
            tbody.innerHTML = sortedSeries.map((series, index) => {
                const avgReads = Math.round(series.avgReadsPerChapter || 0);
                const lastRead = series.lastRead ? formatDate(series.lastRead) : 'Hiç okunmadı';
                
                return `
                    <tr style="border-bottom: 1px solid #dee2e6;">
                        <td style="padding: 12px; font-weight: bold; color: #666;">${index + 1}</td>
                        <td style="padding: 12px; font-weight: 500;">${escapeHtml(series.seriesTitle)}</td>
                        <td style="padding: 12px; text-align: center; font-weight: bold; color: #007bff;">${formatNumber(series.totalReads)}</td>
                        <td style="padding: 12px; text-align: center; color: #ff6f61;">${formatNumber(series.weeklyReads)}</td>
                        <td style="padding: 12px; text-align: center;">${series.chapterCount}</td>
                        <td style="padding: 12px; text-align: center; color: #28a745;">${formatNumber(avgReads)}</td>
                        <td style="padding: 12px; text-align: center; font-size: 0.9rem; color: #666;">${lastRead}</td>
                    </tr>
                `;
            }).join('');
        }
        
        // Detaylı istatistikler tablosunu güncelle
        function updateDetailedStatsTable(statsData) {
            const tbody = document.getElementById('detailed-stats-table');
            
            if (!statsData || statsData.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #666;">Veri bulunamadı</td></tr>';
                return;
            }
            
            tbody.innerHTML = statsData.map(stat => {
                const lastRead = stat.lastRead ? formatDate(stat.lastRead) : 'Hiç okunmadı';
                
                return `
                    <tr style="border-bottom: 1px solid #dee2e6;">
                        <td style="padding: 12px; font-weight: 500;">${escapeHtml(stat.seriesTitle)}</td>
                        <td style="padding: 12px; text-align: center;">Bölüm ${stat.chapterNumber}</td>
                        <td style="padding: 12px; text-align: center; font-weight: bold; color: #007bff;">${formatNumber(stat.totalReads)}</td>
                        <td style="padding: 12px; text-align: center; color: #ff6f61;">${formatNumber(stat.weeklyReads)}</td>
                        <td style="padding: 12px; text-align: center; color: #ffc107;">${formatNumber(stat.dailyReads)}</td>
                        <td style="padding: 12px; text-align: center; font-size: 0.9rem; color: #666;">${lastRead}</td>
                    </tr>
                `;
            }).join('');
        }
        
        // Pagination güncelle
        function updateStatsPagination(pagination) {
            const container = document.getElementById('stats-pagination');
            
            if (!pagination || pagination.pages <= 1) {
                container.innerHTML = '';
                return;
            }
            
            const { page, pages } = pagination;
            let html = '<div style="display: flex; gap: 5px; justify-content: center; align-items: center;">';
            
            // Previous button
            if (page > 1) {
                html += `<button onclick="loadDetailedStats(${page - 1})" style="padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">‹ Önceki</button>`;
            }
            
            // Page numbers
            const maxVisible = 5;
            let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
            let endPage = Math.min(pages, startPage + maxVisible - 1);
            
            if (endPage - startPage + 1 < maxVisible) {
                startPage = Math.max(1, endPage - maxVisible + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                const isActive = i === page;
                html += `<button onclick="loadDetailedStats(${i})" style="padding: 8px 12px; background: ${isActive ? '#6c757d' : '#fff'}; color: ${isActive ? 'white' : '#007bff'}; border: 1px solid ${isActive ? '#6c757d' : '#007bff'}; border-radius: 4px; cursor: pointer;">${i}</button>`;
            }
            
            // Next button
            if (page < pages) {
                html += `<button onclick="loadDetailedStats(${page + 1})" style="padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Sonraki ›</button>`;
            }
            
            html += `<span style="margin-left: 15px; color: #666;">Sayfa ${page} / ${pages}</span>`;
            html += '</div>';
            
            container.innerHTML = html;
        }
        
        // Sayı formatlama
        function formatNumber(num) {
            if (num >= 1000000) {
                return (num / 1000000).toFixed(1) + 'M';
            } else if (num >= 1000) {
                return (num / 1000).toFixed(1) + 'K';
            }
            return num.toString();
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Token alma fonksiyonu
        function getToken() {
            return localStorage.getItem('token') || 'test-admin-token-for-development';
        }

        // ========== MODERATÖR YÖNETİMİ FONKSİYONLARI ==========

        // Moderatörleri yükle
        async function loadModerators() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE}/admin/moderators`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Moderatörler yüklenemedi');

                const moderators = await response.json();
                displayModerators(moderators);
                updateModeratorStats(moderators);
            } catch (error) {
                console.error('Moderatörleri yükleme hatası:', error);
                showErrorAlert('Moderatörleri yüklerken hata oluştu');
            }
        }

        // Moderatörleri görüntüle
        function displayModerators(moderators) {
            const container = document.getElementById('moderators-list');
            const loading = document.getElementById('moderators-loading');

            loading.style.display = 'none';
            container.style.display = 'block';

            if (moderators.length === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Henüz moderatör atanmamış</div>';
                return;
            }

            container.innerHTML = moderators.map(moderator => `
                <div class="moderator-card" style="background: white; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1;">
                            <h4 style="margin-bottom: 8px; color: #333;">🛡️ ${escapeHtml(moderator.username)}</h4>
                            <p style="color: #666; margin-bottom: 8px;">${escapeHtml(moderator.email)}</p>
                            <div style="margin-bottom: 10px;">
                                <span style="background: #28a745; color: white; padding: 3px 8px; border-radius: 12px; font-size: 12px;">
                                    Moderatör
                                </span>
                            </div>
                            <div>
                                <strong style="color: #667eea;">Atanmış Seriler (${moderator.moderatorSeries.length}):</strong>
                                <div style="margin-top: 5px;">
                                    ${moderator.moderatorSeries.length > 0 
                                        ? moderator.moderatorSeries.map(seriesId => 
                                            `<span style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 2px 6px; border-radius: 4px; margin-right: 5px; font-size: 12px;">${seriesId}</span>`
                                          ).join('') 
                                        : '<span style="color: #999; font-style: italic;">Seri atanmamış</span>'
                                    }
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="editModerator('${moderator._id}')" style="background: #667eea; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-size: 12px;">
                                ✏️ Düzenle
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Moderatör istatistiklerini güncelle
        function updateModeratorStats(moderators) {
            const totalModerators = moderators.length;
            const activeModerators = moderators.filter(m => m.moderatorSeries.length > 0).length;
            const totalManagedSeries = new Set(moderators.flatMap(m => m.moderatorSeries)).size;

            document.getElementById('total-moderators-count').textContent = totalModerators;
            document.getElementById('active-moderators-count').textContent = activeModerators;
            document.getElementById('managed-series-count').textContent = totalManagedSeries;
        }

        // Moderatör atama için serileri yükle
        async function loadSeriesForModeratorAssignment() {
            try {
                // Test endpoint kullan (geçici çözüm)
                const response = await fetch(`${API_BASE}/admin/test-available-series`, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) throw new Error('Seriler yüklenemedi');

                const data = await response.json();
                console.log('Moderatör atama için gelen seri verisi:', data);
                
                let series = [];
                if (data.success && Array.isArray(data.series)) {
                    series = data.series;
                } else if (Array.isArray(data)) {
                    series = data;
                } else {
                    console.error('Beklenmeyen veri formatı:', data);
                    throw new Error('Seri verisi yanlış formatta');
                }
                
                const editSeriesSelect = document.getElementById('edit-series-select');
                
                const seriesOptions = series.map(s => 
                    `<option value="${s.id}">${escapeHtml(s.title)} ${s.status ? `(${s.status})` : ''}</option>`
                ).join('');
                
                editSeriesSelect.innerHTML = seriesOptions;
            } catch (error) {
                console.error('Serileri yükleme hatası:', error);
            }
        }

        // Moderatör düzenle
        async function editModerator(moderatorId) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE}/admin/users`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Kullanıcı bilgileri alınamadı');

                const users = await response.json();
                const moderator = users.find(u => u._id === moderatorId);
                
                if (!moderator) {
                    showErrorAlert('Moderatör bulunamadı');
                    return;
                }

                // Modal içeriğini doldur
                document.getElementById('edit-moderator-id').value = moderatorId;
                document.getElementById('edit-moderator-info').innerHTML = `
                    <div><strong>Kullanıcı Adı:</strong> ${escapeHtml(moderator.username)}</div>
                    <div><strong>E-posta:</strong> ${escapeHtml(moderator.email)}</div>
                    <div><strong>Kayıt Tarihi:</strong> ${new Date(moderator.createdAt).toLocaleDateString('tr-TR')}</div>
                `;

                // Mevcut serileri seçili yap
                const editSeriesSelect = document.getElementById('edit-series-select');
                Array.from(editSeriesSelect.options).forEach(option => {
                    option.selected = moderator.moderatorSeries.includes(option.value);
                });

                // Modalı göster
                document.getElementById('moderator-edit-modal').style.display = 'block';
            } catch (error) {
                console.error('Moderatör düzenleme hatası:', error);
                showErrorAlert('Moderatör bilgileri alınamadı');
            }
        }

        // Moderatör modalını kapat
        function closeModeratorModal() {
            document.getElementById('moderator-edit-modal').style.display = 'none';
        }

        // Moderatör güncelle
        document.getElementById('edit-moderator-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const moderatorId = document.getElementById('edit-moderator-id').value;
            const seriesSelect = document.getElementById('edit-series-select');
            const selectedSeries = Array.from(seriesSelect.selectedOptions).map(option => option.value);
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE}/admin/update-moderator-series`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        userId: moderatorId,
                        seriesIds: selectedSeries
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Moderatör güncelleme başarısız');
                }

                showSuccessAlert('Moderatör serileri başarıyla güncellendi');
                closeModeratorModal();
                loadModerators();
            } catch (error) {
                console.error('Moderatör güncelleme hatası:', error);
                showErrorAlert(error.message);
            }
        });

        // Moderatör kaldır
        async function removeModerator() {
            const moderatorId = document.getElementById('edit-moderator-id').value;
            
            if (!confirm('Bu kullanıcının moderatör yetkilerini kaldırmak istediğinizden emin misiniz?')) {
                return;
            }
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE}/admin/remove-moderator`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        userId: moderatorId
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Moderatör kaldırma başarısız');
                }

                showSuccessAlert('Moderatör yetkileri başarıyla kaldırıldı');
                closeModeratorModal();
                loadModerators();
                loadUsersForModeratorAssignment();
            } catch (error) {
                console.error('Moderatör kaldırma hatası:', error);
                showErrorAlert(error.message);
            }
        }

        // ========== KULLANICI YÖNETİMİNDE MODERATÖR FONKSİYONLARI ==========

        // Kullanıcı için seri yükleme
        async function loadSeriesForUserModeratorAssignment() {
            try {
                // Test endpoint kullan (geçici çözüm)
                const response = await fetch(`${API_BASE}/admin/test-available-series`, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) throw new Error('Seriler yüklenemedi');

                const data = await response.json();
                console.log('Gelen seri verisi:', data);
                
                let series = [];
                if (data.success && Array.isArray(data.series)) {
                    series = data.series;
                } else if (Array.isArray(data)) {
                    series = data;
                } else {
                    console.error('Beklenmeyen veri formatı:', data);
                    throw new Error('Seri verisi yanlış formatta');
                }
                
                const userSeriesSelect = document.getElementById('user-series-select');
                
                const seriesOptions = series.map(s => 
                    `<option value="${s.id}">${escapeHtml(s.title)} ${s.status ? `(${s.status})` : ''}</option>`
                ).join('');
                
                userSeriesSelect.innerHTML = seriesOptions;
            } catch (error) {
                console.error('Serileri yükleme hatası:', error);
            }
        }

        // Moderatör atama işlemini ayarla
        function setupModeratorAssignment(user) {
            document.getElementById('selected-user-id').value = user._id;
            
            // Butonları kullanıcı durumuna göre ayarla
            const makeModerator = document.getElementById('make-moderator-btn');
            const updateModerator = document.getElementById('update-moderator-btn');
            const removeModerator = document.getElementById('remove-moderator-btn');
            const seriesSelect = document.getElementById('user-series-select');
            
            if (user.isModerator) {
                // Kullanıcı zaten moderatör
                makeModerator.style.display = 'none';
                updateModerator.style.display = 'inline-block';
                removeModerator.style.display = 'inline-block';
                
                // Mevcut serileri seçili yap
                Array.from(seriesSelect.options).forEach(option => {
                    option.selected = user.moderatorSeries && user.moderatorSeries.includes(option.value);
                });
            } else {
                // Kullanıcı henüz moderatör değil
                makeModerator.style.display = 'inline-block';
                updateModerator.style.display = 'none';
                removeModerator.style.display = 'none';
                
                // Tüm seçimleri temizle
                Array.from(seriesSelect.options).forEach(option => {
                    option.selected = false;
                });
            }
        }

        // Kullanıcıyı moderatör yap
        async function makeUserModerator() {
            const userId = document.getElementById('selected-user-id').value;
            const seriesSelect = document.getElementById('user-series-select');
            const selectedSeries = Array.from(seriesSelect.selectedOptions).map(option => option.value);
            
            if (!userId) {
                showErrorAlert('Kullanıcı ID bulunamadı');
                return;
            }
            
            try {
                const token = getToken();
                const response = await fetch(`${API_BASE}/admin/make-moderator`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        userId: userId,
                        seriesIds: selectedSeries
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Moderatör atama başarısız');
                }

                showSuccessAlert('Kullanıcı başarıyla moderatör yapıldı');
                closeUserModal();
                loadUsers(); // Kullanıcı listesini yenile
            } catch (error) {
                console.error('Moderatör atama hatası:', error);
                showErrorAlert(error.message);
            }
        }

        // Kullanıcının moderatör serilerini güncelle
        async function updateUserModeratorSeries() {
            const userId = document.getElementById('selected-user-id').value;
            const seriesSelect = document.getElementById('user-series-select');
            const selectedSeries = Array.from(seriesSelect.selectedOptions).map(option => option.value);
            
            if (!userId) {
                showErrorAlert('Kullanıcı ID bulunamadı');
                return;
            }
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE}/admin/update-moderator-series`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        userId: userId,
                        seriesIds: selectedSeries
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Moderatör güncelleme başarısız');
                }

                showSuccessAlert('Moderatör serileri başarıyla güncellendi');
                closeUserModal();
                loadUsers(); // Kullanıcı listesini yenile
            } catch (error) {
                console.error('Moderatör güncelleme hatası:', error);
                showErrorAlert(error.message);
            }
        }

        // Kullanıcının moderatör yetkilerini kaldır
        async function removeUserModerator() {
            const userId = document.getElementById('selected-user-id').value;
            
            if (!confirm('Bu kullanıcının moderatör yetkilerini kaldırmak istediğinizden emin misiniz?')) {
                return;
            }
            
            if (!userId) {
                showErrorAlert('Kullanıcı ID bulunamadı');
                return;
            }
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE}/admin/remove-moderator`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        userId: userId
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Moderatör kaldırma başarısız');
                }

                showSuccessAlert('Moderatör yetkileri başarıyla kaldırıldı');
                closeUserModal();
                loadUsers(); // Kullanıcı listesini yenile
            } catch (error) {
                console.error('Moderatör kaldırma hatası:', error);
                showErrorAlert(error.message);
            }
        }
         