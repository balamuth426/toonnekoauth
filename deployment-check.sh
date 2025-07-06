#!/bin/bash

# ToonNeko Deployment Hazırlık Scripti
# Bu script deployment öncesi gerekli kontrolleri yapar

echo "🚀 ToonNeko Deployment Hazırlık Başlıyor..."

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Kontrol fonksiyonu
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1 mevcut${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 bulunamadı${NC}"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅ $1 dizini mevcut${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 dizini bulunamadı${NC}"
        return 1
    fi
}

echo -e "${BLUE}📋 Dosya Kontrolleri${NC}"
check_file "package.json"
check_file "server/package.json"
check_file "server/server.js"
check_file "client/config.js"
check_file "client/_redirects"
check_file ".gitignore"
check_file ".env.production.example"

echo -e "\n${BLUE}📁 Dizin Kontrolleri${NC}"
check_dir "server"
check_dir "client"
check_dir "server/routes"
check_dir "server/middleware"
check_dir "client/scripts"

echo -e "\n${BLUE}🔧 Dependency Kontrolleri${NC}"

# Node.js version check
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js bulunamadı${NC}"
fi

# NPM version check
NPM_VERSION=$(npm --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ NPM: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ NPM bulunamadı${NC}"
fi

echo -e "\n${BLUE}📦 Server Dependencies Kontrol${NC}"
cd server
if npm list --depth=0 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server dependencies OK${NC}"
else
    echo -e "${YELLOW}⚠️ Server dependencies eksik - npm install çalıştırılıyor...${NC}"
    npm install
fi
cd ..

echo -e "\n${BLUE}🌐 Environment Kontrolleri${NC}"

# .env dosyası kontrolü
if [ -f "server/.env" ]; then
    echo -e "${GREEN}✅ .env dosyası mevcut${NC}"
    
    # Önemli env değişkenlerini kontrol et
    if grep -q "MONGO_URI" server/.env; then
        echo -e "${GREEN}✅ MONGO_URI ayarlanmış${NC}"
    else
        echo -e "${RED}❌ MONGO_URI eksik${NC}"
    fi
    
    if grep -q "JWT_SECRET" server/.env; then
        echo -e "${GREEN}✅ JWT_SECRET ayarlanmış${NC}"
    else
        echo -e "${RED}❌ JWT_SECRET eksik${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ .env dosyası bulunamadı${NC}"
fi

echo -e "\n${BLUE}🔒 Güvenlik Kontrolleri${NC}"

# Admin test mode kontrolü
if grep -q "ADMIN_TEST_MODE=true" server/.env 2>/dev/null; then
    echo -e "${YELLOW}⚠️ ADMIN_TEST_MODE=true (Production için false yapın)${NC}"
elif grep -q "ADMIN_TEST_MODE=false" server/.env 2>/dev/null; then
    echo -e "${GREEN}✅ ADMIN_TEST_MODE=false${NC}"
else
    echo -e "${YELLOW}⚠️ ADMIN_TEST_MODE tanımlı değil${NC}"
fi

# .gitignore kontrolü
if grep -q ".env" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✅ .env dosyası .gitignore'da${NC}"
else
    echo -e "${RED}❌ .env dosyası .gitignore'da değil${NC}"
fi

echo -e "\n${BLUE}🧪 Test Çalıştırmaları${NC}"

echo -e "${YELLOW}Server başlatma testi...${NC}"
cd server
timeout 10s node server.js > /dev/null 2>&1 &
SERVER_PID=$!
sleep 3

if kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Server başarıyla başlatıldı${NC}"
    kill $SERVER_PID 2>/dev/null
else
    echo -e "${RED}❌ Server başlatılamadı${NC}"
fi
cd ..

echo -e "\n${BLUE}📊 Deployment Özeti${NC}"

# Dosya boyutları
CLIENT_SIZE=$(du -sh client 2>/dev/null | cut -f1)
SERVER_SIZE=$(du -sh server 2>/dev/null | cut -f1)

echo -e "📁 Client boyutu: ${CLIENT_SIZE}"
echo -e "📁 Server boyutu: ${SERVER_SIZE}"

# Git durumu
if [ -d ".git" ]; then
    BRANCH=$(git branch --show-current 2>/dev/null)
    COMMITS=$(git rev-list --count HEAD 2>/dev/null)
    echo -e "🌿 Git branch: ${BRANCH}"
    echo -e "📝 Toplam commit: ${COMMITS}"
    
    # Uncommitted changes
    if git diff-index --quiet HEAD -- 2>/dev/null; then
        echo -e "${GREEN}✅ Tüm değişiklikler commit edilmiş${NC}"
    else
        echo -e "${YELLOW}⚠️ Commit edilmemiş değişiklikler var${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Git repository başlatılmamış${NC}"
fi

echo -e "\n${BLUE}🚀 Deployment Adımları${NC}"
echo -e "1. ${YELLOW}GitHub repository oluşturun ve push edin${NC}"
echo -e "2. ${YELLOW}Render.com'da web service oluşturun${NC}"
echo -e "3. ${YELLOW}Netlify'da site oluşturun${NC}"
echo -e "4. ${YELLOW}Environment variables'ları ayarlayın${NC}"
echo -e "5. ${YELLOW}Domain ayarlarını yapın (opsiyonel)${NC}"

echo -e "\n${GREEN}🎉 Hazırlık kontrolü tamamlandı!${NC}"

# Deployment rehberi linkini göster
echo -e "\n${BLUE}📖 Detaylı adımlar için: DEPLOYMENT_GUIDE_COMPLETE.md${NC}"

exit 0
