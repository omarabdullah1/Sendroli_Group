const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { generateDeviceFingerprint, getClientIP, getDeviceType } = require('../utils/deviceFingerprint');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Private/Admin
exports.register = async (req, res) => {
  try {
    const { username, password, role, fullName, email } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ username });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Create user
    const user = await User.create({
      username,
      password,
      role,
      fullName,
      email,
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          role: user.role,
          fullName: user.fullName,
          email: user.email,
          token: generateToken(user._id),
        },
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Login user - automatically clears existing sessions and creates new one
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password',
      });
    }

    // Find user and include session fields
    const user = await User.findOne({ username }).select('+password +activeToken +sessionInfo +deviceInfo');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive',
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Gather device and session information for new session
    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const deviceFingerprint = generateDeviceFingerprint(clientIP, userAgent);
    const deviceType = getDeviceType(userAgent);
    const loginTime = new Date();

    // Check if user has an existing active session (regardless of device)
    const hasExistingSession = user.activeToken && user.sessionInfo && user.sessionInfo.isValid;

    // Generate new JWT token (always generate fresh token to prevent reuse)
    const token = generateToken(user._id);

    // Atomically update user with new session (this automatically invalidates old token and session)
    // Using atomic update ensures no race conditions and prevents multiple active sessions
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        // Overwrite activeToken with new token (invalidates old token)
        activeToken: token,
        
        // Completely replace sessionInfo with new session data
        sessionInfo: {
          ipAddress: clientIP,
          userAgent: userAgent,
          deviceFingerprint: deviceFingerprint,
          loginTime: loginTime,
          lastActivity: loginTime,
          isValid: true,
          sessionVersion: (user.sessionInfo?.sessionVersion || 0) + 1, // Increment version to invalidate old sessions
        },
        
        // Overwrite deviceInfo with new device data
        deviceInfo: {
          userAgent: userAgent,
          deviceName: deviceType,
          loginTime: loginTime,
          ipAddress: clientIP,
        },
      },
      { 
        new: true, 
        runValidators: true,
        // Use findOneAndUpdate for atomic operation with better concurrency handling
      }
    );

    // Prepare user data for response (exclude sensitive fields)
    const userResponse = {
      _id: updatedUser._id,
      username: updatedUser.username,
      role: updatedUser.role,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
    };

    // Build response object
    const response = {
      token: token,
      user: userResponse,
    };

    // Add warning message if old session was cleared
    if (hasExistingSession) {
      response.warning = 'We detected an active session on another device and logged it out for your security.';
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

// @desc    Logout user and clear active session completely
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    console.log('=== LOGOUT REQUEST RECEIVED ===');
    console.log('User ID:', req.user.id);

    // Clear the active token and session info completely
    await User.findByIdAndUpdate(req.user.id, {
      activeToken: null,
      sessionInfo: {
        ipAddress: null,
        userAgent: null,
        deviceFingerprint: null,
        loginTime: null,
        lastActivity: null,
        isValid: false,
        sessionVersion: 0, // Reset session version
      },
      deviceInfo: {
        userAgent: null,
        deviceName: null,
        loginTime: null,
        ipAddress: null,
      }
    });

    console.log('✅ Complete logout successful for user:', req.user.username || req.user.id);

    res.status(200).json({
      success: true,
      message: 'Logout successful. Session completely cleared.',
    });
  } catch (error) {
    console.log('💥 Logout error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current logged in user with device info
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Validate current session
// @route   GET /api/auth/validate-session
// @access  Private
exports.validateSession = async (req, res) => {
  try {
    // The middleware already validates the session, so if we reach here, it's valid
    res.status(200).json({
      success: true,
      message: 'Session is valid',
      data: {
        sessionValid: true,
        sessionVersion: req.user.sessionInfo.sessionVersion,
        lastActivity: req.user.sessionInfo.lastActivity,
        loginTime: req.user.sessionInfo.loginTime
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
