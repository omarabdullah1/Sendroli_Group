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

module.exports = router;
