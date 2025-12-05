const Inventory = require('../models/Inventory');
const Material = require('../models/Material');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// Get daily inventory count
exports.getDailyInventory = async (req, res, next) => {
  try {
    const date = req.params.date ? new Date(req.params.date) : new Date();
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    const inventoryRecords = await Inventory.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      type: 'daily_count'
    }).populate('material', 'name unit category currentStock')
     .populate('countedBy', 'fullName')
     .sort({ createdAt: -1 });
    
    // Add calculated wastage to each record
    const recordsWithWastage = inventoryRecords.map(record => ({
      ...record.toObject(),
      wastage: record.systemStock - record.actualStock
    }));
    
    res.status(200).json({
      success: true,
      data: recordsWithWastage
    });
  } catch (error) {
    next(error);
  }
};

// Submit daily inventory count
exports.submitDailyCount = async (req, res, next) => {
  try {
    const { counts } = req.body; // Array of { materialId, actualStock, notes }
    
    const inventoryRecords = [];
    
    for (const count of counts) {
      const material = await Material.findById(count.materialId);
      if (material) {
        const previousStock = material.currentStock;
        const systemStock = material.currentStock; // Current system-tracked stock
        const actualStock = parseFloat(count.actualStock);
        
        // Calculate wastage: system stock - actual stock
        const wastage = systemStock - actualStock;
        
        // Create inventory record with system stock and wastage
        const inventoryRecord = await Inventory.create({
          material: count.materialId,
          previousStock,
          systemStock,
          actualStock,
          type: 'daily_count',
          notes: count.notes,
          countedBy: req.user.id
        });
        
        // Update material stock to actual counted stock
        if (systemStock !== actualStock) {
          material.currentStock = actualStock;
          material.updatedBy = req.user.id;
          await material.save();
          
          console.log('Stock adjusted after count:', {
            material: material.name,
            systemStock,
            actualStock,
            wastage,
            difference: actualStock - systemStock
          });
          
          // Send notification to admin if wastage detected (actual stock < system stock)
          if (wastage > 0) {
            try {
              console.log('⚠️ ===== WASTAGE NOTIFICATION START =====');
              console.log('⚠️ Material:', material.name);
              console.log('⚠️ Wastage amount:', wastage.toFixed(2), material.unit);
              console.log('⚠️ System stock:', systemStock);
              console.log('⚠️ Actual count:', actualStock);
              
              // Get all admin users
              const adminUsers = await User.find({ 
                role: 'admin', 
                isActive: true 
              }).select('_id username role email isActive');
              
              console.log(`📧 Total admin users for wastage alert: ${adminUsers.length}`);
              
              // Send notification to each admin
              let wastageNotifCount = 0;
              for (const admin of adminUsers) {
                console.log(`\n📤 Sending wastage alert to: ${admin.username}`);
                try {
                  await createNotification(admin._id, {
                    title: 'Inventory Wastage Detected',
                    message: `Wastage detected for "${material.name}" by ${req.user.username}: ${wastage.toFixed(2)} ${material.unit} missing - System: ${systemStock} ${material.unit}, Actual: ${actualStock} ${material.unit}`,
                    icon: 'fa-exclamation-triangle',
                    type: 'inventory',
                    relatedId: material._id,
                    relatedType: 'material',
                    actionUrl: `/inventory`
                  });
                  wastageNotifCount++;
                  console.log(`✅ Wastage notification sent to ${admin.username}`);
                } catch (adminNotifError) {
                  console.error(`❌ Failed to send wastage notification to ${admin.username}:`, adminNotifError.message);
                }
              }
              console.log(`\n✅ ===== WASTAGE NOTIFICATION COMPLETE: ${wastageNotifCount}/${adminUsers.length} =====\n`);
            } catch (notifError) {
              console.error('❌ Error sending wastage notification:', notifError);
              // Don't fail the request if notification fails
            }
          }
        }
        
        inventoryRecords.push({
          ...inventoryRecord.toObject(),
          wastage,
          material: {
            _id: material._id,
            name: material.name,
            unit: material.unit
          }
        });
      }
    }
    
    // Notify admins about inventory count completion
    try {
      console.log('🔍 ===== INVENTORY COUNT NOTIFICATION START =====');
      console.log('🔍 Total materials counted:', inventoryRecords.length);
      console.log('🔍 Current user:', {
        id: req.user._id.toString(),
        username: req.user.username,
        role: req.user.role
      });
      
      // Calculate summary statistics
      const totalWastage = inventoryRecords.reduce((sum, record) => sum + record.wastage, 0);
      const materialsWithWastage = inventoryRecords.filter(record => record.wastage > 0).length;
      
      console.log('🔍 Summary:', {
        totalMaterials: inventoryRecords.length,
        materialsWithWastage,
        totalWastage: totalWastage.toFixed(2)
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
            title: 'Daily Inventory Count Completed',
            message: `Daily inventory count completed by ${req.user.username} - ${inventoryRecords.length} materials counted${materialsWithWastage > 0 ? `, ${materialsWithWastage} with wastage detected` : ', no wastage detected'}`,
            icon: 'fa-clipboard-check',
            type: 'inventory',
            relatedId: null,
            relatedType: 'inventory',
            actionUrl: '/inventory',
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
    
    res.status(201).json({
      success: true,
      data: inventoryRecords,
      message: 'Daily inventory count submitted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get inventory history for a material
exports.getInventoryHistory = async (req, res, next) => {
  try {
    const { materialId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    let query = { material: materialId };
    
    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Type filter
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    const total = await Inventory.countDocuments(query);
    const inventoryHistory = await Inventory.find(query)
      .populate('material', 'name unit')
      .populate('countedBy', 'fullName')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      data: {
        inventoryHistory,
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

// Get wastage report
exports.getWastageReport = async (req, res, next) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    
    const wastageData = await Inventory.aggregate([
      {
        $match: {
          type: 'wastage',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'materials',
          localField: 'material',
          foreignField: '_id',
          as: 'materialInfo'
        }
      },
      {
        $unwind: '$materialInfo'
      },
      {
        $group: {
          _id: '$material',
          materialName: { $first: '$materialInfo.name' },
          materialUnit: { $first: '$materialInfo.unit' },
          totalWastage: { $sum: { $abs: '$difference' } },
          wasteEvents: { $sum: 1 },
          averageWaste: { $avg: { $abs: '$difference' } },
          totalCost: { $sum: { $multiply: [{ $abs: '$difference' }, '$materialInfo.costPerUnit'] } }
        }
      },
      {
        $sort: { totalWastage: -1 }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        wastageData,
        summary: {
          totalWasteEvents: wastageData.reduce((sum, item) => sum + item.wasteEvents, 0),
          totalWasteCost: wastageData.reduce((sum, item) => sum + item.totalCost, 0),
          dateRange: { startDate, endDate }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Record wastage
exports.recordWastage = async (req, res, next) => {
  try {
    const { materialId, wasteAmount, reason, notes } = req.body;
    
    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }
    
    const previousStock = material.currentStock;
    const newStock = Math.max(0, previousStock - wasteAmount);
    
    // Create wastage record
    const wastageRecord = await Inventory.create({
      material: materialId,
      previousStock,
      actualStock: newStock,
      type: 'wastage',
      reason,
      notes,
      countedBy: req.user.id
    });
    
    // Update material stock
    material.currentStock = newStock;
    material.updatedBy = req.user.id;
    await material.save();
    
    res.status(201).json({
      success: true,
      data: wastageRecord,
      message: 'Wastage recorded successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Withdraw material (one piece at a time)
exports.withdrawMaterial = async (req, res, next) => {
  try {
    const { materialId, notes } = req.body;
    
    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }
    
    // Check if material has stock
    if (material.currentStock <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Material is out of stock'
      });
    }
    
    const previousStock = material.currentStock;
    const newStock = Math.max(0, previousStock - 1); // Withdraw one piece
    
    // Create withdrawal record
    const withdrawalRecord = await Inventory.create({
      material: materialId,
      previousStock,
      systemStock: previousStock,
      actualStock: newStock,
      type: 'usage',
      reason: 'Material withdrawal',
      notes: notes || `Withdrawn by ${req.user.fullName}`,
      countedBy: req.user.id
    });
    
    // Update material stock
    material.currentStock = newStock;
    material.updatedBy = req.user.id;
    await material.save();
    
    // Notify admins about material withdrawal
    try {
      const admins = await User.find({
        role: 'admin',
        isActive: true,
      });

      for (const admin of admins) {
        await createNotification(admin._id, {
          title: 'Material Withdrawn',
          message: `${material.name} withdrawn - Stock reduced from ${previousStock} to ${newStock} ${material.unit}`,
          icon: 'fa-arrow-right-from-bracket',
          type: 'inventory',
          relatedId: material._id,
          relatedType: 'material',
          actionUrl: `/inventory/materials/${material._id}`,
        });
      }
    } catch (notifError) {
      console.error('Error creating withdrawal notifications:', notifError);
    }
    
    res.status(201).json({
      success: true,
      data: {
        ...withdrawalRecord.toObject(),
        material: {
          _id: material._id,
          name: material.name,
          unit: material.unit,
          currentStock: newStock
        }
      },
      message: 'Material withdrawn successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get withdrawal history
exports.getWithdrawals = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    let query = { type: 'usage', reason: 'Material withdrawal' };
    
    // If not admin, only show their own withdrawals
    if (req.user.role !== 'admin') {
      query.countedBy = req.user.id;
    }
    
    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    const total = await Inventory.countDocuments(query);
    const withdrawals = await Inventory.find(query)
      .populate('material', 'name unit category')
      .populate('countedBy', 'fullName')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      data: {
        withdrawals,
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