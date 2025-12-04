const mongoose = require('mongoose');

const websiteSettingsSchema = new mongoose.Schema(
  {
    // Hero Section
    hero: {
      title: {
        type: String,
        default: 'Sendroli Group',
      },
      tagline: {
        type: String,
        default: 'Your Trusted Partner in Premium Printing Solutions',
      },
      backgroundImage: {
        type: String,
        default: '/assets/hero-bg.jpg',
      },
      ctaText: {
        type: String,
        default: 'Get Started',
      },
      ctaLink: {
        type: String,
        default: '/contact',
      },
    },

    // About Section
    about: {
      title: {
        type: String,
        default: 'About Sendroli Group',
      },
      description: {
        type: String,
        default: 'Sendroli Group is a leading provider of innovative printing solutions, specializing in DTF, DTF UV, Vinyl, Laser Cutting, and Fabric Printing. With years of experience and cutting-edge technology, we deliver exceptional quality and service to our clients.',
      },
      mission: {
        type: String,
        default: 'To provide world-class printing solutions that exceed customer expectations.',
      },
      vision: {
        type: String,
        default: 'To be the most trusted name in the printing industry.',
      },
    },

    // Services
    services: [
      {
        title: String,
        description: String,
        icon: String,
        image: String,
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // Why Choose Us
    whyChooseUs: {
      title: {
        type: String,
        default: 'Why Choose Us',
      },
      features: [
        {
          title: String,
          description: String,
          icon: String,
          image: String,
        },
      ],
    },

    // Gallery
    gallery: {
      title: {
        type: String,
        default: 'Our Gallery',
      },
      items: [
        {
          title: String,
          description: String,
          image: String,
          category: String,
        },
      ],
    },

    // Contact Information
    contact: {
      phone: {
        type: String,
        default: '+20 123 456 7890',
      },
      whatsapp: {
        type: String,
        default: '+20 123 456 7890',
      },
      email: {
        type: String,
        default: 'info@sendroligroup.com',
      },
      address: {
        type: String,
        default: 'Cairo, Egypt',
      },
      // Map Configuration
      mapEmbedUrl: {
        type: String,
        default: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d220790.48587489217!2d31.04534893359375!3d30.064742000000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14583fa60b21beeb%3A0x79dfb296e8423bba!2sCairo%2C%20Egypt!5e0!3m2!1sen!2sus!4v1701234567890!5m2!1sen!2sus',
        description: 'Google Maps embed URL for the company location. Get from Google Maps -> Share -> Embed a map',
      },
      mapLocation: {
        type: String,
        default: 'Cairo, Egypt',
        description: 'Location name displayed above the map',
      },
      qrCode: {
        type: String,
        default: '',
      },
      facebook: {
        type: String,
        default: 'https://web.facebook.com/sendroligroup',
      },
      instagram: {
        type: String,
        default: '',
      },
      linkedin: {
        type: String,
        default: '',
      },
    },

    // SEO Settings
    seo: {
      metaTitle: {
        type: String,
        default: 'Sendroli Group - Premium Printing Solutions',
      },
      metaDescription: {
        type: String,
        default: 'Leading provider of DTF, DTF UV, Vinyl, Laser Cutting, and Fabric Printing services.',
      },
      keywords: {
        type: [String],
        default: ['DTF printing', 'DTF UV', 'Vinyl printing', 'Laser cutting', 'Fabric printing', 'Sendroli Group'],
      },
      ogImage: {
        type: String,
        default: '/assets/logo.jpg',
      },
    },

    // Brand Colors
    branding: {
      primaryColor: {
        type: String,
        default: '#000000',
      },
      secondaryColor: {
        type: String,
        default: '#FFFFFF',
      },
      accentColor: {
        type: String,
        default: '#00CED1',
      },
      gradientStart: {
        type: String,
        default: '#00CED1',
      },
      gradientEnd: {
        type: String,
        default: '#0099CC',
      },
    },

    // Logo
    logo: {
      url: {
        type: String,
        default: '/assets/logo.jpg',
      },
      altText: {
        type: String,
        default: 'Sendroli Group Logo',
      },
    },

    // General Settings
    isMaintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: 'Website is under maintenance. Please check back later.',
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WebsiteSettings', websiteSettingsSchema);

