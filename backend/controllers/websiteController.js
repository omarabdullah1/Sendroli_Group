const WebsiteSettings = require('../models/WebsiteSettings');

// @desc    Get website settings (public)
// @route   GET /api/website/settings
// @access  Public
exports.getWebsiteSettings = async (req, res) => {
  try {
    let settings = await WebsiteSettings.findOne();

    // If no settings exist, create default settings
    if (!settings) {
      settings = await WebsiteSettings.create({
        services: [
          {
            title: 'DTF Printing',
            description: 'Direct to Film printing for vibrant, durable designs on various fabrics.',
            icon: '🖨️',
            isActive: true,
          },
          {
            title: 'DTF UV Printing',
            description: 'UV-cured Direct to Film printing for enhanced durability and color brilliance.',
            icon: '☀️',
            isActive: true,
          },
          {
            title: 'Vinyl Printing',
            description: 'High-quality vinyl printing for signage, decals, and custom graphics.',
            icon: '📐',
            isActive: true,
          },
          {
            title: 'Laser Cutting',
            description: 'Precision laser cutting for intricate designs and custom shapes.',
            icon: '✂️',
            isActive: true,
          },
          {
            title: 'Fabric Printing',
            description: 'Professional fabric printing for textiles, banners, and promotional materials.',
            icon: '🎨',
            isActive: true,
          },
        ],
        whyChooseUs: {
          features: [
            {
              title: 'Premium Quality',
              description: 'We use only the best materials and cutting-edge technology.',
              icon: '⭐',
            },
            {
              title: 'Fast Turnaround',
              description: 'Quick production times without compromising quality.',
              icon: '⚡',
            },
            {
              title: 'Expert Team',
              description: 'Experienced professionals dedicated to your success.',
              icon: '👥',
            },
            {
              title: 'Competitive Pricing',
              description: 'Affordable rates for exceptional quality and service.',
              icon: '💰',
            },
          ],
        },
      });
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update website settings
// @route   PUT /api/website/settings
// @access  Private/Admin
exports.updateWebsiteSettings = async (req, res) => {
  try {
    let settings = await WebsiteSettings.findOne();

    if (!settings) {
      settings = await WebsiteSettings.create({
        ...req.body,
        updatedBy: req.user.id,
      });
    } else {
      settings = await WebsiteSettings.findOneAndUpdate(
        {},
        {
          ...req.body,
          updatedBy: req.user.id,
        },
        {
          new: true,
          runValidators: true,
        }
      );
    }

    res.status(200).json({
      success: true,
      data: settings,
      message: 'Website settings updated successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add new service
// @route   POST /api/website/services
// @access  Private/Admin
exports.addService = async (req, res) => {
  try {
    const settings = await WebsiteSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Website settings not found',
      });
    }

    settings.services.push(req.body);
    await settings.save();

    res.status(201).json({
      success: true,
      data: settings.services,
      message: 'Service added successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update service
// @route   PUT /api/website/services/:id
// @access  Private/Admin
exports.updateService = async (req, res) => {
  try {
    const settings = await WebsiteSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Website settings not found',
      });
    }

    const service = settings.services.id(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    Object.assign(service, req.body);
    await settings.save();

    res.status(200).json({
      success: true,
      data: settings.services,
      message: 'Service updated successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete service
// @route   DELETE /api/website/services/:id
// @access  Private/Admin
exports.deleteService = async (req, res) => {
  try {
    const settings = await WebsiteSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Website settings not found',
      });
    }

    settings.services.pull(req.params.id);
    await settings.save();

    res.status(200).json({
      success: true,
      data: settings.services,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add portfolio item
// @route   POST /api/website/portfolio
// @access  Private/Admin
exports.addPortfolioItem = async (req, res) => {
  try {
    const settings = await WebsiteSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Website settings not found',
      });
    }

    settings.portfolio.items.push(req.body);
    await settings.save();

    res.status(201).json({
      success: true,
      data: settings.portfolio.items,
      message: 'Portfolio item added successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete portfolio item
// @route   DELETE /api/website/portfolio/:id
// @access  Private/Admin
exports.deletePortfolioItem = async (req, res) => {
  try {
    const settings = await WebsiteSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Website settings not found',
      });
    }

    settings.portfolio.items.pull(req.params.id);
    await settings.save();

    res.status(200).json({
      success: true,
      data: settings.portfolio.items,
      message: 'Portfolio item deleted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

