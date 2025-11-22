const Material = require('../models/Material');
const Inventory = require('../models/Inventory');

// Get all materials with filtering and pagination
exports.getAllMaterials = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let query = { isActive: true };
    
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
      .limit(limit);
    
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
    const materialData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const material = await Material.create(materialData);
    
    res.status(201).json({
      success: true,
      data: material,
      message: 'Material created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update material
exports.updateMaterial = async (req, res, next) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };
    
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
    
    res.status(200).json({
      success: true,
      data: material,
      message: 'Material updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete material
exports.deleteMaterial = async (req, res, next) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: req.user.id },
      { new: true }
    );
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
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