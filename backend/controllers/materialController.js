const Material = require('../models/Material');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const cache = require('../utils/cache');

// Get all materials with filtering and pagination
exports.getAllMaterials = async (req, res, next) => {
  try {
    console.log(`GET /materials requested by user: ${req.user?.username} (role: ${req.user?.role})`);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let query = { isActive: true };
    
    // Filter by order type
    if (req.query.isOrderType !== undefined) {
      query.isOrderType = req.query.isOrderType === 'true';
    }
    
    // Search functionality
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }
    
    // Category filter
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Stock status filter
    if (req.query.stockStatus === 'low_stock') {
      query.$expr = { $lte: ['$currentStock', '$minStockLevel'] };
    } else if (req.query.stockStatus === 'out_of_stock') {
      query.currentStock = { $lte: 0 };
    }
    
    const total = await Material.countDocuments(query);
    const materials = await Material.find(query)
      .populate('supplier', 'name contactPerson phone')
      .populate('createdBy', 'fullName')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit || 1000); // Increase limit for order type materials
    
    res.status(200).json({
      success: true,
      data: {
        materials,
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

// Get single material
exports.getMaterial = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id)
      .populate('supplier', 'name contactPerson phone email')
      .populate('createdBy', 'fullName')
      .populate('updatedBy', 'fullName');
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }
    
    console.log('Fetched single material:', material);
    console.log('Material sellingPrice:', material.sellingPrice);
    
    res.status(200).json({
      success: true,
      data: material
    });
  } catch (error) {
    next(error);
  }
};

// Create new material
exports.createMaterial = async (req, res, next) => {
  try {
    console.log('Creating material with data:', req.body);
    
    // Prepare material data
    const materialData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    // Ensure sellingPrice is properly handled
    if (materialData.sellingPrice !== undefined && materialData.sellingPrice !== null && materialData.sellingPrice !== '') {
      materialData.sellingPrice = parseFloat(materialData.sellingPrice);
      // Check if conversion resulted in NaN
      if (isNaN(materialData.sellingPrice)) {
        materialData.sellingPrice = 0;
      }
    } else {
      materialData.sellingPrice = 0;
    }
    
    // Ensure isOrderType is boolean
    materialData.isOrderType = Boolean(materialData.isOrderType);
    
    console.log('Processed material data:', materialData);
    console.log('Selling price to save:', materialData.sellingPrice, 'Type:', typeof materialData.sellingPrice);
    
    const material = await Material.create(materialData);
    
    console.log('Created material:', material);
    console.log('Saved selling price:', material.sellingPrice);
    
    // Notify admins about new material
    try {
      console.log('🔍 ===== MATERIAL CREATE NOTIFICATION START =====');
      console.log('🔍 Material ID:', material._id.toString());
      console.log('🔍 Material name:', material.name);
      console.log('🔍 Current user:', {
        id: req.user._id.toString(),
        username: req.user.username,
        role: req.user.role
      });
      
      // Find all admin users (including current user for testing)
      const allUsers = await User.find({
        role: 'admin',
        isActive: true,
      }).select('_id username role email isActive');
      
      console.log(`📧 Total admin users in database: ${allUsers.length}`);
      allUsers.forEach(u => {
        console.log(`  - ${u.username} (${u.role}) - ID: ${u._id.toString()} - Active: ${u.isActive} - ${u._id.toString() === req.user._id.toString() ? '(YOU)' : ''}`);
      });
      
      let notificationCount = 0;
      for (const user of allUsers) {
        console.log(`\n📤 Attempting to create notification for user: ${user.username} (${user._id.toString()})`);
        try {
          const notificationData = {
            title: 'New Material Added',
            message: `Material "${material.name}" added by ${req.user.username} - Price: ${material.sellingPrice} EGP/${material.unit}, Stock: ${material.currentStock} ${material.unit}`,
            icon: 'fa-box',
            type: 'inventory',
            relatedId: material._id,
            relatedType: 'material',
            actionUrl: `/inventory/materials/${material._id}`,
          };
          console.log('📦 Notification data:', JSON.stringify(notificationData, null, 2));
          
          const notification = await createNotification(user._id, notificationData);
          notificationCount++;
          console.log(`✅ SUCCESS - Notification created with ID: ${notification._id.toString()}`);
          console.log(`   For user: ${user.username} (${user._id.toString()})`);
        } catch (userNotifError) {
          console.error(`❌ FAILED for user ${user.username}:`, userNotifError.message);
          console.error(`   Stack:`, userNotifError.stack);
        }
      }
      console.log(`\n✅ ===== NOTIFICATION COMPLETE: ${notificationCount}/${allUsers.length} created =====\n`);
    } catch (notifError) {
      console.error('❌ ===== CRITICAL ERROR IN NOTIFICATION PROCESS =====');
      console.error('❌ Error:', notifError.message);
      console.error('❌ Stack:', notifError.stack);
      console.error('❌ ===== END ERROR =====\n');
    }
    
    // Clear dashboard cache after material creation
    try {
      await cache.delPattern('dashboard_summary_*');
      console.log('ℹ️ Cleared dashboard cache after material creation');
    } catch (err) {
      console.warn('⚠️ Failed to clear dashboard cache after material creation:', err?.message || err);
    }

    res.status(201).json({
      success: true,
      data: material,
      message: 'Material created successfully'
    });
  } catch (error) {
    console.error('Error creating material:', error);
    next(error);
  }
};

