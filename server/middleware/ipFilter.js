// IP filtering middleware for admin endpoints
const allowedAdminIPs = [
  '127.0.0.1',
  '::1',
  'localhost',
  // Production'da sizin IP'nizi ekleyin:
  // '123.456.789.0',
];

const adminIPFilter = (req, res, next) => {
  // Development'da IP filtering'i devre dışı bırak
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const clientIP = req.ip || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                   req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   req.headers['x-real-ip'] ||
                   'unknown';

  console.log('Admin access attempt from IP:', clientIP);

  // IPv6 localhost check
  const normalizedIP = clientIP.replace('::ffff:', '');
  
  if (allowedAdminIPs.includes(normalizedIP) || allowedAdminIPs.includes(clientIP)) {
    console.log('✅ Admin IP allowed:', clientIP);
    return next();
  }

  console.log('❌ Admin IP blocked:', clientIP);
  return res.status(403).json({ 
    error: 'Erişim reddedildi',
    message: 'Bu IP adresinden admin paneline erişim izni bulunmamaktadır.'
  });
};

// Development'da kullanım için genel IP logger
const logIP = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  console.log(`${req.method} ${req.path} - IP: ${clientIP}`);
  next();
};

module.exports = { 
  adminIPFilter, 
  logIP,
  allowedAdminIPs 
};
