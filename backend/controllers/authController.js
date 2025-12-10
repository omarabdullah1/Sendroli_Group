const User = require('../models/User');
const Client = require('../models/Client');
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

// @desc    Register a new client (Public)
// @route   POST /api/auth/register-client
// @access  Public
exports.registerClient = async (req, res) => {
  try {
    const { username, password, fullName, email, phone, factoryName, address } = req.body;

    // Validate required fields
    if (!fullName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Full name and phone number are required',
      });
    }

    // Check if phone already exists
    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered',
      });
    }

    // Check if username already exists (if provided)
    if (username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists',
        });
      }
    }

    // Check if email already exists (if provided)
    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists',
        });
      }
    }

    // Generate username from phone if not provided
    const finalUsername = username || `client_${phone.replace(/\D/g, '')}`;

    // Create user with role 'client' - password is optional for clients
    const userData = {
      username: finalUsername,
      role: 'client',
      fullName,
      email,
      phone,
      normalizedPhone: phone ? String(phone).replace(/\D/g, '') : undefined,
    };

    // Only add password if provided
    if (password) {
      userData.password = password;
    }

    const user = await User.create(userData);

    if (user) {
      // Gather device and session information
      const clientIP = getClientIP(req);
      const userAgent = req.headers['user-agent'] || 'Unknown Device';
      const deviceFingerprint = generateDeviceFingerprint(clientIP, userAgent);
      const deviceType = getDeviceType(userAgent);
      const loginTime = new Date();

      // Generate token
      const token = generateToken(user._id);

      // Update user with session info
      await User.findByIdAndUpdate(user._id, {
        activeToken: token,
        sessionInfo: {
          ipAddress: clientIP,
          userAgent: userAgent,
          deviceFingerprint: deviceFingerprint,
          loginTime: loginTime,
          lastActivity: loginTime,
          isValid: true,
          sessionVersion: 1,
        },
        deviceInfo: {
          userAgent: userAgent,
          deviceName: deviceType,
          loginTime: loginTime,
          ipAddress: clientIP,
        },
      });

      // Create associated Client document
      const client = await Client.create({
        name: fullName,
        phone,
        factoryName,
        address,
        user: user._id,
        createdBy: user._id 
      });

      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          role: user.role,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          clientId: client._id,
          token: token,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data',
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Login user with session conflict detection and forced login support
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password, force } = req.body;

    // Validate input - username (can be phone/email/username)
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, or phone number',
      });
    }

    // Detect login type and build query
    let query = {};
    let loginType = 'username';
    
    // Check if it's a phone number (contains only digits, +, -, spaces, parentheses)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (phoneRegex.test(username.trim())) {
      const trimmed = username.trim();
      const normalized = trimmed.replace(/\D/g, '');
      query = {
        $or: [
          { phone: trimmed },
          { normalizedPhone: normalized }
        ],
      };
      loginType = 'phone';
    }
    // Check if it's an email
    else if (username.includes('@')) {
      query.email = username.toLowerCase().trim();
      loginType = 'email';
    }
    // Otherwise it's a username
    else {
      query.username = username.toLowerCase().trim();
      loginType = 'username';
    }

    // Find user and include session fields
    const user = await User.findOne(query).select('+password +activeToken +sessionInfo +deviceInfo');

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

    // For client role with phone-only login, skip password verification
    // Optionally allow passwordless phone login for all roles via env var PASSWORDLESS_PHONE_LOGIN
    const allowGlobalPasswordlessPhone = (process.env.PASSWORDLESS_PHONE_LOGIN || 'false').toLowerCase() === 'true';
    if (loginType === 'phone' && !password && (user.role === 'client' || allowGlobalPasswordlessPhone)) {
      // Phone-only login allowed for client users or globally when enabled
    } else {
      // For all other cases, password is required
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required',
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
    }

    // Check if user has an existing active session
    const hasActiveSession = user.activeToken && user.sessionInfo && user.sessionInfo.isValid;

    // If active session exists and force flag is not set, return conflict
    if (hasActiveSession && !force) {
      return res.status(409).json({
        success: false,
        message: 'Active session detected',
        code: 'ACTIVE_SESSION',
        sessionInfo: {
          deviceName: user.deviceInfo?.deviceName || 'Unknown Device',
          deviceType: getDeviceType(user.sessionInfo.userAgent),
          loginTime: user.sessionInfo.loginTime,
          lastActivity: user.sessionInfo.lastActivity,
          ipAddress: user.sessionInfo.ipAddress,
          // Don't expose full userAgent for security
        },
      });
    }

    // Gather device and session information for new session
    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const deviceFingerprint = generateDeviceFingerprint(clientIP, userAgent);
    const deviceType = getDeviceType(userAgent);
    const loginTime = new Date();

    // Generate new JWT token
    const token = generateToken(user._id);

    // Atomically update user with new session (invalidates old session if force=true)
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
      success: true,
      token: token,
      user: userResponse,
      sessionInfo: {
        loginTime: loginTime,
        deviceName: deviceType,
        ipAddress: clientIP,
      },
    };

    // Add message if previous session was forcefully terminated
    if (hasActiveSession && force) {
      response.message = 'Previous session terminated. New session created.';
      response.previousSession = {
        deviceName: user.deviceInfo?.deviceName || 'Unknown Device',
        loginTime: user.sessionInfo.loginTime,
        lastActivity: user.sessionInfo.lastActivity,
      };
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

// @desc    Check whether a phone number belongs to a client user
// @route   POST /api/auth/check-phone
// @access  Public
exports.checkPhone = async (req, res) => {
  try {
    const { phone } = req.body;

    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phone || !phoneRegex.test(String(phone).trim())) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    const sq = String(phone).trim();
    const normalized = sq.replace(/\D/g, '');
    const user = await User.findOne({ $or: [{ phone: sq }, { normalizedPhone: normalized }] }).select('role');
    if (!user) {
      return res.json({ success: true, exists: false });
    }

    return res.json({ success: true, exists: true, role: user.role, isClient: user.role === 'client' });
  } catch (error) {
    console.error('Error in checkPhone:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
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
