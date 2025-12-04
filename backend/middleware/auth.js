const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token and validate active session
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      code: 'NO_TOKEN',
    });
  }

  try {
    // Verify token signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token (include activeToken and sessionInfo for validation)
    req.user = await User.findById(decoded.id).select('+activeToken +sessionInfo');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    // Check if user account is active
    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    // CRITICAL: Verify the incoming JWT matches the stored activeToken
    // This prevents old/stolen tokens from being used after new login
    if (req.user.activeToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Session has been invalidated. Please login again.',
        code: 'TOKEN_INVALIDATED',
      });
    }

    // CRITICAL: Verify session is still marked as valid
    // This allows server-side session revocation
    if (!req.user.sessionInfo || req.user.sessionInfo.isValid !== true) {
      return res.status(401).json({
        success: false,
        message: 'Session is no longer valid. Please login again.',
        code: 'SESSION_INVALID',
      });
    }

    // Optional: Check session expiration based on last activity (e.g., 7 days)
    const SESSION_TIMEOUT_HOURS = 24 * 7; // 7 days
    if (req.user.sessionInfo.lastActivity) {
      const hoursSinceActivity = (Date.now() - new Date(req.user.sessionInfo.lastActivity).getTime()) / (1000 * 60 * 60);
      if (hoursSinceActivity > SESSION_TIMEOUT_HOURS) {
        // Invalidate session
        await User.findByIdAndUpdate(req.user._id, {
          'sessionInfo.isValid': false,
        });
        return res.status(401).json({
          success: false,
          message: 'Session expired due to inactivity. Please login again.',
          code: 'SESSION_EXPIRED',
        });
      }
    }

    // Update last activity timestamp (debounce to reduce DB writes)
    const lastActivity = req.user.sessionInfo.lastActivity;
    const minutesSinceLastUpdate = lastActivity ? (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60) : 999;
    
    // Only update if more than 5 minutes since last update
    if (minutesSinceLastUpdate > 5) {
      await User.findByIdAndUpdate(req.user._id, {
        'sessionInfo.lastActivity': new Date()
      });
    }

    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
        code: 'TOKEN_EXPIRED',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
        code: 'INVALID_TOKEN',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      code: 'AUTH_ERROR',
    });
  }
};

// Authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};
