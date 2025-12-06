const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const Order = require('../models/Order');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res, next) => {
  try {
    const { status, client, startDate, endDate, page = 1, limit = 10 } = req.query;
    
    const query = {};
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by client
    if (client) {
      query.client = client;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const invoices = await Invoice.find(query)
      .populate('client', 'name phone factoryName')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get order counts for each invoice
    const invoicesWithOrders = await Promise.all(
      invoices.map(async (invoice) => {
        const orderCount = await Order.countDocuments({ invoice: invoice._id });
        return {
          ...invoice.toObject(),
          orderCount,
        };
      })
    );
    
    const total = await Invoice.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: invoicesWithOrders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice with orders
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client', 'name phone factoryName address')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }
    
    // Get all orders for this invoice
    const orders = await Order.find({ invoice: invoice._id })
      .populate('client', 'name phone factoryName')
      .populate('material', 'name sellingPrice')
      .sort({ createdAt: 1 });
    
    // Recalculate totals to ensure they're always up-to-date when viewing
    await invoice.recalculateTotals();
    
    // Reload invoice to get updated totals
    const updatedInvoice = await Invoice.findById(invoice._id)
      .populate('client', 'name phone factoryName address')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    res.status(200).json({
      success: true,
      data: {
        ...updatedInvoice.toObject(),
        orders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
exports.createInvoice = async (req, res, next) => {
  console.log('🎯 ===== CREATE INVOICE CALLED =====');
  console.log('🎯 User:', req.user?.username, 'Role:', req.user?.role);
  console.log('🎯 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { client, tax, shipping, discount, status, notes } = req.body;
    
    // Validate client exists
    const clientDoc = await Client.findById(client);
    if (!clientDoc) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }
    
    // Restrict designers from setting financial fields
    let invoiceData = {
      client,
      clientSnapshot: {
        name: clientDoc.name,
        phone: clientDoc.phone,
        factoryName: clientDoc.factoryName,
      },
      status: status || 'draft',
      notes,
      createdBy: req.user._id,
    };
    
    // Only admin can set financial fields when creating
    if (req.user.role === 'admin') {
      invoiceData.tax = tax || 0;
      invoiceData.shipping = shipping || 0;
      invoiceData.discount = discount || 0;
    } else {
      // For non-admin users, set financial fields to 0
      invoiceData.tax = 0;
      invoiceData.shipping = 0;
      invoiceData.discount = 0;
    }
    
    // Create invoice with client snapshot
    const invoice = await Invoice.create(invoiceData);
    
    // Recalculate totals (will be 0 if no orders yet, but ensures correct calculation)
    await invoice.recalculateTotals();
    
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('client', 'name phone factoryName')
      .populate('createdBy', 'name email');
    
    // Create notifications for financial staff and admins about new invoice
    // Conditional logic: Designer actions notify designer+admin, Admin actions only notify admin+financial
    try {
      console.log('🔍 ===== INVOICE CREATE NOTIFICATION START =====');
      console.log('🔍 Invoice ID:', invoice._id.toString());
      console.log('🔍 Current user:', {
        id: req.user._id.toString(),
        username: req.user.username,
        role: req.user.role
      });
      
      // Determine notification recipients based on current user's role
      let recipientRoles;
      if (req.user.role === 'designer') {
        // Designer actions: notify designer (self) + admins
        recipientRoles = ['designer', 'admin'];
        console.log('📋 Designer action: Will notify designers + admins');
      } else {
        // Admin/Financial actions: notify admin + financial only (not designers)
        recipientRoles = ['financial', 'admin'];
        console.log('📋 Admin/Financial action: Will notify admins + financial only');
      }
      
      console.log('🔍 Querying users with roles:', recipientRoles);
      const allUsers = await User.find({
        role: { $in: recipientRoles },
        isActive: true,
      }).select('_id username role email isActive');
      
      console.log(`📧 Total users to notify (${recipientRoles.join('/')}): ${allUsers.length}`);
      
      if (allUsers.length === 0) {
        console.warn('⚠️ WARNING: No users found to notify!');
        console.warn('⚠️ Checking all users in database...');
        const allDbUsers = await User.find({}).select('_id username role isActive');
        console.warn(`⚠️ Total users in DB: ${allDbUsers.length}`);
        allDbUsers.forEach(u => {
          console.warn(`  - ${u.username} (${u.role}) - Active: ${u.isActive}`);
        });
      } else {
        allUsers.forEach(u => {
          console.log(`  - ${u.username} (${u.role}) - ID: ${u._id.toString()} - Active: ${u.isActive} - ${u._id.toString() === req.user._id.toString() ? '(YOU)' : ''}`);
        });
      }

      const clientName = populatedInvoice.clientSnapshot?.name || 'Unknown Client';
      console.log('📋 Client name:', clientName);
      
      let notificationCount = 0;
      for (const user of allUsers) {
        console.log(`\n📤 Attempting to create notification for user: ${user.username} (${user._id.toString()})`);
        try {
          const notificationData = {
            title: 'New Invoice Created',
            message: `Invoice #${invoice.invoiceNumber || invoice._id.toString().slice(-6)} created for ${clientName} by ${req.user.username} (${req.user.role}) - Total: ${invoice.total} EGP`,
            icon: 'fa-file-invoice',
            type: 'invoice',
            relatedId: invoice._id,
            relatedType: 'invoice',
            actionUrl: `/invoices/${invoice._id}`,
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
      // Don't throw - we still want to return the invoice even if notifications fail
      // But log it prominently so we know there's an issue
    }
    
    console.log('🎯 Sending response with invoice data...');
    res.status(201).json({
      success: true,
      data: {
        ...populatedInvoice.toObject(),
        orders: [],
      },
    });
    console.log('🎯 Response sent successfully');
  } catch (error) {
    console.error('❌ CREATE INVOICE ERROR:', error);
    next(error);
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
exports.updateInvoice = async (req, res, next) => {
  try {
    let invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }
    
    // Restrict designers from editing financial fields and client
    if (req.user.role === 'designer') {
      // Remove financial fields from update
      delete req.body.tax;
      delete req.body.shipping;
      delete req.body.discount;
      delete req.body.subtotal;
      delete req.body.total;
      delete req.body.totalRemaining;
      delete req.body.client; // Designers can't change client when editing (but can select when creating)
      // Designers CAN edit: invoiceDate, status, notes (these are allowed)
    }
    
    // If client is being updated, update the snapshot (only for admin)
    if (req.body.client && req.body.client !== invoice.client.toString()) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admin can change invoice client',
        });
      }
      
      const clientDoc = await Client.findById(req.body.client);
      if (!clientDoc) {
        return res.status(404).json({
          success: false,
          message: 'Client not found',
        });
      }
      req.body.clientSnapshot = {
        name: clientDoc.name,
        phone: clientDoc.phone,
        factoryName: clientDoc.factoryName,
      };
    }
    
    // Update the invoice
    req.body.updatedBy = req.user._id;
    
    // Update invoice fields
    Object.assign(invoice, req.body);
    await invoice.save();
    
    // Recalculate totals based on orders (only if financial fields changed)
    if (req.user.role !== 'designer') {
      await invoice.recalculateTotals();
    }
    
    // Get updated invoice with orders
    invoice = await Invoice.findById(invoice._id)
      .populate('client', 'name phone factoryName')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    const orders = await Order.find({ invoice: invoice._id })
      .populate('client', 'name phone factoryName')
      .populate('material', 'name sellingPrice');
    
    // Create notifications for invoice update
    // Conditional logic: Designer actions notify designer+admin, Admin actions only notify admin+financial
    try {
      console.log('🔍 ===== INVOICE UPDATE NOTIFICATION START =====');
      console.log('🔍 Invoice ID:', invoice._id.toString());
      console.log('🔍 Current user:', {
        id: req.user._id.toString(),
        username: req.user.username,
        role: req.user.role
      });
      
      // Determine notification recipients based on current user's role
      let recipientRoles;
      if (req.user.role === 'designer') {
        // Designer actions: notify designer (self) + admins
        recipientRoles = ['designer', 'admin'];
        console.log('📋 Designer action: Will notify designers + admins');
      } else {
        // Admin/Financial actions: notify admin + financial only (not designers)
        recipientRoles = ['financial', 'admin'];
        console.log('📋 Admin/Financial action: Will notify admins + financial only');
      }
      
      const allUsers = await User.find({
        role: { $in: recipientRoles },
        isActive: true,
      }).select('_id username role email isActive');
      
      console.log(`📧 Total users to notify (${recipientRoles.join('/')}): ${allUsers.length}`);
      allUsers.forEach(u => {
        console.log(`  - ${u.username} (${u.role}) - ID: ${u._id.toString()} - Active: ${u.isActive} - ${u._id.toString() === req.user._id.toString() ? '(YOU)' : ''}`);
      });

      const clientName = invoice.clientSnapshot?.name || 'Unknown Client';
      console.log('📋 Client name:', clientName);
      
      let notificationCount = 0;
      for (const user of allUsers) {
        console.log(`\n📤 Attempting to create notification for user: ${user.username} (${user._id.toString()})`);
        try {
          const notificationData = {
            title: 'Invoice Updated',
            message: `Invoice #${invoice.invoiceNumber || invoice._id.toString().slice(-6)} for ${clientName} updated by ${req.user.username} (${req.user.role}) - Status: ${invoice.status || 'Active'}`,
            icon: 'fa-file-invoice',
            type: 'invoice',
            relatedId: invoice._id,
            relatedType: 'invoice',
            actionUrl: `/invoices/${invoice._id}`,
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
      data: {
        ...invoice.toObject(),
        orders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete invoice and its orders
// @route   DELETE /api/invoices/:id
// @access  Private (Admin only)
exports.deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }
    
    // Only admin can delete invoices
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete invoices',
      });
    }
    
    // Delete all orders associated with this invoice
    await Order.deleteMany({ invoice: invoice._id });
    
    // Store invoice details before deletion
    const invoiceNumber = invoice.invoiceNumber || invoice._id.toString().slice(-6);
    const clientName = invoice.clientSnapshot?.name || 'Unknown Client';
    const invoiceTotal = invoice.total || 0;
    
    // Delete the invoice
    await invoice.deleteOne();
    
    // Notify relevant users about invoice deletion
    // Conditional logic: Designer actions notify designer+admin, Admin actions only notify admin+financial
    try {
      console.log('🔍 ===== INVOICE DELETE NOTIFICATION START =====');
      console.log('🔍 Invoice Number:', invoiceNumber);
      console.log('🔍 Client:', clientName);
      console.log('🔍 Current user:', {
        id: req.user._id.toString(),
        username: req.user.username,
        role: req.user.role
      });
      
      // Determine notification recipients based on current user's role
      let recipientRoles;
      if (req.user.role === 'designer') {
        // Designer actions: notify designer (self) + admins
        recipientRoles = ['designer', 'admin'];
        console.log('📋 Designer action: Will notify designers + admins');
      } else {
        // Admin actions: notify admin + financial only (not designers)
        recipientRoles = ['financial', 'admin'];
        console.log('📋 Admin/Financial action: Will notify admins + financial only');
      }
      
      const allUsers = await User.find({
        role: { $in: recipientRoles },
        isActive: true,
      }).select('_id username role email isActive');
      
      console.log(`📧 Total users to notify (${recipientRoles.join('/')}): ${allUsers.length}`);
      allUsers.forEach(u => {
        console.log(`  - ${u.username} (${u.role}) - ID: ${u._id.toString()} - Active: ${u.isActive} - ${u._id.toString() === req.user._id.toString() ? '(YOU)' : ''}`);
      });
      
      let notificationCount = 0;
      for (const user of allUsers) {
        console.log(`\n📤 Attempting to create notification for user: ${user.username} (${user._id.toString()})`);
        try {
          const notificationData = {
            title: 'Invoice Deleted',
            message: `Invoice #${invoiceNumber} for ${clientName} (Total: ${invoiceTotal} EGP) was deleted by ${req.user.username} (${req.user.role})`,
            icon: 'fa-file-circle-xmark',
            type: 'invoice',
            relatedId: null,
            relatedType: 'invoice',
            actionUrl: '/invoices',
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
      data: {},
      message: 'Invoice and associated orders deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get invoice statistics
// @route   GET /api/invoices/stats
// @access  Private
exports.getInvoiceStats = async (req, res, next) => {
  try {
    const stats = await Invoice.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' },
          totalRemaining: { $sum: '$totalRemaining' },
        },
      },
    ]);
    
    const totalInvoices = await Invoice.countDocuments();
    const totalRevenue = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        byStatus: stats,
        totalInvoices,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
