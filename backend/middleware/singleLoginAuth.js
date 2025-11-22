const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Single login authentication middleware
const singleLoginAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user and check if account is active
      const user = await User.findById(decoded.id).select('+activeToken');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is invalid. User not found.',
          code: 'USER_NOT_FOUND'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated.',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      // Check if the current token matches the stored active token
      if (!user.activeToken || user.activeToken !== token) {
        return res.status(401).json({
          success: false,
          message: 'Another device is already logged in. Please logout from the other device first.',
          code: 'DEVICE_CONFLICT'
        });
      }

      // Attach user to request (excluding sensitive fields)
      req.user = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        isActive: user.isActive,
        deviceInfo: user.deviceInfo
      };

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token format.',
          code: 'INVALID_TOKEN'
        });
      } else {
        throw jwtError;
      }
    }
  } catch (error) {
    console.error('Single login auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
      code: 'SERVER_ERROR'
    });
  }
};

// Middleware for optional authentication (doesn't require login)
const optionalSingleLoginAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('+activeToken');
      
      if (user && user.isActive && user.activeToken === token) {
        req.user = {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          isActive: user.isActive,
          deviceInfo: user.deviceInfo
        };
      } else {
        req.user = null;
      }
    } catch (jwtError) {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  singleLoginAuth,
  optionalSingleLoginAuth
};