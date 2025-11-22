const Purchase = require('../models/Purchase');
const Material = require('../models/Material');
const Inventory = require('../models/Inventory');

// Get all purchases
exports.getAllPurchases = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Supplier filter
    if (req.query.supplier) {
      query.supplier = req.query.supplier;
    }
    
    const total = await Purchase.countDocuments(query);
    const purchases = await Purchase.find(query)
      .populate('supplier', 'name contactPerson phone')
      .populate('items.material', 'name unit category')
      .populate('createdBy', 'fullName')
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      data: {
        purchases,
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

// Get single purchase
exports.getPurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplier', 'name contactPerson phone email address')
      .populate('items.material', 'name unit category')
      .populate('createdBy', 'fullName')
      .populate('updatedBy', 'fullName');
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: purchase
    });
  } catch (error) {
    next(error);
  }
};

// Create new purchase
exports.createPurchase = async (req, res, next) => {
  try {
    console.log('Purchase creation request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user.id);
    
    const purchaseData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    console.log('Purchase data to create:', JSON.stringify(purchaseData, null, 2));
    
    const purchase = await Purchase.create(purchaseData);
    
    await purchase.populate([
      { path: 'supplier', select: 'name contactPerson phone' },
      { path: 'items.material', select: 'name unit category' }
    ]);
    
    res.status(201).json({
      success: true,
      data: purchase,
      message: 'Purchase order created successfully'
    });
  } catch (error) {
    console.error('Purchase creation error:', error);
    next(error);
  }
};

// Update purchase
exports.updatePurchase = async (req, res, next) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };
    
    const purchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('supplier', 'name contactPerson')
     .populate('items.material', 'name unit');
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: purchase,
      message: 'Purchase updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete purchase
exports.deletePurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }
    
    // Only allow deletion if status is pending or cancelled
    if (purchase.status !== 'pending' && purchase.status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete purchase order that is ordered or received'
      });
    }
    
    await Purchase.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Purchase order deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Receive purchase (update stock)
exports.receivePurchase = async (req, res, next) => {
  try {
    const { receivedItems, notes } = req.body;
    
    const purchase = await Purchase.findById(req.params.id)
      .populate('items.material');
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }
    
    if (purchase.status === 'received') {
      return res.status(400).json({
        success: false,
        message: 'Purchase has already been received'
      });
    }
    
    // Update material stock for each received item
    for (const receivedItem of receivedItems) {
      const material = await Material.findById(receivedItem.materialId);
      if (material) {
        const previousStock = material.currentStock;
        const newStock = previousStock + receivedItem.quantity;
        
        // Update material stock
        material.currentStock = newStock;
        material.updatedBy = req.user.id;
        await material.save();
        
        // Create inventory record
        await Inventory.create({
          material: receivedItem.materialId,
          previousStock,
          actualStock: newStock,
          type: 'adjustment',
          reason: 'Purchase received',
          notes: `Purchase order: ${purchase.purchaseNumber}`,
          countedBy: req.user.id
        });
      }
    }
    
    // Update purchase status
    purchase.status = 'received';
    purchase.receivedDate = new Date();
    purchase.notes = notes;
    purchase.updatedBy = req.user.id;
    await purchase.save();
    
    res.status(200).json({
      success: true,
      data: purchase,
      message: 'Purchase received and stock updated successfully'
    });
  } catch (error) {
    next(error);
  }
};