const rateLimit = require('express-rate-limit');

/**
 * Rate Limit Configuration
 * 
 * Rate limits are configurable via environment variables:
 * - RATE_LIMIT_API_MAX: Maximum API requests per window (default: 1000 per 15 minutes)
 * - RATE_LIMIT_API_WINDOW: API rate limit window in milliseconds (default: 15 minutes)
 * - RATE_LIMIT_SEARCH_MAX: Maximum search requests per window (default: 200 per minute)
 * - RATE_LIMIT_SEARCH_WINDOW: Search rate limit window in milliseconds (default: 1 minute)
 * - RATE_LIMIT_ADMIN_MAX: Maximum admin operations per window (default: 50 per minute)
 * - RATE_LIMIT_ADMIN_WINDOW: Admin rate limit window in milliseconds (default: 1 minute)
 * 
 * Default Limits (generous for normal usage):
 * - General API: 1000 requests per 15 minutes
 * - Search: 200 requests per minute
 * - Admin: 50 operations per minute
 * - Auth: 15 login attempts per 15 minutes (increased for production usability)
 * - Password: 3 attempts per hour (unchanged for security)
 */
const RATE_LIMIT_CONFIG = {
  API_MAX: parseInt(process.env.RATE_LIMIT_API_MAX) || 1000, // Default: 1000 requests per 15 minutes
  API_WINDOW: parseInt(process.env.RATE_LIMIT_API_WINDOW) || 15 * 60 * 1000, // Default: 15 minutes
  SEARCH_MAX: parseInt(process.env.RATE_LIMIT_SEARCH_MAX) || 200, // Default: 200 requests per minute
  SEARCH_WINDOW: parseInt(process.env.RATE_LIMIT_SEARCH_WINDOW) || 60 * 1000, // Default: 1 minute
  ADMIN_MAX: parseInt(process.env.RATE_LIMIT_ADMIN_MAX) || 50, // Default: 50 requests per minute
  ADMIN_WINDOW: parseInt(process.env.RATE_LIMIT_ADMIN_WINDOW) || 60 * 1000, // Default: 1 minute
};

// Log rate limit configuration on module load (in development)
if (process.env.NODE_ENV === 'development') {
  console.log('📊 Rate Limit Configuration:');
  console.log(`   - General API: ${RATE_LIMIT_CONFIG.API_MAX} requests per ${RATE_LIMIT_CONFIG.API_WINDOW / 60000} minutes`);
  console.log(`   - Search: ${RATE_LIMIT_CONFIG.SEARCH_MAX} requests per ${RATE_LIMIT_CONFIG.SEARCH_WINDOW / 1000} seconds`);
  console.log(`   - Admin: ${RATE_LIMIT_CONFIG.ADMIN_MAX} operations per ${RATE_LIMIT_CONFIG.ADMIN_WINDOW / 1000} seconds`);
}

