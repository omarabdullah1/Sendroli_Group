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

    console.log('📤 Sending settings response');
    console.log('🖼️ Gallery in response:', settings.gallery);
    console.log('📊 Gallery items count:', settings.gallery?.items?.length || 0);

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
    console.log('📝 Update request received');
    console.log('🖼️ Gallery in request:', JSON.stringify(req.body.gallery, null, 2));
    console.log('📊 Gallery items in request:', req.body.gallery?.items?.length || 0);
    
    let settings = await WebsiteSettings.findOne();

    if (!settings) {
      console.log('🆕 Creating new settings document');
      settings = new WebsiteSettings({
        ...req.body,
        updatedBy: req.user.id,
      });
      await settings.save();
    } else {
      console.log('🔄 Updating existing settings document');
      console.log('📋 Current gallery in DB before update:', JSON.stringify(settings.gallery, null, 2));
      
      // Initialize gallery if it doesn't exist
      if (!settings.gallery) {
        console.log('🎨 Initializing gallery field');
        settings.gallery = {
          title: 'Our Gallery',
          items: []
        };
      }
      
      // Update all fields from request body
      Object.keys(req.body).forEach(key => {
        console.log(`🔧 Setting ${key}:`, typeof req.body[key]);
        settings[key] = req.body[key];
      });
      
      // Special handling for gallery to ensure it's properly saved
      if (req.body.gallery) {
        console.log('🔄 Explicitly setting gallery from request');
        console.log('🎯 Gallery data to set:', JSON.stringify(req.body.gallery, null, 2));
        
        // Clear existing gallery and set new one
        settings.gallery = undefined;
        settings.gallery = {
          title: req.body.gallery.title || 'Our Gallery',
          items: req.body.gallery.items || []
        };
        
        console.log('✅ Gallery set to:', JSON.stringify(settings.gallery, null, 2));
        settings.markModified('gallery');
        settings.markModified('gallery.items');
      }
      
      settings.updatedBy = req.user.id;
      
      // Save and immediately refetch to verify persistence
      await settings.save();
      console.log('💾 Document saved, refetching...');
      
      // Refetch to confirm save
      settings = await WebsiteSettings.findById(settings._id);
    }

    console.log('✅ Final document retrieved');
    console.log('🖼️ Gallery in final document:', JSON.stringify(settings.gallery, null, 2));
    console.log('📊 Final gallery items count:', settings.gallery?.items?.length || 0);

    // Convert to object and verify gallery is present
    const responseData = settings.toObject();
    console.log('📤 Response data gallery:', JSON.stringify(responseData.gallery, null, 2));
    console.log('📋 Response data keys:', Object.keys(responseData));
    
    // Double-check gallery presence
    if (!responseData.gallery) {
      console.error('❌ CRITICAL: Gallery missing from response data!');
      // Force include gallery in response
      responseData.gallery = settings.gallery || { title: 'Our Gallery', items: [] };
    }

    res.status(200).json({
      success: true,
      data: responseData,
      message: 'Website settings updated successfully',
    });
  } catch (error) {
    console.error('❌ Error in updateWebsiteSettings:', error);
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

// @desc    Add gallery item
// @route   POST /api/website/gallery
// @access  Private/Admin
exports.addGalleryItem = async (req, res) => {
  try {
    const settings = await WebsiteSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Website settings not found',
      });
    }

    settings.gallery.items.push(req.body);
    await settings.save();

    res.status(201).json({
      success: true,
      data: settings.gallery.items,
      message: 'Gallery item added successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete gallery item
// @route   DELETE /api/website/gallery/:id
// @access  Private/Admin
exports.deleteGalleryItem = async (req, res) => {
  try {
    const settings = await WebsiteSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Website settings not found',
      });
    }

    settings.gallery.items.pull(req.params.id);
    await settings.save();

    res.status(200).json({
      success: true,
      data: settings.gallery.items,
      message: 'Gallery item deleted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

