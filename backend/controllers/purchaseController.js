const Purchase = require('../models/Purchase');
const Material = require('../models/Material');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

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
    
    // Notify admins about new purchase order
    try {
      const admins = await User.find({ role: 'admin', isActive: true });
      const materialNames = purchase.items.map(item => item.material.name).join(', ');
      
      for (const admin of admins) {
        await createNotification(admin._id, {
          title: 'New Purchase Order Created',
          message: `${req.user.username} created purchase order ${purchase.purchaseNumber} from ${purchase.supplier.name} - Materials: ${materialNames}`,
          icon: 'fa-cart-shopping',
          type: 'system',
          relatedId: purchase._id,
          relatedType: 'purchase',
          actionUrl: `/inventory/purchases/${purchase._id}`
        });
      }
    } catch (notifError) {
      console.error('Error creating purchase notification:', notifError);
    }
    
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
    
    // Notify admins about purchase update with status-specific messages
    try {
      const admins = await User.find({ role: 'admin', isActive: true });
      const materialNames = purchase.items.map(item => item.material.name).join(', ');
      
      let notificationTitle = 'Purchase Order Updated';
      let notificationMessage = `${req.user.username} updated purchase order ${purchase.purchaseNumber}`;
      let notificationIcon = 'fa-edit';
      
      // Status-specific notifications
      if (updateData.status === 'ordered') {
        notificationTitle = 'Purchase Order Marked as Ordered';
        notificationMessage = `${req.user.username} marked purchase order ${purchase.purchaseNumber} as ORDERED - Supplier: ${purchase.supplier.name}`;
        notificationIcon = 'fa-check-circle';
      } else if (updateData.status === 'cancelled') {
        notificationTitle = 'Purchase Order Cancelled';
        notificationMessage = `${req.user.username} cancelled purchase order ${purchase.purchaseNumber} - Supplier: ${purchase.supplier.name}`;
        notificationIcon = 'fa-ban';
      } else {
        notificationMessage += ` from ${purchase.supplier.name} - Materials: ${materialNames}`;
      }
      
      for (const admin of admins) {
        await createNotification(admin._id, {
          title: notificationTitle,
          message: notificationMessage,
          icon: notificationIcon,
          type: 'system',
          relatedId: purchase._id,
          relatedType: 'purchase',
          actionUrl: `/inventory/purchases/${purchase._id}`
        });
      }
    } catch (notifError) {
      console.error('Error creating purchase update notification:', notifError);
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
    
    // Get purchase details before deletion for notification
    await purchase.populate('supplier', 'name contactPerson');
    const purchaseNumber = purchase.purchaseNumber;
    const supplierName = purchase.supplier?.name || 'Unknown Supplier';
    
    await Purchase.findByIdAndDelete(req.params.id);
    
    // Notify admins about purchase deletion
    try {
      const admins = await User.find({ role: 'admin', isActive: true });
      
      for (const admin of admins) {
        await createNotification(admin._id, {
          title: 'Purchase Order Deleted',
          message: `${req.user.username} deleted purchase order ${purchaseNumber} - Supplier: ${supplierName}`,
          icon: 'fa-trash',
          type: 'system',
          actionUrl: '/inventory/purchases'
        });
      }
    } catch (notifError) {
      console.error('Error creating purchase deletion notification:', notifError);
    }
    
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
    
    // Notify admins about stock addition
    try {
      const admins = await User.find({
        role: 'admin',
        isActive: true,
      });

      const materialNames = receivedItems.map(item => {
        const mat = purchase.items.find(i => i.material._id.toString() === item.materialId);
        return mat ? mat.material.name : 'Unknown';
      }).join(', ');

      for (const admin of admins) {
        await createNotification(admin._id, {
          title: 'Purchase Received',
          message: `Purchase order ${purchase.purchaseNumber} received - Materials: ${materialNames}`,
          icon: 'fa-arrow-right-to-bracket',
          type: 'inventory',
          relatedId: purchase._id,
          relatedType: 'purchase',
          actionUrl: `/inventory/purchases/${purchase._id}`,
        });
      }
    } catch (notifError) {
      console.error('Error creating purchase notifications:', notifError);
    }
    
    res.status(200).json({
      success: true,
      data: purchase,
      message: 'Purchase received and stock updated successfully'
    });
  } catch (error) {
    next(error);
  }
};