// General API rate limiting - applies to all API routes
// Increased limits to accommodate higher usage
const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.API_WINDOW,
  max: RATE_LIMIT_CONFIG.API_MAX, // Limit each IP to requests per window (configurable, default: 1000)
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  validate: { trustProxy: false }, // Disable trust proxy validation for self-hosted
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip} on route: ${req.originalUrl}`);
    // Calculate seconds until reset
    const resetTime = req.rateLimit.resetTime;
    const retryAfter = typeof resetTime === 'number' && resetTime > 1000000000 
      ? resetTime - Math.floor(Date.now() / 1000)  // If it's a Unix timestamp in seconds
      : Math.ceil((resetTime - Date.now()) / 1000); // If it's a Date or milliseconds
    
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      error: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.max(1, retryAfter)
    });
  }
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || (process.env.NODE_ENV === 'development' ? 50 : 30), // Configurable: default 30 attempts per 15 minutes in production
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
    error: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }, // Disable trust proxy validation for self-hosted
  handler: (req, res) => {
    console.warn(`Auth rate limit exceeded for IP: ${req.ip} on route: ${req.originalUrl}`);
    // Calculate seconds until reset
    const resetTime = req.rateLimit.resetTime;
    const retryAfter = typeof resetTime === 'number' && resetTime > 1000000000 
      ? resetTime - Math.floor(Date.now() / 1000)  // If it's a Unix timestamp in seconds
      : Math.ceil((resetTime - Date.now()) / 1000); // If it's a Date or milliseconds
    
    res.status(429).json({
      success: false,
      message: 'Too many login attempts from this IP, please try again after 15 minutes.',
      error: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.max(1, retryAfter), // Ensure at least 1 second
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
  validate: { trustProxy: false }, // Disable trust proxy validation for self-hosted
  handler: (req, res) => {
    console.warn(`Password rate limit exceeded for IP: ${req.ip} on route: ${req.originalUrl}`);
    // Calculate seconds until reset
    const resetTime = req.rateLimit.resetTime;
    const retryAfter = typeof resetTime === 'number' && resetTime > 1000000000 
      ? resetTime - Math.floor(Date.now() / 1000)  // If it's a Unix timestamp in seconds
      : Math.ceil((resetTime - Date.now()) / 1000); // If it's a Date or milliseconds
    
    res.status(429).json({
      success: false,
      message: 'Too many password-related attempts from this IP, please try again after 1 hour.',
      error: 'PASSWORD_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.max(1, retryAfter),
      lockoutTime: '1 hour'
    });
  }
});

// Conservative rate limiting for user creation (admin operations)
const adminLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.ADMIN_WINDOW,
  max: RATE_LIMIT_CONFIG.ADMIN_MAX, // Admin operations per minute (configurable, default: 50)
  message: {
    success: false,
    message: 'Too many administrative operations, please slow down.',
    error: 'ADMIN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }, // Disable trust proxy validation for self-hosted
  handler: (req, res) => {
    console.warn(`Admin rate limit exceeded for IP: ${req.ip} on route: ${req.originalUrl}`);
    // Calculate seconds until reset
    const resetTime = req.rateLimit.resetTime;
    const retryAfter = typeof resetTime === 'number' && resetTime > 1000000000 
      ? resetTime - Math.floor(Date.now() / 1000)  // If it's a Unix timestamp in seconds
      : Math.ceil((resetTime - Date.now()) / 1000); // If it's a Date or milliseconds
    
    res.status(429).json({
      success: false,
      message: 'Too many administrative operations, please slow down.',
      error: 'ADMIN_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.max(1, retryAfter)
    });
  }
});

// More lenient rate limiting for search endpoints
// Allows more frequent searches since they're debounced on the frontend
const searchLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.SEARCH_WINDOW,
  max: RATE_LIMIT_CONFIG.SEARCH_MAX, // Search requests per minute (configurable, default: 200)
  message: {
    success: false,
    message: 'Too many search requests. Please wait a moment before searching again.',
    error: 'SEARCH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }, // Disable trust proxy validation for self-hosted
  handler: (req, res) => {
    console.warn(`Search rate limit exceeded for IP: ${req.ip} on route: ${req.originalUrl}`);
    // Calculate seconds until reset
    const resetTime = req.rateLimit.resetTime;
    const retryAfter = typeof resetTime === 'number' && resetTime > 1000000000 
      ? resetTime - Math.floor(Date.now() / 1000)  // If it's a Unix timestamp in seconds
      : Math.ceil((resetTime - Date.now()) / 1000); // If it's a Date or milliseconds
    
    res.status(429).json({
      success: false,
      message: 'Too many search requests. Please wait a moment before searching again.',
      error: 'SEARCH_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.max(1, retryAfter)
    });
  },
  // Skip rate limiting if no search query parameter
  skip: (req) => !req.query.search || req.query.search.trim() === ''
});

module.exports = {
  apiLimiter,
  authLimiter,
  passwordLimiter,
  adminLimiter,
  searchLimiter
};