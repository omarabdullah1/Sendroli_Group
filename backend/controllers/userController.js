const User = require('../models/User');
const { createNotification } = require('./notificationController');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments();

    res.status(200).json({
      success: true,
      data: users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

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

// @desc    Create new user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
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

    const user = await User.create({
      username,
      password,
      role,
      fullName,
      email,
    });
    
    // Notify all admins about new user creation
    try {
      const admins = await User.find({ role: 'admin', isActive: true });
      
      for (const admin of admins) {
        await createNotification(admin._id, {
          title: 'New User Created',
          message: `${req.user.username} created new user: ${user.fullName} (${user.username}) - Role: ${user.role}`,
          icon: 'fa-user-plus',
          type: 'system',
          actionUrl: `/users/${user._id}`
        });
      }
    } catch (notifError) {
      console.error('Error creating user notification:', notifError);
    }

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent modifying your own role or active status
    if (user._id.toString() === req.user._id.toString()) {
      if (req.body.role && req.body.role !== user.role) {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify your own role',
        });
      }
      
      if (req.body.hasOwnProperty('isActive') && req.body.isActive === false) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate your own account',
        });
      }
    }

    const { username, role, fullName, email, isActive } = req.body;

    // Log the modification for audit trail
    console.log(`User ${req.params.id} (${user.username}) updated by admin ${req.user._id} (${req.user.username})`);
    
    const oldIsActive = user.isActive;
    const oldRole = user.role;

    user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        username, 
        role, 
        fullName, 
        email, 
        isActive,
        updatedBy: req.user._id,
        updatedAt: new Date()
      },
      {
        new: true,
        runValidators: true,
      }
    );
    
    // Notify all admins about user update with specific messages
    try {
      const admins = await User.find({ role: 'admin', isActive: true });
      let notificationTitle = 'User Updated';
      let notificationMessage = `${req.user.username} updated user: ${user.fullName} (${user.username})`;
      let notificationIcon = 'fa-user-edit';
      
      // Check for activation/deactivation
      if (oldIsActive !== isActive) {
        if (isActive === false) {
          notificationTitle = 'User Deactivated';
          notificationMessage = `${req.user.username} deactivated user: ${user.fullName} (${user.username}) - Role: ${user.role}`;
          notificationIcon = 'fa-user-slash';
        } else {
          notificationTitle = 'User Activated';
          notificationMessage = `${req.user.username} activated user: ${user.fullName} (${user.username}) - Role: ${user.role}`;
          notificationIcon = 'fa-user-check';
        }
      } else if (oldRole !== role) {
        notificationMessage += ` - Role changed from ${oldRole} to ${role}`;
      }
      
      for (const admin of admins) {
        await createNotification(admin._id, {
          title: notificationTitle,
          message: notificationMessage,
          icon: notificationIcon,
          type: 'system',
          actionUrl: `/users/${user._id}`
        });
      }
    } catch (notifError) {
      console.error('Error creating user update notification:', notifError);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    // Check if user has created any clients or orders before deletion
    const Client = require('../models/Client');
    const Order = require('../models/Order');
    
    const clientCount = await Client.countDocuments({ createdBy: req.params.id });
    const orderCount = await Order.countDocuments({ createdBy: req.params.id });
    
    if (clientCount > 0 || orderCount > 0) {
      // Instead of preventing deletion, we could deactivate the user
      const deactivatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { 
          isActive: false,
          deactivatedBy: req.user._id,
          deactivatedAt: new Date()
        },
        { new: true }
      );
      
      console.log(`User ${req.params.id} (${user.username}) deactivated by admin ${req.user._id} (${req.user.username}) due to associated records`);
      
      // Notify all admins about user deactivation
      try {
        const admins = await User.find({ role: 'admin', isActive: true });
        
        for (const admin of admins) {
          await createNotification(admin._id, {
            title: 'User Deactivated',
            message: `${req.user.username} deactivated user: ${user.fullName} (${user.username}) - Has ${clientCount} clients and ${orderCount} orders`,
            icon: 'fa-user-slash',
            type: 'system',
            actionUrl: `/users/${user._id}`
          });
        }
      } catch (notifError) {
        console.error('Error creating user deactivation notification:', notifError);
      }
      
      return res.status(200).json({
        success: true,
        message: `User deactivated instead of deleted due to ${clientCount} clients and ${orderCount} orders`,
        data: deactivatedUser
      });
    }

    // Log the deletion for audit trail
    console.log(`User ${req.params.id} (${user.username}) deleted by admin ${req.user._id} (${req.user.username})`);
    
    const deletedUserInfo = {
      fullName: user.fullName,
      username: user.username,
      role: user.role
    };

    await user.deleteOne();
    
    // Notify all admins about user deletion
    try {
      const admins = await User.find({ role: 'admin', isActive: true });
      
      for (const admin of admins) {
        await createNotification(admin._id, {
          title: 'User Deleted',
          message: `${req.user.username} deleted user: ${deletedUserInfo.fullName} (${deletedUserInfo.username}) - Role: ${deletedUserInfo.role}`,
          icon: 'fa-user-times',
          type: 'system',
          actionUrl: '/users'
        });
      }
    } catch (notifError) {
      console.error('Error creating user deletion notification:', notifError);
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
