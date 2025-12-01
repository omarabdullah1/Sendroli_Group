const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, validateSession } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { singleLoginAuth } = require('../middleware/singleLoginAuth');
const { authLimiter, adminLimiter } = require('../middleware/rateLimiter');

// Apply strict rate limiting to login attempts
router.post('/login', authLimiter, login);

// Logout with single login middleware
router.post('/logout', singleLoginAuth, logout);

// Apply admin rate limiting to user registration
router.post('/register', protect, authorize('admin'), adminLimiter, register);

// Me endpoint with single login protection
router.get('/me', singleLoginAuth, getMe);

// Session validation endpoint
router.get('/validate-session', singleLoginAuth, validateSession);

// Debug endpoint to check user permissions
router.get('/debug/permissions', protect, (req, res) => {
  try {
    const userRole = req.user.role;
    const permissions = {
      currentUser: {
        id: req.user._id,
        username: req.user.username,
        role: userRole,
        fullName: req.user.fullName,
        isActive: req.user.isActive
      },
      endpointAccess: {
        materialWithdrawal: ['admin', 'worker'].includes(userRole),
        financialStats: ['financial', 'admin'].includes(userRole),
        ordersGeneral: ['designer', 'worker', 'financial', 'admin'].includes(userRole),
        userManagement: userRole === 'admin',
        clientManagement: ['receptionist', 'admin'].includes(userRole)
      },
      requiredRoles: {
        materialWithdrawal: ['admin', 'worker'],
        financialStats: ['financial', 'admin'],
        ordersGeneral: ['designer', 'worker', 'financial', 'admin'],
        userManagement: ['admin'],
        clientManagement: ['receptionist', 'admin']
      }
    };

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking permissions',
      error: error.message
    });
  }
});

module.exports = router;
