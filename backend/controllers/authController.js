const User = require('../models/User');
const generateToken = require('../utils/generateToken');

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

// @desc    Login user with single device restriction
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    console.log('=== SINGLE LOGIN REQUEST RECEIVED ===');
    console.log('Request body:', req.body);
    
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password',
      });
    }

    // Check for user (include password and activeToken)
    const user = await User.findOne({ username }).select('+password +activeToken');

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

    // Generate new token (this will invalidate any previous sessions)
    const token = generateToken(user._id);

    // Extract device information from request
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown IP';
    
    // Determine device name from user agent
    let deviceName = 'Unknown Device';
    if (userAgent.includes('Mobile')) {
      deviceName = 'Mobile Device';
    } else if (userAgent.includes('Chrome')) {
      deviceName = 'Chrome Browser';
    } else if (userAgent.includes('Firefox')) {
      deviceName = 'Firefox Browser';
    } else if (userAgent.includes('Safari')) {
      deviceName = 'Safari Browser';
    } else if (userAgent.includes('Edge')) {
      deviceName = 'Edge Browser';
    }

    // Update user with new active token and device info
    // This will automatically invalidate any previous sessions
    await User.findByIdAndUpdate(user._id, {
      activeToken: token,
      deviceInfo: {
        userAgent: userAgent,
        deviceName: deviceName,
        loginTime: new Date(),
        ipAddress: ipAddress,
      }
    });

    console.log('✅ Single login successful for user:', user.username);
    console.log('Device Info:', { deviceName, ipAddress });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        token: token,
        deviceInfo: {
          deviceName: deviceName,
          loginTime: new Date(),
        }
      },
    });
  } catch (error) {
    console.log('💥 Single login error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Logout user and clear active token
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    console.log('=== LOGOUT REQUEST RECEIVED ===');
    console.log('User ID:', req.user.id);

    // Clear the active token from the user document
    await User.findByIdAndUpdate(req.user.id, {
      activeToken: null,
      deviceInfo: {
        userAgent: null,
        deviceName: null,
        loginTime: null,
        ipAddress: null,
      }
    });

    console.log('✅ Logout successful for user:', req.user.username);

    res.status(200).json({
      success: true,
      message: 'Logout successful. You can now login from another device.',
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

// @desc    Get user profile with session info
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        user: user,
        currentSession: {
          deviceInfo: req.user.deviceInfo,
          loginTime: user.deviceInfo?.loginTime,
          sessionActive: true
        }
      },
      message: 'Profile retrieved successfully with single login validation'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
