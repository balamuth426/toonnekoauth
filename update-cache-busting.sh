#!/bin/bash

# Cache busting için tüm script linklerini güncelle
echo "🔄 Cache busting script versiyonları güncelleniyor..."

# JavaScript dosyaları için version güncellemesi
find /Users/talha/Desktop/ToonNekoAuth/client -name "*.html" -exec sed -i '' 's/\.js?v=[0-9]/.js?v=5/g' {} \;
find /Users/talha/Desktop/ToonNekoAuth/client -name "*.html" -exec sed -i '' 's/\.js"/.js?v=5"/g' {} \;

# CSS dosyaları için version güncellemesi
find /Users/talha/Desktop/ToonNekoAuth/client -name "*.html" -exec sed -i '' 's/\.css?v=[0-9]/.css?v=5/g' {} \;
find /Users/talha/Desktop/ToonNekoAuth/client -name "*.html" -exec sed -i '' 's/\.css"/.css?v=5"/g' {} \;

echo "✅ Cache busting tamamlandı!"
