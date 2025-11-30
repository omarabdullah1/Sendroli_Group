const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateDeviceFingerprint, getClientIP } = require('../utils/deviceFingerprint');

// Strict single login authentication middleware with IP and device validation
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
      
      // Find user and include session info for validation
      const user = await User.findById(decoded.id).select('+activeToken +sessionInfo');
      
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
          message: 'Your session has been terminated. Another device may have logged in.',
          code: 'SESSION_TERMINATED'
        });
      }

      // Validate session information for extra security
      if (!user.sessionInfo || !user.sessionInfo.isValid) {
        return res.status(401).json({
          success: false,
          message: 'Session is no longer valid. Please login again.',
          code: 'INVALID_SESSION'
        });
      }

      // Extract current request information
      const currentIP = getClientIP(req);
      const currentUserAgent = req.headers['user-agent'] || 'Unknown Device';
      const currentFingerprint = generateDeviceFingerprint(currentIP, currentUserAgent);

      // Strict validation: IP and device fingerprint must match
      const sessionIP = user.sessionInfo.ipAddress;
      const sessionFingerprint = user.sessionInfo.deviceFingerprint;

      if (sessionIP !== currentIP || sessionFingerprint !== currentFingerprint) {
        // Invalidate the session immediately
        await User.findByIdAndUpdate(user._id, {
          activeToken: null,
          'sessionInfo.isValid': false
        });

        return res.status(401).json({
          success: false,
          message: 'Device or location mismatch detected. Session terminated for security.',
          code: 'DEVICE_MISMATCH',
          details: {
            expectedIP: sessionIP,
            currentIP: currentIP,
            sessionValid: false
          }
        });
      }

      // Update last activity
      await User.findByIdAndUpdate(user._id, {
        'sessionInfo.lastActivity': new Date()
      });

      // Attach user to request (excluding sensitive fields)
      req.user = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        isActive: user.isActive,
        sessionInfo: {
          ipAddress: currentIP,
          lastActivity: new Date(),
          loginTime: user.sessionInfo.loginTime,
          sessionVersion: user.sessionInfo.sessionVersion,
        }
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