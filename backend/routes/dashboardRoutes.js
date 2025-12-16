const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getSummary } = require('../controllers/dashboardController');

// Dashboard summary route - allow most roles to view
router.get('/summary', protect, authorize('admin', 'financial', 'receptionist', 'designer', 'worker'), getSummary);

module.exports = router;
