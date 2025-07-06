# ToonNeko Admin Panel Kullanım Kılavuzu

## Admin Paneli Kurulumu

1. **Server'ı Başlatın:**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Admin Paneline Erişim:**
   - Tarayıcınızda `http://localhost:3000/admin-panel.html` adresine gidin

## Test ve Production Modları

### Test Modu (Varsayılan)
- MongoDB bağlantısı olmadan çalışır
- Sabit test verileri gösterir
- Tüm admin işlemleri simüle edilir
- `ADMIN_TEST_MODE=true` veya `NODE_ENV=test` ile aktif

### Production Modu
- Gerçek MongoDB veritabanı gerekir
- Canlı kullanıcı verileri ile çalışır
- `.env` dosyasında `ADMIN_TEST_MODE=false` yapın veya kaldırın

## Admin Panel Özellikleri

### 📊 İstatistikler
- Toplam seri sayısı
- Toplam bölüm sayısı
- Kullanıcı istatistikleri

### 📚 Seri Yönetimi
- Mevcut serileri düzenleme
- Yeni seri oluşturma
- Seri kapak resmi güncelleme
- Seri detaylarını düzenleme

### 👥 Kullanıcı Yönetimi
- Kullanıcıları listeleme ve arama
- Admin yetkisi verme/alma
- Kullanıcı engelleme/engel kaldırma
- Kullanıcı silme
- Kullanıcı detaylarını görüntüleme

### 🔗 Link Doğrulama
- Google Drive linklerini test etme
- Resim URL'lerini doğrulama

### ⚙️ Bölüm Yönetimi
- Seri bölümlerini listeleme
- Bölüm düzenleme (geliştirilmekte)

## Environment Variables

`.env` dosyasını `.env.example` dosyasından oluşturun:

```bash
cp .env.example .env
```

Önemli ayarlar:
- `MONGO_URI`: MongoDB bağlantı string'i
- `JWT_SECRET`: JWT token için secret key
- `ADMIN_TEST_MODE`: Test modu için `true`, production için `false`

## Güvenlik

- Admin paneline erişim için admin yetkisi gereklidir
- Engelli kullanıcılar sisteme giriş yapamaz
- Kullanıcılar kendi hesaplarını silme/engelleme işlemi yapamaz

## Troubleshooting

### MongoDB Bağlantı Sorunu
- MongoDB'nin çalıştığından emin olun
- `MONGO_URI` ayarını kontrol edin
- Test modu için `ADMIN_TEST_MODE=true` yapın

### Admin Yetkisi Sorunu
- Test modunda tüm kullanıcılar admin kabul edilir
- Production modunda veritabanında `isAdmin: true` olmalı

### Kullanıcı Görünmüyor
- Test modunda sabit 3 kullanıcı görünür
- Production modunda veritabanındaki gerçek kullanıcılar görünür
