# ToonNeko Projesi - Ultra Detaylı Deployment Rehberi
## 🎯 Her Tuş, Her Tık, Her Adım Detayıyla Anlatılmıştır

### 📋 İçindekiler
1. [Proje Genel Bakış](#proje-genel-bakış)
2. [Ön Hazırlık - Adım Adım](#ön-hazırlık---adım-adım)
3. [GitHub Repository Oluşturma - Detaylı](#github-repository-oluşturma---detaylı)
4. [Backend (Server) Deployment - Render - Tıklama Rehberi](#backend-server-deployment---render---tıklama-rehberi)
5. [Frontend (Client) Deployment - Netlify - Buton Rehberi](#frontend-client-deployment---netlify---buton-rehberi)
6. [Environment Değişkenleri - Kopyala Yapıştır](#environment-değişkenleri---kopyala-yapıştır)
7. [URL Güncellemeleri - Hangi Satırı Değiştireceksiniz](#url-güncellemeleri---hangi-satırı-değiştireceksiniz)
8. [Admin Panel Test - Hangi Linkten Gireceğiniz](#admin-panel-test---hangi-linkten-gireceğiniz)
9. [Troubleshooting - Problem ve Çözüm](#troubleshooting---problem-ve-çözüm)
10. [Domain Ayarları - DNS Kayıtları](#domain-ayarları---dns-kayıtları)

---

## 🎯 Proje Genel Bakış

**Ne Deploy Edeceğiz:**
- **Backend (API Server)**: `/server` klasörü → Render.com'a
- **Frontend (Website)**: `/client` klasörü → Netlify.com'a  
- **Database**: MongoDB Atlas (zaten hazır)
- **Admin Panel**: Özel güvenli URL ile

**Sonuç URLs:**
- Website: `https://[SİZİN-SİTE-ADI].netlify.app`
- API: `https://[SİZİN-API-ADI].onrender.com`
- Admin: `https://[SİZİN-SİTE-ADI].netlify.app/secure-admin-xyz123.html`

---

## 🚀 Ön Hazırlık - Adım Adım

### ADIM 1: Terminal Açma
1. **Mac**: `Cmd + Space` tuşlarına basın
2. "Terminal" yazın ve `Enter` basın
3. Terminal penceresi açılacak

### ADIM 2: Proje Dizinine Gitme
```bash
cd /Users/talha/Desktop/ToonNekoAuth
```
**Nasıl yapılır:**
1. Terminal'de yukarıdaki komutu yazın
2. `Enter` tuşuna basın
3. Prompt `ToonNekoAuth %` olarak değişecek

### ADIM 3: Deployment Kontrolü
```bash
./deployment-check.sh
```
**Nasıl yapılır:**
1. Bu komutu terminal'e yazın
2. `Enter` basın
3. Yeşil ✅ işaretler görmelisiniz

**EĞER "Permission denied" hatası alırsanız:**
```bash
chmod +x deployment-check.sh
./deployment-check.sh
```

---

## 📁 GitHub Repository Oluşturma - Detaylı

### ADIM 1: GitHub'a Giriş
1. **Browser açın** (Chrome, Safari, Firefox)
2. **Adres çubuğuna yazın**: `github.com`
3. `Enter` tuşuna basın
4. **Sağ üstte "Sign in" butonuna** tıklayın
5. Username ve password girin
6. **"Sign in" butonuna** tıklayın

### ADIM 2: Yeni Repository Oluşturma
1. **Giriş yaptıktan sonra sağ üstte "+" işaretine** tıklayın
2. Açılan menüden **"New repository"** seçin
3. **Repository name** kutusuna: `toonnekoauth` yazın
4. **Description** kutusuna: `ToonNeko Manhwa Reading Platform` yazın
5. **"Public"** seçili olduğundan emin olun
6. **"Add a README file"** işaretini KALDIRIN (boş bırakın)
7. **".gitignore"** seçmeyin (bizde zaten var)
8. **"Choose a license"** seçmeyin
9. **Yeşil "Create repository" butonuna** tıklayın

### ADIM 3: Repository URL'ini Kopyalama
1. Repository oluşturulduktan sonra **yeşil "Code" butonuna** tıklayın
2. **"HTTPS" sekmesinin** seçili olduğundan emin olun
3. URL'in yanındaki **kopyalama ikonuna** tıklayın
4. URL kopyalanacak (örn: `https://github.com/KULLANICI_ADINIZ/toonnekoauth.git`)

### ADIM 4: Local Git Kurulumu
**Terminal'de sırayla şu komutları çalıştırın:**

```bash
git init
```
1. Bu komutu yazın, `Enter` basın
2. "Initialized empty Git repository" mesajı gelecek

```bash
git add .
```
1. Bu komutu yazın, `Enter` basın
2. Tüm dosyalar Git'e eklenecek

```bash
git commit -m "Initial commit - ToonNeko deployment ready"
```
1. Bu komutu TAM OLARAK yazın, `Enter` basın
2. Commit mesajı görünecek

```bash
git branch -M main
```
1. Bu komutu yazın, `Enter` basın
2. Ana branch'i main yapar

```bashgit push -u origin mainbalamuth426
git remote add origin https://github.com/KULLANICI_ADINIZ/toonnekoauth.git
```
**ÖNEMLİ**: `KULLANICI_ADINIZ` yazan yeri GitHub kullanıcı adınızla değiştirin!
1. Komutu kendi kullanıcı adınızla yazın, `Enter` basın

```bash
git push -u origin main
```
1. Bu komutu yazın, `Enter` basın
2. GitHub username ve password istenebilir
3. **Personal Access Token** isteyebilir (GitHub'da Settings > Developer settings > Personal access tokens'dan oluşturun)

**BAŞARILI OLDUĞUNUZU NASIL ANLAYACAKSINIZ:**
- Terminal'de "Branch 'main' set up to track..." mesajı gelecek
- GitHub sayfasını yenilediğinizde dosyalarınızı göreceksiniz

---

## 🖥️ Backend (Server) Deployment - Render - Tıklama Rehberi

### ADIM 1: Render.com'a Giriş
1. **Yeni browser tab açın**: `Ctrl+T` (Windows) veya `Cmd+T` (Mac)
2. **Adres çubuğuna yazın**: `render.com`
3. `Enter` tuşuna basın
4. **Sağ üstte "Get Started for Free" butonuna** tıklayın
5. **"GitHub" butonuna** tıklayın (GitHub ile giriş)
6. **"Authorize Render"** butonuna tıklayın

### ADIM 2: Web Service Oluşturma
1. **Dashboard'da sol üstte "New +" butonuna** tıklayın
2. Açılan menüden **"Web Service"** seçin
3. **"Build and deploy from a Git repository"** seçin
4. **"Next" butonuna** tıklayın

### ADIM 3: Repository Seçme
1. **"Connect a repository" bölümünde** GitHub hesabınızı görün
2. **"toonnekoauth" repository'sinin** yanındaki **"Connect" butonuna** tıklayın

### ADIM 4: Service Ayarları (ÇOK ÖNEMLİ!)
**Name kutusuna yazın:**
```
toonnekoauth-api
```

**Runtime dropdown'dan seçin:**
- Dropdown'a tıklayın
- **"Node"** seçin

**Region dropdown'dan seçin:**
- **"Oregon (US West)"** seçin (en hızlı ücretsiz)

**Branch:**
- **"main"** yazılı olmalı

**Root Directory:**
- **BOŞ BIRAKIN** (hiçbir şey yazmayın)

**Build Command kutusuna yazın:**
```
cd server && npm install
```

**Start Command kutusuna yazın:**
```
cd server && node server.js
```

### ADIM 5: Instance Type Seçimi
1. **"Free" seçin** (0$/month)
2. **Otomatik olarak seçili gelecek**

### ADIM 6: Environment Variables (Çok Önemli!)
1. **"Advanced" bölümünü genişletin** (tıklayın)
2. **"Add Environment Variable" butonuna** tıklayın

**Her birini tek tek ekleyin:**

**1. MONGO_URI:**
- **Key**: `MONGO_URI`
- **Value**: `mongodb+srv://hanabi261:Maleficent.426@toonnekocluster.1rdsgam.mongodb.net/test?retryWrites=true&w=majority&appName=toonNekoCluster`
- **"Add Environment Variable"** butonuna tıklayın

**2. JWT_SECRET:**
- **Key**: `JWT_SECRET`  
- **Value**: `toonneko_super_guclu_production_secret_2024_xyz789`
- **"Add Environment Variable"** butonuna tıklayın

**3. ADMIN_TEST_MODE:**
- **Key**: `ADMIN_TEST_MODE`
- **Value**: `false`
- **"Add Environment Variable"** butonuna tıklayın

**4. GMAIL_APP_PASSWORD:**
- **Key**: `GMAIL_APP_PASSWORD`
- **Value**: `tmfy lhjk cpdw pzny`
- **"Add Environment Variable"** butonuna tıklayın

**5. NODE_ENV:**
- **Key**: `NODE_ENV`
- **Value**: `production`
- **"Add Environment Variable"** butonuna tıklayın

**6. PORT:**
- **Key**: `PORT`
- **Value**: `10000`
- **"Add Environment Variable"** butonuna tıklayın

### ADIM 7: Deploy Başlatma
1. **Sayfayı aşağı kaydırın**
2. **Büyük mavi "Create Web Service" butonuna** tıklayın
3. **Deploy başlayacak** (5-10 dakika sürer)

### ADIM 8: Deploy Takibi
1. **Deploy sırasında "Logs" sekmesinde** ne olduğunu izleyin
2. **"Building..."** yazısı görünecek
3. **"==> Build successful"** mesajını bekleyin
4. **"==> Starting server"** mesajını bekleyin
5. **"Your service is live"** mesajını görünce HAZIR!

### ADIM 9: URL Alma (ÇOK ÖNEMLİ!)
1. **Deploy tamamlandıktan sonra üstte URL görünecek**
2. Benzer bir şey: `https://toonnekoauth-api.onrender.com`
3. **Bu URL'i kopyalayın** (yanındaki kopyalama ikonuna tıklayın)
4. **Not defterine yapıştırın** - sonra lazım olacak!

### ADIM 10: Test
1. **Browser'da yeni tab açın**
2. **URL + /api/health** yazın: `https://toonnekoauth-api.onrender.com/api/health`
3. **JSON response gelirse BAŞARILI!**

---

## 🌐 Frontend (Client) Deployment - Netlify - Buton Rehberi

### ADIM 1: Netlify.com'a Giriş
1. **Yeni browser tab açın**: `Ctrl+T` (Windows) veya `Cmd+T` (Mac)
2. **Adres çubuğuna yazın**: `netlify.com`
3. `Enter` tuşuna basın
4. **Sağ üstte "Log in" butonuna** tıklayın
5. **"GitHub" butonuna** tıklayın
6. **"Authorize netlify"** butonuna tıklayın

### ADIM 2: Site Oluşturma
1. **Dashboard'da yeşil "Add new site" butonuna** tıklayın
2. **"Import an existing project"** seçin
3. **"Deploy with GitHub"** butonuna tıklayın
4. **"Authorize Netlify"** (tekrar istenirse)

### ADIM 3: Repository Seçme
1. **Repository listesinde "toonnekoauth"** arayın
2. **"toonnekoauth" yanındaki "Deploy site"** butonuna tıklayın

### ADIM 4: Build Ayarları (ÇOK DİKKAT!)
**Bu ekranda şu ayarları yapın:**

**Branch to deploy:**
- **"main"** seçili olmalı

**Base directory:**
- **BOŞ BIRAKIN** (hiçbir şey yazmayın)

**Build command:**
- **BOŞ BIRAKIN** (hiçbir şey yazmayın)

**Publish directory:**
```
client
```
(sadece "client" yazın)

**Functions directory:**
- **BOŞ BIRAKIN**

### ADIM 5: Deploy Başlatma
1. **"Deploy site" butonuna** tıklayın
2. **Deploy başlayacak** (2-5 dakika)

### ADIM 6: Site URL Alma
1. **Deploy tamamlandıktan sonra** üstte random URL görünecek
2. Benzer: `https://amazing-babbage-123456.netlify.app`
3. **Bu URL'i kopyalayın**
4. **Not defterine yapıştırın**

### ADIM 7: Site Adı Değiştirme (Opsiyonel)
1. **"Site settings" butonuna** tıklayın
2. **"Change site name" butonuna** tıklayın
3. **İstediğiniz adı yazın**: `toonnekoauth` 
4. **"Save" butonuna** tıklayın
5. **Yeni URL**: `https://toonnekoauth.netlify.app`

---

## 🔧 Environment Değişkenleri - Kopyala Yapıştır

### Config.js Güncelleme (ÇOK ÖNEMLİ!)

**ADIM 1: Render URL'ini Al**
- Render dashboard'dan API URL'ini kopyalayın
- Örnek: `https://toonnekoauth-api.onrender.com`

**ADIM 2: VS Code'da client/config.js Aç**
1. **VS Code'u açın**
2. **File > Open Folder** → ToonNekoAuth klasörünü seçin
3. **client > config.js** dosyasını açın

**ADIM 3: URL Değiştir**
**Bu satırı bulun:**
```javascript
API_BASE: 'https://toonnekoauth-api.onrender.com/api'
```

**Kendi Render URL'inizi yazın:**
```javascript
API_BASE: 'https://KENDI-RENDER-URL-INİZ.onrender.com/api'
```

**ADIM 4: Kaydet ve Push**
```bash
git add .
git commit -m "Update production API URL"
git push
```

**Netlify otomatik olarak yeniden deploy edecek!**

---

## 🔒 Admin Panel Test - Hangi Linkten Gireceğiniz

### Admin Panel URL'i
```
https://[SİZİN-NETLİFY-URL-INİZ]/secure-admin-xyz123.html
```

**Örnek:**
```
https://toonnekoauth.netlify.app/secure-admin-xyz123.html
```

### Test Giriş Bilgileri
**EĞER ADMIN_TEST_MODE=true ISE:**
- **Username**: `admin`
- **Password**: `admin`

**EĞER ADMIN_TEST_MODE=false ISE:**
- Database'deki gerçek admin hesabı kullanılır

### Admin Panel Test Adımları
1. **Admin URL'ini browser'da açın**
2. **Username ve password girin**
3. **"Güvenli Giriş" butonuna** tıklayın
4. **Başarılı ise admin-panel.html'e yönlendirileceksiniz**

---

## 🐛 Troubleshooting - Problem ve Çözüm

### Problem 1: "502 Bad Gateway" (Render)
**Belirti:** API URL açılmıyor, 502 hatası
**Çözüm:**
1. **Render dashboard > Logs** sekmesine gidin
2. **Hata mesajlarını okuyun**
3. **Environment variables kontrol edin**
4. **Build command doğru mu?** `cd server && npm install`
5. **Start command doğru mu?** `cd server && node server.js`

### Problem 2: "CORS Error" (Browser Console)
**Belirti:** 
```
Access to fetch at 'https://api...' from origin 'https://site...' has been blocked by CORS policy
```
**Çözüm:**
1. **VS Code'da server/server.js açın**
2. **corsOptions içinde allowedOrigins array'ini bulun**
3. **Netlify URL'inizi ekleyin:**
```javascript
const allowedOrigins = [
  // ...mevcut URLs...
  'https://KENDI-NETLIFY-URL-INİZ.netlify.app',
];
```
4. **Git push yapın** → Render otomatik redeploy

### Problem 3: "Cannot GET /" (Netlify)
**Belirti:** Ana sayfa yüklenmıyor
**Çözüm:**
1. **Netlify dashboard > Site settings > Build & deploy**
2. **Publish directory "client" mi?**
3. **client/_redirects dosyası var mı?**

### Problem 4: Admin Panel 404
**Belirti:** secure-admin-xyz123.html bulunamıyor
**Çözüm:**
1. **Dosya client/ klasöründe mi?**
2. **URL doğru yazıldı mı?**
3. **Netlify deploy tamamlandı mı?**

### Problem 5: Database Connection Error
**Belirti:** MongoDB bağlantı hatası
**Çözüm:**
1. **MONGO_URI doğru mu?**
2. **MongoDB Atlas'ta Network Access ayarları**
3. **IP whitelist'e 0.0.0.0/0 eklendi mi?**

---

## 🌍 Domain Ayarları - DNS Kayıtları

### Custom Domain Ekleme (Opsiyonel)

**ADIM 1: Domain Satın Al**
- Namecheap, GoDaddy, vs. sitelerden domain alın
- Örnek: `toonneko.com`

**ADIM 2: Netlify'da Domain Ekleme**
1. **Netlify dashboard > Domain settings**
2. **"Add custom domain" butonuna** tıklayın  
3. **Domain adınızı yazın**: `toonneko.com`
4. **"Verify" butonuna** tıklayın
5. **"Add domain" butonuna** tıklayın

**ADIM 3: DNS Kayıtları (Domain sağlayıcısında)**
**A Record:**
- **Type**: A
- **Name**: @ (veya boş)
- **Value**: 75.2.60.5
- **TTL**: 3600

**CNAME Record:**
- **Type**: CNAME  
- **Name**: www
- **Value**: KENDI-SITE-ADI.netlify.app
- **TTL**: 3600

**ADIM 4: SSL Certificate**
- Netlify otomatik olarak Let's Encrypt SSL sertifikası ekler
- 24 saat içinde HTTPS aktif olur

### API için Subdomain (Opsiyonel)

**ADIM 1: Render'da Custom Domain**
1. **Render dashboard > Settings**
2. **"Custom Domains" butonuna** tıklayın
3. **"Add custom domain" butonuna** tıklayın
4. **"api.toonneko.com" yazın**

**ADIM 2: DNS Kaydı**
**CNAME Record:**
- **Type**: CNAME
- **Name**: api  
- **Value**: KENDI-RENDER-APP.onrender.com
- **TTL**: 3600

---

## ✅ Final Kontrol Listesi

### ☑️ Backend (Render) Kontrolleri
- [ ] Repository GitHub'da
- [ ] Render'da Web Service oluşturuldu
- [ ] Environment variables eklendi (6 tane)
- [ ] Build successful oldu
- [ ] `/api/health` endpoint çalışıyor
- [ ] URL not edildi

### ☑️ Frontend (Netlify) Kontrolleri  
- [ ] Netlify'da site oluşturuldu
- [ ] Publish directory "client" ayarlandı
- [ ] Deploy successful oldu
- [ ] Site açılıyor
- [ ] URL not edildi

### ☑️ Configuration Kontrolleri
- [ ] `client/config.js` production URL güncellendi
- [ ] CORS allowedOrigins'da Netlify URL var
- [ ] Git push yapıldı
- [ ] Otomatik redeploy tamamlandı

### ☑️ Functional Test
- [ ] Ana sayfa yükleniyor
- [ ] Kayıt/Giriş çalışıyor  
- [ ] Seri sayfaları açılıyor
- [ ] Admin panel erişilebilir
- [ ] `/secure-admin-xyz123.html` çalışıyor

### ☑️ Security Kontrolleri
- [ ] `ADMIN_TEST_MODE=false` (production)
- [ ] Strong JWT secret kullanılıyor
- [ ] HTTPS aktif
- [ ] Admin URL gizli

---

## 🎉 Tebrikler!

Artık ToonNeko projeniz **CANLI** olarak yayında! 

**Site URL'iniz:** `https://[SİZİN-URL].netlify.app`
**Admin Panel:** `https://[SİZİN-URL].netlify.app/secure-admin-xyz123.html`

### 📱 Paylaşım İçin:
- Ana site linkini paylaşabilirsiniz
- Admin linkini GİZLİ tutun
- MongoDB ve API güvenli

### 🔄 Güncelleme Yapmak İçin:
```bash
git add .
git commit -m "Update mesajı"
git push
```
**Hem Render hem Netlify otomatik olarak güncellenecek!**

**Başarılarınızın devamını dileriz! 🚀**
