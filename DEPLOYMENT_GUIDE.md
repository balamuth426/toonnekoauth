# 🚀 ToonNeko Google Drive Deployment Rehberi

## Gerekli Adımlar

### 1. Server Deployment (Render)

1. **Render hesabınıza giriş yapın** ve yeni bir Web Service oluşturun
2. **GitHub repo'nuzu bağlayın**
3. **Build ve Start komutlarını ayarlayın:**
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
4. **Environment Variables ekleyin:**
   - `MONGO_URI`: MongoDB connection string'iniz
   - `JWT_SECRET`: JWT secret key'iniz
   - `NODE_ENV`: `production`

### 2. Client Deployment (Netlify/Vercel)

1. **Client klasörünü deploy edin**
2. **config.js dosyasını güncelleyin:**
   ```javascript
   const ENVIRONMENT = 'production'; // development'tan production'a değiştirin
   ```
3. **Production API URL'ini güncelleyin:**
   ```javascript
   production: {
       API_BASE: 'https://your-render-app.onrender.com/api'  // Gerçek Render URL'inizi yazın
   }
   ```

### 3. Server CORS Ayarları

Server deploy edildikten sonra `/server/server.js` dosyasında CORS ayarlarını güncelleyin:

```javascript
const allowedOrigins = [
    // Development URLs...
    'https://your-client-domain.netlify.app',  // Client domain'iniz
    'https://your-admin-domain.netlify.app'   // Admin panel domain'iniz
];
```

### 4. Google Drive Görsel Linklerini Hazırlama

#### Google Drive'da Görsel Paylaşımı:
1. **Görseli Google Drive'a yükleyin**
2. **Sağ tıklayıp "Paylaş" seçin**
3. **"Bağlantıyı bilene açık" yapın**
4. **Link'i kopyalayın** (format: `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`)

#### Admin Panelinde Kullanım:
- Görselleri admin paneline yapıştırdığınızda otomatik olarak direct access link'ine çevrilir
- Format: `https://drive.google.com/uc?id=FILE_ID`

## 🎯 Kullanım Senaryoları

### Yeni Seri Ekleme:
1. **Admin paneline giriş yapın** (`your-domain.com/admin-panel.html`)
2. **"Yeni Seri" sekmesine gidin**
3. **Seri bilgilerini doldurun:**
   - Başlık, açıklama, yazar vs.
   - **Kapak görseli:** Google Drive link'i
4. **"Görseli Doğrula" ile test edin**
5. **"Seri Oluştur" butonuna basın**

### Yeni Bölüm Ekleme:
1. **"Yeni Bölüm" sekmesine gidin**
2. **Seriyi seçin ve bölüm numarası girin**
3. **Bölüm görsellerini ekleyin:**
   - Her sayfa için ayrı Google Drive linki
   - "+" butonu ile yeni sayfa ekleyebilirsiniz
4. **"Görselleri Önizle" ile kontrol edin**
5. **"Bölüm Oluştur" butonuna basın**

## 🔧 API Endpoints

### Yeni Eklenen Endpoints:

- `POST /api/admin/validate-drive-link` - Google Drive linkini doğrular
- `POST /api/admin/create-series` - Yeni seri oluşturur
- `POST /api/admin/create-chapter-with-images` - Görsellerle bölüm oluşturur

### Örnek Request (Yeni Seri):
```javascript
POST /api/admin/create-series
{
    "title": "Attack on Titan",
    "seriesId": "attackontitan",
    "description": "Devasa titanlara karşı savaş...",
    "coverImageUrl": "https://drive.google.com/file/d/1ABC123.../view",
    "author": "Hajime Isayama",
    "genre": ["Aksiyon", "Drama"],
    "status": "Tamamlandı"
}
```

### Örnek Request (Yeni Bölüm):
```javascript
POST /api/admin/create-chapter-with-images
{
    "seriesId": "attackontitan",
    "chapterNumber": 1,
    "title": "İnsanlığa",
    "imageUrls": [
        "https://drive.google.com/file/d/1ABC123.../view",
        "https://drive.google.com/file/d/2DEF456.../view",
        "https://drive.google.com/file/d/3GHI789.../view"
    ]
}
```

## 📝 Önemli Notlar

### Google Drive Limitasyonları:
- **Günlük indirme limiti:** 750GB/gün (genelde sorun olmaz)
- **Dosya boyutu:** Maksimum 5TB (tek dosya için)
- **Hız:** İlk yüklemede yavaş olabilir, sonrasında cache'lenir

### Alternatif Çözümler:
- **Imgur API:** Daha hızlı ama limitli
- **Cloudinary:** Ücretli ama profesyonel
- **AWS S3:** En güvenilir ama teknik kurulum gerektirir

### Güvenlik:
- Admin paneline giriş için JWT token gerekli
- Sadece admin kullanıcıları seri/bölüm ekleyebilir
- CORS koruması aktif

## 🚨 Deployment Sonrası Kontrol Listesi

- [ ] Server Render'da çalışıyor
- [ ] Client deploy edildi
- [ ] config.js production modda
- [ ] CORS ayarları doğru domain'leri içeriyor
- [ ] MongoDB connection aktif
- [ ] Admin paneline erişim sağlandı
- [ ] Test seri/bölüm eklendi
- [ ] Google Drive görselleri görüntüleniyor

## 📞 Sorun Giderme

### Görsel yüklenmiyor:
1. Google Drive linkinin doğru formatda olduğunu kontrol edin
2. Dosyanın "herkese açık" olduğunu kontrol edin
3. Admin panelinde "Link Doğrula" özelliğini kullanın

### CORS hatası:
1. Server CORS ayarlarında client domain'inin ekli olduğunu kontrol edin
2. HTTPS/HTTP protokol farkına dikkat edin

### Authentication hatası:
1. JWT token'ın localStorage'da olduğunu kontrol edin
2. Token'ın süresi dolmuş olabilir, yeniden giriş yapın
