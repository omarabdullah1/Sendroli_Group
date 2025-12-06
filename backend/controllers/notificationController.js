const Notification = require('../models/Notification');

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 50, filter = 'all', category } = req.query;
    const userId = req.user.id;

    let query = { user: userId };
    
    // Filter by read status
    if (filter === 'unread') {
      query.read = false;
    } else if (filter === 'read') {
      query.read = true;
    }

    // Filter by category/type
    if (category) {
      query.type = category;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ user: userId, read: false });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          current: parseInt(page),
        },
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message,
    });
  }
};

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const unreadCount = await Notification.countDocuments({ user: userId, read: false });

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count',
      error: error.message,
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    await notification.markAsRead();

    const unreadCount = await Notification.countDocuments({ user: userId, read: false });

    res.status(200).json({
      success: true,
      data: notification,
      unreadCount,
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message,
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.updateMany(
      { user: userId, read: false },
      { 
        read: true,
        readAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message,
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    const unreadCount = await Notification.countDocuments({ user: userId, read: false });

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
      unreadCount,
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message,
    });
  }
};

// @desc    Delete all read notifications
// @route   DELETE /api/notifications/read
// @access  Private
exports.deleteAllRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.deleteMany({
      user: userId,
      read: true,
    });

    const unreadCount = await Notification.countDocuments({ user: userId, read: false });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} read notifications deleted`,
      deletedCount: result.deletedCount,
      unreadCount,
    });
  } catch (error) {
    console.error('Delete all read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting read notifications',
      error: error.message,
    });
  }
};

// Helper function to create notification (can be used by other controllers)
exports.createNotification = async (userId, notificationData) => {
  try {
    console.log('🔔 createNotification called:', {
      userId: userId.toString(),
      title: notificationData.title,
      type: notificationData.type
    });
    
    const notification = await Notification.create({
      user: userId,
      ...notificationData,
    });
    
    console.log('✅ Notification created successfully:', {
      id: notification._id.toString(),
      userId: notification.user.toString(),
      title: notification.title
    });
    
    return notification;
  } catch (error) {
    console.error('❌ Create notification error:', {
      error: error.message,
      stack: error.stack,
      userId: userId?.toString(),
      notificationData
    });
    throw error;
  }
};

