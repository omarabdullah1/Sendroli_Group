// Authorization middleware for resource ownership and role-based access control

const Client = require('../models/Client');
const Order = require('../models/Order');
const User = require('../models/User');

// Generic resource ownership checker
const checkResourceOwnership = (Model, resourceField = 'createdBy') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }
      
      const userRole = req.user.role;
      const userId = req.user._id.toString();
      const resourceOwnerId = resource[resourceField] ? resource[resourceField].toString() : null;
      
      // Store resource info for use in controllers
      req.resource = resource;
      req.isOwner = resourceOwnerId === userId;
      req.isAdmin = userRole === 'admin';
      
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};

// Client-specific authorization
const authorizeClientAccess = (action = 'read') => {
  return async (req, res, next) => {
    const userRole = req.user.role;
    const { isOwner, isAdmin } = req;
    
    const rolePermissions = {
      read: ['receptionist', 'admin'],
      write: ['receptionist', 'admin'],
      delete: ['receptionist', 'admin']
    };
    
    const allowedRoles = rolePermissions[action] || [];
    const hasRoleAccess = allowedRoles.includes(userRole);
    
    // Check if user has role-based access or ownership
    if (!hasRoleAccess && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to perform this action on clients'
      });
    }
    
    // For non-admin users, check ownership for write operations
    if (action !== 'read' && !isAdmin && userRole === 'receptionist' && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You can only modify clients you created'
      });
    }
    
    next();
  };
};

// Order-specific authorization
const authorizeOrderAccess = (action = 'read') => {
  return async (req, res, next) => {
    const userRole = req.user.role;
    const { isOwner, isAdmin } = req;
    
    const rolePermissions = {
      read: ['designer', 'worker', 'financial', 'admin'],
      write: ['designer', 'worker', 'financial', 'admin'],
      create: ['admin'],
      delete: ['admin']
    };
    
    const allowedRoles = rolePermissions[action] || [];
    const hasRoleAccess = allowedRoles.includes(userRole);
    
    if (!hasRoleAccess && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to perform this action on orders'
      });
    }
    
    // For delete operations, additional checks
    if (action === 'delete' && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete orders'
      });
    }
    
    next();
  };
};

// User management authorization (Admin only)
const authorizeUserAccess = (action = 'read') => {
  return (req, res, next) => {
    const userRole = req.user.role;
    
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can manage users'
      });
    }
    
    // Additional check: prevent self-deletion
    if (action === 'delete' && req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }
    
    next();
  };
};

// Audit logging middleware
const auditLog = (action) => {
  return (req, res, next) => {
    // Log the action for security audit
    const logData = {
      timestamp: new Date().toISOString(),
      userId: req.user._id,
      username: req.user.username,
      role: req.user.role,
      action: action,
      resource: req.params.id || 'N/A',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    };
    
    // In production, this should go to a proper logging service
    console.log('AUDIT LOG:', JSON.stringify(logData));
    
    next();
  };
};

module.exports = {
  checkResourceOwnership,
  authorizeClientAccess,
  authorizeOrderAccess,
  authorizeUserAccess,
  auditLog
};