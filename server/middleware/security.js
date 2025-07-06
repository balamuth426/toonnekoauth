// HTTPS redirect middleware for production
const httpsOnly = (req, res, next) => {
  // Production'da HTTPS'e yönlendir
  if (process.env.NODE_ENV === 'production') {
    // Render.com'da x-forwarded-proto header'ı kullanılır
    const forwardedProto = req.headers['x-forwarded-proto'];
    
    if (forwardedProto && forwardedProto !== 'https') {
      const httpsUrl = `https://${req.headers.host}${req.url}`;
      console.log('Redirecting to HTTPS:', httpsUrl);
      return res.redirect(301, httpsUrl);
    }
  }
  
  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS için (sadece HTTPS'de)
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

module.exports = { 
  httpsOnly, 
  securityHeaders 
};
