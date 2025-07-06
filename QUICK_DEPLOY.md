# Quick Start Deployment Guide

## 🚀 Hızlı Başlangıç (5 Dakikada Deploy)

### 1. GitHub'a Push
```bash
git init
git add .
git commit -m "Initial deployment"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/toonnekoauth.git
git push -u origin main
```

### 2. Render (Backend)
1. [render.com](https://render.com) → GitHub ile giriş
2. "New +" → "Web Service"
3. Repository seç: `toonnekoauth`
4. Settings:
   - **Name**: `toonnekoauth-api`
   - **Runtime**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && node server.js`
5. Environment Variables ekle:
   ```
   MONGO_URI=mongodb+srv://hanabi261:Maleficent.426@toonnekocluster.1rdsgam.mongodb.net/test?retryWrites=true&w=majority&appName=toonNekoCluster
   JWT_SECRET=toonneko_super_guclu_production_secret_2024
   ADMIN_TEST_MODE=false
   GMAIL_APP_PASSWORD=tmfy lhjk cpdw pzny
   NODE_ENV=production
   PORT=10000
   ```
6. "Create Web Service" → Deploy bekle (5-10 dk)

### 3. Netlify (Frontend)
1. [netlify.com](https://netlify.com) → GitHub ile giriş
2. "New site from Git" → Repository seç
3. Settings:
   - **Build command**: Boş
   - **Publish directory**: `client`
4. Deploy bekle (2-5 dk)
5. Site URL'ini kopyala

### 4. URL Güncellemeleri
1. Render URL'ini al (örn: `https://toonnekoauth-api.onrender.com`)
2. `client/config.js` dosyasında production URL'i güncelle
3. Git push yap

### 5. Test
- Netlify URL'inde siteyi aç
- Kayıt/Giriş test et
- Admin panel test et: `https://your-site.netlify.app/secure-admin-xyz123.html`

## 🔧 Troubleshooting

### CORS Hatası
- Server'daki `corsOptions` içinde Netlify URL'ini ekle
- Git push → Render otomatik redeploy olur

### 502 Bad Gateway
- Render logs kontrol et
- Environment variables doğru mu?

### Admin Panel Erişim
- `https://your-site.netlify.app/secure-admin-xyz123.html`
- Test kullanıcısı: admin/admin (ADMIN_TEST_MODE=true ise)

## 📱 URLs
- **Frontend**: https://your-site.netlify.app
- **Backend**: https://your-app.onrender.com
- **Admin**: https://your-site.netlify.app/secure-admin-xyz123.html
- **Health Check**: https://your-app.onrender.com/api/health

## ⚡ Hızlı Komutlar
```bash
# Local test
npm start

# Deployment check
./deployment-check.sh

# Git update
git add . && git commit -m "Update" && git push

# Logs (Render dashboard)
# Network tab (Browser F12)
```

Başarılı deployment! 🎉
