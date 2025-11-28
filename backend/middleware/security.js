// Additional security middleware for production environments

const securityMiddleware = (req, res, next) => {
  // Remove sensitive headers that might leak information
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  // Add additional security headers not covered by helmet
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  
  // Prevent caching of sensitive API responses
  if (req.path.includes('/api/auth') || req.path.includes('/api/users')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  // Log security events in production
  if (process.env.NODE_ENV === 'production') {
    const securityHeaders = [
      'authorization',
      'x-forwarded-for',
      'x-real-ip',
      'user-agent'
    ];
    
    const logData = {
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      headers: {}
    };
    
    // Log specific security-relevant headers
    securityHeaders.forEach(header => {
      if (req.get(header)) {
        logData.headers[header] = req.get(header);
      }
    });
    
    // Log potential security issues
    if (req.get('X-Forwarded-For') && req.get('X-Forwarded-For').split(',').length > 3) {
      console.warn('Potential proxy chain detected:', logData);
    }
  }
  
  next();
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Skip sanitization for multipart/form-data (file uploads)
  // Multer handles these requests and req.body might not be available yet
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    return next();
  }
  
  // Sanitize common XSS vectors in request body
  if (req.body && typeof req.body === 'object') {
    const sanitizeString = (str) => {
      if (typeof str !== 'string') return str;
      
      return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
        .trim();
    };
    
    const sanitizeObject = (obj) => {
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'string') {
            obj[key] = sanitizeString(obj[key]);
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          }
        }
      }
    };
    
    sanitizeObject(req.body);
  }
  
  next();
};

module.exports = {
  securityMiddleware,
  sanitizeInput
};