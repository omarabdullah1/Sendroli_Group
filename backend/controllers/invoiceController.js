const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const Order = require('../models/Order');

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
    
    res.status(201).json({
      success: true,
      data: {
        ...populatedInvoice.toObject(),
        orders: [],
      },
    });
  } catch (error) {
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
    
    // Delete the invoice
    await invoice.deleteOne();
    
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