// Update material
exports.updateMaterial = async (req, res, next) => {
  try {
    console.log('Updating material with data:', req.body);
    console.log('Selling price in request:', req.body.sellingPrice, 'Type:', typeof req.body.sellingPrice);
    
    // Prepare update data
    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };
    
    // Ensure sellingPrice is properly handled
    if (updateData.sellingPrice !== undefined && updateData.sellingPrice !== null && updateData.sellingPrice !== '') {
      updateData.sellingPrice = parseFloat(updateData.sellingPrice);
      // Check if conversion resulted in NaN
      if (isNaN(updateData.sellingPrice)) {
        updateData.sellingPrice = 0;
      }
    } else if (updateData.sellingPrice === '' || updateData.sellingPrice === null) {
      updateData.sellingPrice = 0;
    }
    
    // Ensure isOrderType is boolean
    if (updateData.isOrderType !== undefined) {
      updateData.isOrderType = Boolean(updateData.isOrderType);
    }
    
    console.log('Processed update data:', updateData);
    console.log('Selling price to update:', updateData.sellingPrice, 'Type:', typeof updateData.sellingPrice);
    
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('supplier', 'name contactPerson');
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }
    
    console.log('Updated material from DB:', material);
    console.log('Selling price in updated material:', material.sellingPrice);
    
    // Notify admins about material update
    try {
      console.log('🔍 ===== MATERIAL UPDATE NOTIFICATION START =====');
      console.log('🔍 Material ID:', material._id.toString());
      console.log('🔍 Material name:', material.name);
      console.log('🔍 Current user:', {
        id: req.user._id.toString(),
        username: req.user.username,
        role: req.user.role
      });
      
      // Find all admin users (including current user for testing)
      const allUsers = await User.find({
        role: 'admin',
        isActive: true,
      }).select('_id username role email isActive');
      
      console.log(`📧 Total admin users in database: ${allUsers.length}`);
      allUsers.forEach(u => {
        console.log(`  - ${u.username} (${u.role}) - ID: ${u._id.toString()} - Active: ${u.isActive} - ${u._id.toString() === req.user._id.toString() ? '(YOU)' : ''}`);
      });
      
      let notificationCount = 0;
      for (const user of allUsers) {
        console.log(`\n📤 Attempting to create notification for user: ${user.username} (${user._id.toString()})`);
        try {
          const notificationData = {
            title: 'Material Updated',
            message: `Material "${material.name}" updated by ${req.user.username} - Price: ${material.sellingPrice} EGP/${material.unit}, Stock: ${material.currentStock} ${material.unit}`,
            icon: 'fa-box-open',
            type: 'inventory',
            relatedId: material._id,
            relatedType: 'material',
            actionUrl: `/inventory/materials/${material._id}`,
          };
          console.log('📦 Notification data:', JSON.stringify(notificationData, null, 2));
          
          const notification = await createNotification(user._id, notificationData);
          notificationCount++;
          console.log(`✅ SUCCESS - Notification created with ID: ${notification._id.toString()}`);
          console.log(`   For user: ${user.username} (${user._id.toString()})`);
        } catch (userNotifError) {
          console.error(`❌ FAILED for user ${user.username}:`, userNotifError.message);
          console.error(`   Stack:`, userNotifError.stack);
        }
      }
      console.log(`\n✅ ===== NOTIFICATION COMPLETE: ${notificationCount}/${allUsers.length} created =====\n`);
    } catch (notifError) {
      console.error('❌ ===== CRITICAL ERROR IN NOTIFICATION PROCESS =====');
      console.error('❌ Error:', notifError.message);
      console.error('❌ Stack:', notifError.stack);
      console.error('❌ ===== END ERROR =====\n');
    }
    
    // Clear dashboard cache after material update
    try {
      await cache.delPattern('dashboard_summary_*');
      console.log('ℹ️ Cleared dashboard cache after material update');
    } catch (err) {
      console.warn('⚠️ Failed to clear dashboard cache after material update:', err?.message || err);
    }

    res.status(200).json({
      success: true,
      data: material,
      message: 'Material updated successfully'
    });
  } catch (error) {
    console.error('Error updating material:', error);
    next(error);
  }
};

