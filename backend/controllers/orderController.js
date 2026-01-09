const Order = require('../models/Order');
const Client = require('../models/Client');
const Material = require('../models/Material');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const cache = require('../utils/cache');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private (Role-based filtering)
exports.getOrders = async (req, res) => {
  try {
    const { search, state, page = 1, limit = 10 } = req.query;

    let query = {};

    // Filter by order state
    if (state) {
      query.orderState = state;
    }

    // Role-based filtering for clients
    if (req.user.role === 'client') {
      const clientDoc = await Client.findOne({ user: req.user._id });
      if (clientDoc) {
        query.client = clientDoc._id;
      } else {
        return res.status(200).json({
          success: true,
          data: [],
          totalPages: 0,
          currentPage: page,
          total: 0,
        });
      }
      // Role-based filter for client is already applied above.
    }

    const orders = await Order.find(query)
      .populate('client', 'name phone factoryName')
      .populate('createdBy', 'username fullName')
      .populate('updatedBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: orders,
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

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('client', 'name phone factoryName address')
      .populate('createdBy', 'username fullName')
      .populate('updatedBy', 'username fullName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check ownership or appropriate role for access
    const userRole = req.user.role;
    const isOwner = order.createdBy._id.toString() === req.user._id.toString();
    const isAdmin = userRole === 'admin';
    const hasOrderAccess = ['designer', 'worker', 'financial'].includes(userRole);

    let isClientOwner = false;
    if (userRole === 'client') {
      const clientDoc = await Client.findOne({ user: req.user._id });
      // Check if the order belongs to this client
      // Note: order.client is populated, so we access _id
      if (clientDoc && order.client._id.toString() === clientDoc._id.toString()) {
        isClientOwner = true;
      }
    }

    // Only owner, admin, users with order access, or the client who owns the order can view
    if (!isOwner && !isAdmin && !hasOrderAccess && !isClientOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const {
      client,
      clientName,
      clientSnapshot,
      repeats,
      sheetWidth,
      sheetHeight,
      type,
      material,
      product, // Add product to destructuring
      totalPrice,
      deposit,
      orderState,
      notes,
      designLink,
      invoice,
    } = req.body;

    // For invoice orders, client field is optional (clientName is used instead)
    // For regular orders, client is required
    if (!invoice && !client) {
      return res.status(400).json({
        success: false,
        message: 'Client is required for non-invoice orders',
      });
    }

    // Calculate order size if dimensions are provided (same calculation as frontend)
    // Ensure values are numbers
    const numRepeats = parseFloat(repeats) || 0;
    const numSheetWidth = parseFloat(sheetWidth) || 0;
    const numSheetHeight = parseFloat(sheetHeight) || 0;

    let calculatedOrderSize = 0;
    // Calculate the order size by height only (meters) * repeats
    if (numRepeats > 0 && numSheetHeight > 0) {
      calculatedOrderSize = numRepeats * numSheetHeight;
    }

    let orderData = {
      clientName: clientName || null,
      repeats: numRepeats,
      sheetWidth: numSheetWidth,
      sheetHeight: numSheetHeight,
      type,
      material: material || null,
      product: product || null, // Add product to orderData
      deposit: parseFloat(deposit) || 0,
      orderState: orderState || 'pending',
      notes,
      designLink,
      invoice: invoice || null,
      createdBy: req.user._id,
    };

    // Priority: Product > Material > Manual Price

    if (product) {
      const Product = require('../models/Product');
      const productDoc = await Product.findById(product);

      if (productDoc) {
        orderData.type = productDoc.name;
        // Use product selling price
        // If we want to support multiple products (quantity), we might need another field or use repeats
        // For now, assuming repeats acts as quantity if valid
        const quantity = numRepeats > 0 ? numRepeats : 1;
        orderData.totalPrice = productDoc.sellingPrice * (numRepeats > 0 ? 1 : 1); // Logic check: current requirement says "every product have price". 
        // If I strictly follow "product have price", then totalPrice = product.price. 
        // But usually if I buy 2, it's 2x price. 
        // The prompt: "order... uses a product".
        // Let's assume repeats is NOT quantity for Product unless specified. 
        // But wait, existing logic uses repeats for printing.
        // If this is a Product (e.g. Rollup Stand), repeats might be quantity. 
        // If this is printing service using Material, repeats is copies.

        // Let's rely on the frontend to calculate, OR do backend calculation. 
        // Safe bet: Use product price. If frontend sent totalPrice, maybe verify? 
        // But here we are setting it.
        // Let's set it to product.sellingPrice.
        orderData.totalPrice = productDoc.sellingPrice;

        console.log('🔧 BACKEND PRICE CALCULATION (Product):', {
          product: productDoc.name,
          price: productDoc.sellingPrice
        });
      }
    } else if (material) {
      const materialDoc = await Material.findById(material);
      if (materialDoc) {
        // Set type from material name
        orderData.type = materialDoc.name;

        if (materialDoc.sellingPrice) {
          // Calculate total price as selling price per meter * order size (meters)
          if (calculatedOrderSize > 0) {
            orderData.totalPrice = parseFloat(materialDoc.sellingPrice) * calculatedOrderSize;
          } else {
            // If order size is not available, use selling price directly
            orderData.totalPrice = parseFloat(materialDoc.sellingPrice);
          }
        } else {
          // If no material price, use provided totalPrice or require it
          if (!totalPrice) {
            return res.status(400).json({
              success: false,
              message: 'Material has no selling price. Please set price manually.',
            });
          }
          orderData.totalPrice = totalPrice;
        }
      }
    } else {
      // No material or product selected, use provided price and type
      if (!totalPrice) {
        return res.status(400).json({
          success: false,
          message: 'Total price is required when no material/product is selected',
        });
      }
      orderData.totalPrice = totalPrice;
      // Type can be set manually if no material
      if (type) {
        orderData.type = type;
      }
    }

    // If client ID provided, verify and add snapshot
    if (client) {
      const clientExists = await Client.findById(client);
      if (!clientExists) {
        return res.status(404).json({
          success: false,
          message: 'Client not found',
        });
      }
      orderData.client = client;
      orderData.clientSnapshot = clientSnapshot || {
        name: clientExists.name,
        phone: clientExists.phone,
        factoryName: clientExists.factoryName,
      };
    }

    // Create order
    const order = await Order.create(orderData);

    // Populate and return
    const populatedOrder = await Order.findById(order._id)
      .populate('client', 'name phone factoryName')
      .populate('material', 'name sellingPrice')
      .populate('invoice')
      .populate('createdBy', 'username fullName');

    // Notify relevant users about new order
    try {
      console.log('🔍 ===== ORDER CREATE NOTIFICATION START =====');
      console.log('🔍 Order ID:', order._id.toString());
      console.log('🔍 Order type:', orderData.type || 'Not specified');
      console.log('🔍 Current user:', {
        id: req.user._id.toString(),
        username: req.user.username,
        role: req.user.role
      });

      // Find all admin, designer, and worker users (including current user for testing)
      const allUsers = await User.find({
        role: { $in: ['admin', 'designer', 'worker'] },
        isActive: true,
      }).select('_id username role email isActive');

      console.log(`📧 Total admin/designer/worker users in database: ${allUsers.length}`);
      allUsers.forEach(u => {
        console.log(`  - ${u.username} (${u.role}) - ID: ${u._id.toString()} - Active: ${u.isActive} - ${u._id.toString() === req.user._id.toString() ? '(YOU)' : ''}`);
      });

      const clientDisplay = populatedOrder.clientSnapshot?.name || populatedOrder.clientName || 'Unknown Client';
      const orderType = orderData.type || 'Order';

      let notificationCount = 0;
      for (const user of allUsers) {
        console.log(`\n📤 Attempting to create notification for user: ${user.username} (${user._id.toString()})`);
        try {
          const notificationData = {
            title: 'New Order Created',
            message: `Order #${order._id.toString().slice(-6)} for ${clientDisplay} - ${orderType} (${order.repeats || 0} repeats) created by ${req.user.username} - Total: ${order.totalPrice} EGP`,
            icon: 'fa-file-circle-plus',
            type: 'order',
            relatedId: order._id,
            relatedType: 'order',
            actionUrl: `/orders/${order._id}`,
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

    // Emit socket event for real-time subscribers if socket server is present
    try {
      const io = req?.app?.get('io');
      if (io) io.emit('order:created', populatedOrder);
    } catch (err) {
      console.warn('Socket emit failed for order:created:', err?.message || err);
    }

    // Invalidate cached dashboard summaries if any
    try {
      await cache.delPattern('dashboard_summary_*');
      await cache.delPattern('orders:timeseries:*');
      console.log('ℹ️ Cleared dashboard cache after order creation');
    } catch (err) {
      console.warn('⚠️ Failed to clear dashboard cache after order creation:', err?.message || err);
    }

    res.status(201).json({
      success: true,
      data: populatedOrder,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private (Role-based permissions)
exports.updateOrder = async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check ownership or appropriate role for modification
    const userRole = req.user.role;
    const isOwner = order.createdBy.toString() === req.user._id.toString();
    const isAdmin = userRole === 'admin';
    const isDesigner = userRole === 'designer';
    const isWorker = userRole === 'worker';
    const isFinancial = userRole === 'financial';

    // Only admin, owner (if admin), or users with specific roles can modify
    if (!isAdmin && !isDesigner && !isWorker && !isFinancial && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this order',
      });
    }

    // Role-based update restrictions
    const updateData = { ...req.body };

    // Designer can update order details and deposit, but NOT totalPrice
    if (isDesigner) {
      // Remove totalPrice (can't change price directly, only via material)
      delete updateData.totalPrice;
      // Keep deposit - designers can now update deposits
      // remainingAmount will be recalculated if needed
      delete updateData.client; // Can't change client
      delete updateData.invoice; // Can't change invoice

      // Allowed fields for designers: size, repeats, status, designLink, notes, material, deposit
      const allowedFields = [
        'orderState',
        'designLink',
        'material', // Can change material (price will auto-update)
        'sheetWidth',
        'sheetHeight',
        'repeats',
        'notes',
        'deposit', // Can now update deposit
        'clientName' // Can update client name display
      ];

      Object.keys(updateData).forEach((key) => {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      });

      // If material/product is changed or size changed, recalculate price
      if (updateData.material || updateData.product || updateData.repeats !== undefined || updateData.sheetWidth !== undefined || updateData.sheetHeight !== undefined) {
        const materialId = updateData.material || (order.material && !updateData.product ? order.material : null);
        const productId = updateData.product || (order.product && !updateData.material ? order.product : null);

        if (productId) {
          const Product = require('../models/Product');
          const productDoc = await Product.findById(productId);
          if (productDoc) {
            updateData.type = productDoc.name;
            updateData.totalPrice = productDoc.sellingPrice;
            const depositAmount = updateData.deposit !== undefined ? updateData.deposit : (order.deposit || 0);
            updateData.remainingAmount = updateData.totalPrice - depositAmount;
          }
        } else if (materialId) {
          const Material = require('../models/Material');
          const materialDoc = await Material.findById(materialId);
          if (materialDoc) {
            // Set type from material name
            updateData.type = materialDoc.name;

            if (materialDoc.sellingPrice) {
              // Calculate order size
              const r = parseFloat(updateData.repeats !== undefined ? updateData.repeats : (order.repeats || 0)) || 0;
              const h = parseFloat(updateData.sheetHeight !== undefined ? updateData.sheetHeight : (order.sheetHeight || 0)) || 0;
              // Width is kept as optional
              let calculatedOrderSize = 0;
              if (r > 0 && h > 0) {
                calculatedOrderSize = r * h;
              }

              // Calculate total price as selling price per meter * order size
              if (calculatedOrderSize > 0) {
                updateData.totalPrice = materialDoc.sellingPrice * calculatedOrderSize;
              } else {
                updateData.totalPrice = materialDoc.sellingPrice;
              }

              // Use updated deposit if provided, otherwise use existing deposit
              const depositAmount = updateData.deposit !== undefined ? updateData.deposit : (order.deposit || 0);
              updateData.remainingAmount = updateData.totalPrice - depositAmount;
            }
          }
        }
      }

      // Validate orderState transitions
      const validStates = ['pending', 'active', 'done', 'delivered'];
      if (updateData.orderState && !validStates.includes(updateData.orderState)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order state',
        });
      }

      // Validate deposit if being updated
      if (updateData.deposit !== undefined) {
        if (updateData.deposit < 0) {
          return res.status(400).json({
            success: false,
            message: 'Deposit cannot be negative',
          });
        }

        // Recalculate remainingAmount if deposit is updated
        const currentTotalPrice = updateData.totalPrice !== undefined ? updateData.totalPrice : order.totalPrice;
        updateData.remainingAmount = currentTotalPrice - updateData.deposit;
      }
    }

    // Worker can only update orderState (same restrictions as designer for state updates)
    if (isWorker) {
      const allowedFields = ['orderState'];
      Object.keys(updateData).forEach((key) => {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      });

      // Validate orderState transitions
      const validStates = ['pending', 'active', 'done', 'delivered'];
      if (updateData.orderState && !validStates.includes(updateData.orderState)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order state',
        });
      }
    }

    // Financial can only update payment-related fields and notes
    if (isFinancial) {
      const allowedFields = ['deposit', 'totalPrice', 'notes'];
      Object.keys(updateData).forEach((key) => {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      });

      // Validate payment amounts
      if (updateData.deposit && updateData.deposit < 0) {
        return res.status(400).json({
          success: false,
          message: 'Deposit cannot be negative',
        });
      }

      if (updateData.totalPrice && updateData.totalPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Total price cannot be negative',
        });
      }
    }

    // Add updatedBy and timestamp
    updateData.updatedBy = req.user._id;
    updateData.updatedAt = new Date();

    // Check material stock before changing status to 'done'
    if (updateData.orderState === 'done' && order.orderState !== 'done') {
      if (order.material && order.orderSize) {
        const material = await Material.findById(order.material);

        if (material) {
          const requiredStock = order.orderSize;
          const availableStock = material.currentStock;

          if (availableStock < requiredStock) {
            return res.status(400).json({
              success: false,
              message: `Insufficient material stock. Required: ${requiredStock.toFixed(2)} ${material.unit}, Available: ${availableStock.toFixed(2)} ${material.unit}`,
              materialInfo: {
                name: material.name,
                required: requiredStock,
                available: availableStock,
                shortage: requiredStock - availableStock,
                unit: material.unit,
                status: availableStock <= material.minStockLevel ? 'Low Stock' : 'Normal'
              }
            });
          }
        }
      }
    }

    // Log the modification for audit trail
    console.log(`Order ${req.params.id} updated by user ${req.user._id} (${req.user.username}) - Role: ${userRole}`);

    order = await Order.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('client', 'name phone factoryName')
      .populate('material', 'name sellingPrice')
      .populate('createdBy', 'username fullName')
      .populate('updatedBy', 'username fullName');

    // Notify relevant users about order update
    try {
      console.log('🔍 ===== ORDER UPDATE NOTIFICATION START =====');
      console.log('🔍 Order ID:', order._id.toString());
      console.log('🔍 Order state:', order.orderState);
      console.log('🔍 Current user:', {
        id: req.user._id.toString(),
        username: req.user.username,
        role: req.user.role
      });

      // Find all admin, designer, and worker users (including current user for testing)
      const allUsers = await User.find({
        role: { $in: ['admin', 'designer', 'worker', 'financial'] },
        isActive: true,
      }).select('_id username role email isActive');

      console.log(`📧 Total admin/designer/worker/financial users in database: ${allUsers.length}`);
      allUsers.forEach(u => {
        console.log(`  - ${u.username} (${u.role}) - ID: ${u._id.toString()} - Active: ${u.isActive} - ${u._id.toString() === req.user._id.toString() ? '(YOU)' : ''}`);
      });

      const clientDisplay = order.clientSnapshot?.name || order.clientName || 'Unknown Client';
      const orderType = order.type || 'Order';

      let notificationCount = 0;
      for (const user of allUsers) {
        console.log(`\n📤 Attempting to create notification for user: ${user.username} (${user._id.toString()})`);
        try {
          const notificationData = {
            title: 'Order Updated',
            message: `Order #${order._id.toString().slice(-6)} for ${clientDisplay} updated by ${req.user.username} - Status: ${order.orderState.toUpperCase()}${updateData.deposit ? ' - Deposit: ' + updateData.deposit + ' EGP' : ''}`,
            icon: 'fa-file-pen',
            type: 'order',
            relatedId: order._id,
            relatedType: 'order',
            actionUrl: `/orders/${order._id}`,
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

    // Emit socket event for real-time subscribers if socket server is present
    try {
      const io = req?.app?.get('io');
      if (io) io.emit('order:updated', order);
    } catch (err) {
      console.warn('Socket emit failed for order:updated:', err?.message || err);
    }

    // Invalidate cached dashboard summaries
    try {
      await cache.delPattern('dashboard_summary_*');
      await cache.delPattern('orders:timeseries:*');
      console.log('ℹ️ Cleared dashboard cache after order update');
    } catch (err) {
      console.warn('⚠️ Failed to clear dashboard cache after order update:', err?.message || err);
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check ownership or admin role for deletion
    const userRole = req.user.role;
    const isOwner = order.createdBy.toString() === req.user._id.toString();
    const isAdmin = userRole === 'admin';

    // Only admin or owner (if admin) can delete
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this order',
      });
    }

    // Additional check: Only admin can delete orders that are in progress or completed
    if (order.orderState !== 'pending' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete orders that are in progress or completed. Only admin can perform this action.',
      });
    }

    // Log the deletion for audit trail
    console.log(`Order ${req.params.id} deleted by user ${req.user._id} (${req.user.username}) - Order state was: ${order.orderState}`);

    // Store order details before deletion
    const orderRef = order._id.toString().slice(-6);
    const clientDisplay = order.clientSnapshot?.name || order.clientName || 'Unknown Client';
    const orderType = order.type || 'Order';
    const orderTotal = order.totalPrice || 0;
    const orderStateText = order.orderState;

    await order.deleteOne();

    // Invalidate cached dashboard summaries
    try {
      await cache.delPattern('dashboard_summary_*');
      await cache.delPattern('orders:timeseries:*');
      console.log('ℹ️ Cleared dashboard cache after order deletion');
    } catch (err) {
      console.warn('⚠️ Failed to clear dashboard cache after order deletion:', err?.message || err);
    }

    // Notify relevant users about order deletion
    try {
      console.log('🔍 ===== ORDER DELETE NOTIFICATION START =====');
      console.log('🔍 Order Ref:', orderRef);
      console.log('🔍 Client:', clientDisplay);
      console.log('🔍 Current user:', {
        id: req.user._id.toString(),
        username: req.user.username,
        role: req.user.role
      });

      // Find all admin, designer, and worker users (including current user for testing)
      const allUsers = await User.find({
        role: { $in: ['admin', 'designer', 'worker', 'financial'] },
        isActive: true,
      }).select('_id username role email isActive');

      console.log(`📧 Total admin/designer/worker/financial users in database: ${allUsers.length}`);
      allUsers.forEach(u => {
        console.log(`  - ${u.username} (${u.role}) - ID: ${u._id.toString()} - Active: ${u.isActive} - ${u._id.toString() === req.user._id.toString() ? '(YOU)' : ''}`);
      });

      let notificationCount = 0;
      for (const user of allUsers) {
        console.log(`\n📤 Attempting to create notification for user: ${user.username} (${user._id.toString()})`);
        try {
          const notificationData = {
            title: 'Order Deleted',
            message: `Order #${orderRef} for ${clientDisplay} - ${orderType} (Total: ${orderTotal} EGP, Status: ${orderStateText}) was deleted by ${req.user.username}`,
            icon: 'fa-file-circle-minus',
            type: 'order',
            relatedId: null,
            relatedType: 'order',
            actionUrl: '/orders',
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

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get financial statistics
// @route   GET /api/orders/stats/financial
// @access  Private (Financial, Admin)
exports.getFinancialStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          totalDeposits: { $sum: '$deposit' },
          totalRemaining: { $sum: '$remainingAmount' },
        },
      },
    ]);

    const stateStats = await Order.aggregate([
      {
        $group: {
          _id: '$orderState',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalPrice' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: stats[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          totalDeposits: 0,
          totalRemaining: 0,
        },
        byState: stateStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get revenue timeseries (grouped by day)
// @route   GET /api/orders/stats/timeseries?period=30
// @access  Private (Financial, Admin, Designer)
const cacheUtil = require('../utils/cache');
exports.getRevenueTimeseries = async (req, res, next) => {
  try {
    const period = parseInt(req.query.period) || undefined; // numeric period
    const interval = (req.query.interval || 'day').toLowerCase();
    const allowed = ['day', 'week', 'month'];
    if (!allowed.includes(interval)) {
      return res.status(400).json({ success: false, message: 'Invalid interval. Use day, week, or month.' });
    }

    // Default period based on interval
    let defaultPeriod = 30;
    if (interval === 'week') defaultPeriod = 12; // 12 weeks
    if (interval === 'month') defaultPeriod = 12; // 12 months
    const p = Number.isFinite(period) && parseInt(period) > 0 ? parseInt(period) : defaultPeriod;

    // Determine cache key and check cache
    const cacheKey = `orders:timeseries:${interval}:${p}`;
    try {
      const cached = await cacheUtil.get(cacheKey);
      if (cached) {
        return res.status(200).json({ success: true, data: cached });
      }
    } catch (err) {
      // Cache failed to read - continue to compute
      console.warn('Cache read failed (timeseries) - computing live:', err?.message || err);
    }

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    let start = new Date(end);
    let groupStage = null;
    let labels = [];

    if (interval === 'day') {
      start.setHours(0, 0, 0, 0);
      start.setDate(end.getDate() - (p - 1));
      groupStage = {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalRevenue: { $sum: { $ifNull: ['$totalPrice', 0] } }
        }
      };
      // build labels for each day
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        labels.push(d.toISOString().slice(0, 10));
      }
    } else if (interval === 'week') {
      // start at the beginning of the week (Mon)
      const now = new Date(end);
      const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Monday
      const currentMonday = new Date(now);
      currentMonday.setDate(now.getDate() - dayOfWeek);
      currentMonday.setHours(0, 0, 0, 0);
      start = new Date(currentMonday);
      start.setDate(start.getDate() - (p - 1) * 7);
      // group by week number and iso year
      groupStage = {
        $group: {
          _id: {
            year: { $isoWeekYear: '$createdAt' },
            week: { $isoWeek: '$createdAt' }
          },
          totalRevenue: { $sum: { $ifNull: ['$totalPrice', 0] } }
        }
      };
      // Build labels as YYYY-Wxx for each week
      const weekStart = new Date(start);
      for (let i = 0; i < p; i++) {
        const y = weekStart.getFullYear();
        // compute iso week number for weekStart
        const isoWeekNumber = (() => {
          const tmp = new Date(weekStart);
          // ISO week calc: Thursday is in same week
          tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
          const firstThursday = new Date(tmp.getFullYear(), 0, 4);
          const diff = Math.round((tmp - firstThursday) / 86400000);
          return Math.floor(diff / 7) + 1;
        })();
        labels.push(`${weekStart.getFullYear()}-W${String(isoWeekNumber).padStart(2, '0')}`);
        weekStart.setDate(weekStart.getDate() + 7);
      }
    } else if (interval === 'month') {
      // set to first day of current month
      const now = new Date(end);
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      firstOfMonth.setHours(0, 0, 0, 0);
      start = new Date(firstOfMonth);
      start.setMonth(start.getMonth() - (p - 1));
      groupStage = {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          totalRevenue: { $sum: { $ifNull: ['$totalPrice', 0] } }
        }
      };
      // Build labels for months - YYYY-MM
      const mStart = new Date(start);
      for (let i = 0; i < p; i++) {
        labels.push(`${mStart.getFullYear()}-${String(mStart.getMonth() + 1).padStart(2, '0')}`);
        mStart.setMonth(mStart.getMonth() + 1);
      }
    }

    const matchStage = {
      $match: {
        createdAt: { $gte: start, $lte: end }
      }
    };

    // build aggregation pipeline
    const sortStage = (interval === 'week') ? { $sort: { '_id.year': 1, '_id.week': 1 } } : { $sort: { '_id': 1 } };
    const pipeline = [matchStage, groupStage, sortStage];
    const timeseries = await Order.aggregate(pipeline);

    const map = {};
    // transform group key depending on interval
    if (interval === 'week') {
      timeseries.forEach((t) => {
        if (t._id && t._id.year && t._id.week) {
          const lbl = `${t._id.year}-W${String(t._id.week).padStart(2, '0')}`;
          map[lbl] = t.totalRevenue;
        }
      });
    } else {
      // day or month: _id directly a string in YYYY-MM-DD or YYYY-MM
      timeseries.forEach((t) => {
        if (t._id) map[t._id] = t.totalRevenue;
      });
    }

    const data = labels.map((l) => map[l] || 0);
    const responseData = { labels, data };
    // Save to cache with TTL if available
    try {
      const ttl = Number(process.env.TIMESERIES_CACHE_TTL) || 300; // 5 minutes
      await cacheUtil.set(cacheKey, responseData, ttl);
    } catch (err) {
      console.warn('Cache write failed (timeseries):', err?.message || err);
    }

    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    next(error);
  }
};
