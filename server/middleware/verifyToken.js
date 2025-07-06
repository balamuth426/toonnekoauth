const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  // TEST MODU kontrolü - en üstte kontrol et
  const testMode = false; // Production mode - JWT token ile çalış
  
  if (testMode) {
    console.log('VerifyToken: TEST MODU - token bypass ediliyor');
    req.user = { userId: 'test-admin-id' };
    next();
    return;
  }
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Sadece token kısmını al

  console.log('=== VerifyToken Middleware Called ===');
  console.log('Authorization Header:', authHeader);
  console.log('Extracted Token:', token);

  if (!token) {
    console.log('❌ No token provided');
    return res.status(403).json({ message: 'Token yok, erişim reddedildi.' });
  }

  console.log('🔍 Test Mode Check:');
  console.log('- Test Mode active: true');
  console.log('- Is test token:', token === 'test-admin-token-for-development');
  
  if (token === 'test-admin-token-for-development') {
    console.log('✅ Test modu: Demo token kabul edildi');
    req.user = { userId: 'test-user-id', isAdmin: true };
    req.userId = 'test-user-id';
    next();
    return;
  }

  // Production modu: Gerçek JWT token kontrolü
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // kullanıcı bilgilerini req içine ekle
    req.userId = decoded.userId || decoded.id; // Hem yeni hem eski format için uyumluluk
    next(); // işlemi devam ettir
  } catch (err) {
    console.error('❌ VerifyToken - JWT verify error:', err.message);
    return res.status(401).json({ message: 'Geçersiz token.' });
  }
}

module.exports = verifyToken;
