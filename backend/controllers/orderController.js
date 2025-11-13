const Order = require('../models/Order');
const Client = require('../models/Client');

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

    // Search functionality
    if (search) {
      const clients = await Client.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { factoryName: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');

      const clientIds = clients.map((client) => client._id);
      query.client = { $in: clientIds };
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
      clientSnapshot,
      repeats,
      sheetSize,
      type,
      totalPrice,
      deposit,
      orderState,
      notes,
    } = req.body;

    // Verify client exists
    const clientExists = await Client.findById(client);
    if (!clientExists) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Create order with client snapshot
    const order = await Order.create({
      client,
      clientSnapshot: clientSnapshot || {
        name: clientExists.name,
        phone: clientExists.phone,
        factoryName: clientExists.factoryName,
      },
      repeats,
      sheetSize,
      type,
      totalPrice,
      deposit: deposit || 0,
      orderState: orderState || 'pending',
      notes,
      createdBy: req.user._id,
    });

    // Populate and return
    const populatedOrder = await Order.findById(order._id)
      .populate('client', 'name phone factoryName')
      .populate('createdBy', 'username fullName');

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

    // Role-based update restrictions
    const { role } = req.user;
    const updateData = { ...req.body };

    // Designer can only update orderState
    if (role === 'designer') {
      const allowedFields = ['orderState', 'notes'];
      Object.keys(updateData).forEach((key) => {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      });
    }

    // Financial can only update payment-related fields
    if (role === 'financial') {
      const allowedFields = ['deposit', 'totalPrice', 'notes'];
      Object.keys(updateData).forEach((key) => {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      });
    }

    // Add updatedBy
    updateData.updatedBy = req.user._id;

    order = await Order.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('client', 'name phone factoryName')
      .populate('createdBy', 'username fullName')
      .populate('updatedBy', 'username fullName');

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

    await order.deleteOne();

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
