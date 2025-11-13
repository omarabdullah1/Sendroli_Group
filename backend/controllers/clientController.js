const Client = require('../models/Client');

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private (Receptionist, Admin)
exports.getClients = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { factoryName: { $regex: search, $options: 'i' } },
      ];
    }

    const clients = await Client.find(query)
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Client.countDocuments(query);

    res.status(200).json({
      success: true,
      data: clients,
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

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
exports.getClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).populate('createdBy', 'username fullName');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new client
// @route   POST /api/clients
// @access  Private (Receptionist, Admin)
exports.createClient = async (req, res) => {
  try {
    const { name, phone, factoryName, address, notes } = req.body;

    const client = await Client.create({
      name,
      phone,
      factoryName,
      address,
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: client,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private (Receptionist, Admin)
exports.updateClient = async (req, res) => {
  try {
    const { name, phone, factoryName, address, notes } = req.body;

    let client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    client = await Client.findByIdAndUpdate(
      req.params.id,
      { name, phone, factoryName, address, notes },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private (Receptionist, Admin)
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    await client.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
