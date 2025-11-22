const Inventory = require('../models/Inventory');
const Material = require('../models/Material');

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
    
    res.status(200).json({
      success: true,
      data: inventoryRecords
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
        
        // Create inventory record
        const inventoryRecord = await Inventory.create({
          material: count.materialId,
          previousStock,
          actualStock: count.actualStock,
          type: 'daily_count',
          notes: count.notes,
          countedBy: req.user.id
        });
        
        // Update material stock if there's a difference
        if (previousStock !== count.actualStock) {
          material.currentStock = count.actualStock;
          material.updatedBy = req.user.id;
          await material.save();
        }
        
        inventoryRecords.push(inventoryRecord);
      }
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