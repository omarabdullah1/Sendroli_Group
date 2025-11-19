const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { authLimiter, adminLimiter } = require('../middleware/rateLimiter');

// Apply strict rate limiting to login attempts
router.post('/login', authLimiter, login);

// Apply admin rate limiting to user registration
router.post('/register', protect, authorize('admin'), adminLimiter, register);

// Me endpoint doesn't need additional rate limiting beyond general API limiter
router.get('/me', protect, getMe);

module.exports = router;
