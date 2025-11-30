const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
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
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token (include activeToken for validation)
    req.user = await User.findById(decoded.id).select('+activeToken +sessionInfo');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive',
      });
    }

    // Check if the token matches the active token (security measure)
    if (req.user.activeToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Session has been invalidated. Please login again.',
      });
    }

    // Check if session is still valid
    if (!req.user.sessionInfo || !req.user.sessionInfo.isValid) {
      return res.status(401).json({
        success: false,
        message: 'Session is no longer valid. Please login again.',
      });
    }

    // Update last activity
    await User.findByIdAndUpdate(req.user._id, {
      'sessionInfo.lastActivity': new Date()
    });

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
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
