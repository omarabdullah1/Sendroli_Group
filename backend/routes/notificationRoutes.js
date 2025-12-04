const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get all notifications
router.get('/', getNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark all as read
router.put('/mark-all-read', markAllAsRead);

// Delete all read notifications (MUST be before /:id route)
router.delete('/read', deleteAllRead);

// Mark single notification as read
router.put('/:id/read', markAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

module.exports = router;

