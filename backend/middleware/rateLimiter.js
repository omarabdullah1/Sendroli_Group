const rateLimit = require('express-rate-limit');

// General API rate limiting - applies to all API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip} on route: ${req.originalUrl}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      error: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per window
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
    error: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`Auth rate limit exceeded for IP: ${req.ip} on route: ${req.originalUrl}`);
    res.status(429).json({
      success: false,
      message: 'Too many login attempts from this IP, please try again after 15 minutes.',
      error: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
      lockoutTime: '15 minutes'
    });
  },
  // Use default key generator for IPv6 compatibility
  // keyGenerator: (req) => {
  //   return req.ip + ':' + req.originalUrl;
  // }
});

// More restrictive rate limiting for password-related operations
const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 password change/reset attempts per hour
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many password-related attempts from this IP, please try again after 1 hour.',
    error: 'PASSWORD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`Password rate limit exceeded for IP: ${req.ip} on route: ${req.originalUrl}`);
    res.status(429).json({
      success: false,
      message: 'Too many password-related attempts from this IP, please try again after 1 hour.',
      error: 'PASSWORD_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
      lockoutTime: '1 hour'
    });
  }
});

// Conservative rate limiting for user creation (admin operations)
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 admin operations per minute
  message: {
    success: false,
    message: 'Too many administrative operations, please slow down.',
    error: 'ADMIN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`Admin rate limit exceeded for IP: ${req.ip} on route: ${req.originalUrl}`);
    res.status(429).json({
      success: false,
      message: 'Too many administrative operations, please slow down.',
      error: 'ADMIN_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  passwordLimiter,
  adminLimiter
};