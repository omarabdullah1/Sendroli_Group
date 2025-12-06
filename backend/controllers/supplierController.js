const Supplier = require('../models/Supplier');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// Get all suppliers
exports.getAllSuppliers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let query = { isActive: true };
    
    // Search functionality
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { contactPerson: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    const total = await Supplier.countDocuments(query);
    const suppliers = await Supplier.find(query)
      .populate('createdBy', 'fullName')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      data: {
        suppliers,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single supplier
exports.getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id)
      .populate('createdBy', 'fullName')
      .populate('updatedBy', 'fullName');
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

// Create new supplier
exports.createSupplier = async (req, res, next) => {
  try {
    const supplierData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const supplier = await Supplier.create(supplierData);
    
    // Notify admins about new supplier
    try {
      const admins = await User.find({ role: 'admin', isActive: true });
      for (const admin of admins) {
        await createNotification(admin._id, {
          title: 'New Supplier Added',
          message: `${req.user.username} added new supplier: ${supplier.name}${supplier.contactPerson ? ' (Contact: ' + supplier.contactPerson + ')' : ''}`,
          icon: 'fa-truck',
          type: 'system',
          relatedId: supplier._id,
          relatedType: 'client',
          actionUrl: `/suppliers/${supplier._id}`
        });
      }
    } catch (notifError) {
      console.error('Error creating supplier notification:', notifError);
    }
    
    res.status(201).json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update supplier
exports.updateSupplier = async (req, res, next) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };
    
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    // Notify admins about supplier update
    try {
      const admins = await User.find({ role: 'admin', isActive: true });
      for (const admin of admins) {
        await createNotification(admin._id, {
          title: 'Supplier Updated',
          message: `${req.user.username} updated supplier: ${supplier.name}${supplier.contactPerson ? ' (Contact: ' + supplier.contactPerson + ')' : ''}`,
          icon: 'fa-truck',
          type: 'system',
          relatedId: supplier._id,
          relatedType: 'client',
          actionUrl: `/suppliers/${supplier._id}`
        });
      }
    } catch (notifError) {
      console.error('Error creating supplier update notification:', notifError);
    }
    
    res.status(200).json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete supplier
exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: req.user.id },
      { new: true }
    );
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    // Notify admins about supplier deletion
    try {
      const admins = await User.find({ role: 'admin', isActive: true });
      for (const admin of admins) {
        await createNotification(admin._id, {
          title: 'Supplier Deleted',
          message: `${req.user.username} deleted supplier: ${supplier.name}${supplier.contactPerson ? ' (Contact: ' + supplier.contactPerson + ')' : ''}`,
          icon: 'fa-trash',
          type: 'system',
          relatedId: supplier._id,
          relatedType: 'client',
          actionUrl: '/suppliers'
        });
      }
    } catch (notifError) {
      console.error('Error creating supplier deletion notification:', notifError);
    }
    
    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};