// Delete material
exports.deleteMaterial = async (req, res, next) => {
  try {
    // Get material details before deletion
    const materialToDelete = await Material.findById(req.params.id);
    
    if (!materialToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }
    
    const materialName = materialToDelete.name;
    const materialPrice = materialToDelete.sellingPrice;
    const materialUnit = materialToDelete.unit;
    const materialStock = materialToDelete.currentStock;
    
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: req.user.id },
      { new: true }
    );
    
    // Notify admins about material deletion
    try {
      console.log('🔍 ===== MATERIAL DELETE NOTIFICATION START =====');
      console.log('🔍 Material name:', materialName);
      console.log('🔍 Current user:', {
        id: req.user._id.toString(),
        username: req.user.username,
        role: req.user.role
      });
      
      // Find all admin users (including current user for testing)
      const allUsers = await User.find({
        role: 'admin',
        isActive: true,
      }).select('_id username role email isActive');
      
      console.log(`📧 Total admin users in database: ${allUsers.length}`);
      allUsers.forEach(u => {
        console.log(`  - ${u.username} (${u.role}) - ID: ${u._id.toString()} - Active: ${u.isActive} - ${u._id.toString() === req.user._id.toString() ? '(YOU)' : ''}`);
      });
      
      let notificationCount = 0;
      for (const user of allUsers) {
        console.log(`\n📤 Attempting to create notification for user: ${user.username} (${user._id.toString()})`);
        try {
          const notificationData = {
            title: 'Material Deleted',
            message: `Material "${materialName}" (Price: ${materialPrice} EGP/${materialUnit}, Stock: ${materialStock} ${materialUnit}) was deleted by ${req.user.username}`,
            icon: 'fa-box-archive',
            type: 'inventory',
            relatedId: null,
            relatedType: 'material',
            actionUrl: '/inventory/materials',
          };
          console.log('📦 Notification data:', JSON.stringify(notificationData, null, 2));
          
          const notification = await createNotification(user._id, notificationData);
          notificationCount++;
          console.log(`✅ SUCCESS - Notification created with ID: ${notification._id.toString()}`);
          console.log(`   For user: ${user.username} (${user._id.toString()})`);
        } catch (userNotifError) {
          console.error(`❌ FAILED for user ${user.username}:`, userNotifError.message);
          console.error(`   Stack:`, userNotifError.stack);
        }
      }
      console.log(`\n✅ ===== NOTIFICATION COMPLETE: ${notificationCount}/${allUsers.length} created =====\n`);
    } catch (notifError) {
      console.error('❌ ===== CRITICAL ERROR IN NOTIFICATION PROCESS =====');
      console.error('❌ Error:', notifError.message);
      console.error('❌ Stack:', notifError.stack);
      console.error('❌ ===== END ERROR =====\n');
    }
    
    // Clear dashboard cache after material delete
    try {
      await cache.delPattern('dashboard_summary_*');
      console.log('ℹ️ Cleared dashboard cache after material deletion');
    } catch (err) {
      console.warn('⚠️ Failed to clear dashboard cache after material deletion:', err?.message || err);
    }

    res.status(200).json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get low stock materials
exports.getLowStockMaterials = async (req, res, next) => {
  try {
    const lowStockMaterials = await Material.find({
      isActive: true,
      $expr: { $lte: ['$currentStock', '$minStockLevel'] }
    }).populate('supplier', 'name contactPerson');
    
    res.status(200).json({
      success: true,
      data: lowStockMaterials
    });
  } catch (error) {
    next(error);
  }
};

// Update stock
exports.updateStock = async (req, res, next) => {
  try {
    const { materialId, quantity, type, reason, notes } = req.body;
    
    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }
    
    const previousStock = material.currentStock;
    
    // Create inventory record
    await Inventory.create({
      material: materialId,
      previousStock,
      actualStock: quantity,
      type,
      reason,
      notes,
      countedBy: req.user.id
    });
    
    // Update material stock
    material.currentStock = quantity;
    material.updatedBy = req.user.id;
    await material.save();
    
    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: material
    });
  } catch (error) {
    next(error);
  }
};