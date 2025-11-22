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

// @desc    Login user with strict single device restriction
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    console.log('=== STRICT SINGLE LOGIN REQUEST RECEIVED ===');
    console.log('Request body:', req.body);
    
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password',
      });
    }

    // Check for user (include password and session info)
    const user = await User.findOne({ username }).select('+password +activeToken +sessionInfo');

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

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Extract device and network information
    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const deviceFingerprint = generateDeviceFingerprint(clientIP, userAgent);
    const deviceType = getDeviceType(userAgent);

    console.log('🔍 Device Information:', {
      clientIP,
      deviceType,
      deviceFingerprint: deviceFingerprint.substring(0, 8) + '...',
    });

    // Check if user already has an active session
    if (user.activeToken && user.sessionInfo && user.sessionInfo.isValid) {
      const existingFingerprint = user.sessionInfo.deviceFingerprint;
      const existingIP = user.sessionInfo.ipAddress;
      
      console.log('⚠️  Existing active session detected:');
      console.log('Current device:', deviceFingerprint.substring(0, 8) + '...');
      console.log('Existing device:', existingFingerprint?.substring(0, 8) + '...');
      console.log('Current IP:', clientIP);
      console.log('Existing IP:', existingIP);
      
      // If trying to login from a different device/IP, deny access
      if (existingFingerprint !== deviceFingerprint || existingIP !== clientIP) {
        return res.status(403).json({
          success: false,
          message: `Another device is currently logged in from IP ${existingIP}. Please logout from the other device first or wait for the session to expire.`,
          code: 'DEVICE_CONFLICT',
          conflictInfo: {
            existingDevice: user.sessionInfo.userAgent ? getDeviceType(user.sessionInfo.userAgent) : 'Unknown',
            existingIP: existingIP,
            loginTime: user.sessionInfo.loginTime,
          }
        });
      }
    }

    // FORCE LOGOUT from any existing sessions (this is the key change!)
    console.log('🔒 Forcefully invalidating any existing sessions...');

    // Generate new token
    const token = generateToken(user._id);

    // Update user with new session info - THIS INVALIDATES ALL OTHER SESSIONS
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        activeToken: token,
        sessionInfo: {
          ipAddress: clientIP,
          userAgent: userAgent,
          deviceFingerprint: deviceFingerprint,
          loginTime: new Date(),
          lastActivity: new Date(),
          isValid: true,
        },
        deviceInfo: {
          userAgent: userAgent,
          deviceName: deviceType,
          loginTime: new Date(),
          ipAddress: clientIP,
        }
      },
      { new: true }
    );

    console.log('✅ Strict single login successful for user:', user.username);
    console.log('🏠 Device Type:', deviceType);
    console.log('🌍 IP Address:', clientIP);
    console.log('🔑 Device Fingerprint:', deviceFingerprint.substring(0, 8) + '...');

    res.status(200).json({
      success: true,
      message: 'Login successful - any other active sessions have been terminated',
      data: {
        _id: user._id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        token: token,
        sessionInfo: {
          deviceType: deviceType,
          loginTime: new Date(),
          ipAddress: clientIP,
        }
      },
    });
  } catch (error) {
    console.log('💥 Strict single login error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
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

// @desc    Get user profile with strict session validation
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+sessionInfo');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: user,
        currentSession: {
          ipAddress: req.user.sessionInfo?.ipAddress,
          lastActivity: req.user.sessionInfo?.lastActivity,
          loginTime: user.sessionInfo?.loginTime,
          sessionActive: true,
          sessionValid: user.sessionInfo?.isValid || false
        }
      },
      message: 'Profile retrieved successfully with strict session validation'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
