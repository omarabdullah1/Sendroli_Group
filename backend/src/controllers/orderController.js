const Order = require('../models/Order');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res) => {
  try {
    const { status, clientId } = req.query;
    let filter = {};

    // Validate status against allowed values
    const allowedStatuses = ['pending', 'active', 'done', 'delivered'];
    if (status && allowedStatuses.includes(status)) {
      filter.status = status;
    }

    // Validate clientId is a valid MongoDB ObjectId
    if (clientId && /^[0-9a-fA-F]{24}$/.test(clientId)) {
      filter.client = clientId;
    }

    const orders = await Order.find(filter)
      .populate('client', 'name phone factoryName')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('client', 'name phone factoryName address')
      .populate('createdBy', 'username email role');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const {
      client,
      repeats,
      size,
      type,
      price,
      deposit,
      description,
      deliveryDate,
      status,
    } = req.body;

    const order = await Order.create({
      client,
      repeats,
      size,
      type,
      price,
      deposit,
      balance: price - deposit,
      description,
      deliveryDate,
      status: status || 'pending',
      createdBy: req.user._id,
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('client', 'name phone factoryName')
      .populate('createdBy', 'username email');

    res.status(201).json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const {
      client,
      repeats,
      size,
      type,
      price,
      deposit,
      description,
      deliveryDate,
      status,
    } = req.body;

    order.client = client || order.client;
    order.repeats = repeats || order.repeats;
    order.size = size || order.size;
    order.type = type || order.type;
    order.price = price !== undefined ? price : order.price;
    order.deposit = deposit !== undefined ? deposit : order.deposit;
    order.balance = order.price - order.deposit;
    order.description = description !== undefined ? description : order.description;
    order.deliveryDate = deliveryDate || order.deliveryDate;
    order.status = status || order.status;

    const updatedOrder = await order.save();

    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate('client', 'name phone factoryName')
      .populate('createdBy', 'username email');

    res.json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await order.deleteOne();
    res.json({ message: 'Order removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private
exports.getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$price' },
          totalDeposit: { $sum: '$deposit' },
          totalBalance: { $sum: '$balance' },
        },
      },
    ]);

    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$price' },
        },
      },
    ]);

    res.json({
      totalOrders,
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      statusBreakdown: stats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
