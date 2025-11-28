const mongoose = require('mongoose');
const dotenv = require('dotenv');
const WebsiteSettings = require('../models/WebsiteSettings');

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedWebsiteSettings = async () => {
  try {
    await connectDB();

    // Check if settings already exist
    const existingSettings = await WebsiteSettings.findOne();
    
    if (existingSettings) {
      console.log('Website settings already exist. Skipping seed.');
      process.exit(0);
    }

    // Create default website settings
    const settings = await WebsiteSettings.create({
      hero: {
        title: 'Sendroli Group',
        tagline: 'Your Trusted Partner in Premium Printing Solutions',
        backgroundImage: '/assets/logo.jpg',
        ctaText: 'Get Started',
        ctaLink: '#contact',
      },
      about: {
        title: 'About Sendroli Group',
        description: 'Sendroli Group is a leading provider of innovative printing solutions, specializing in DTF, DTF UV, Vinyl, Laser Cutting, and Fabric Printing. With years of experience and cutting-edge technology, we deliver exceptional quality and service to our clients.',
        mission: 'To provide world-class printing solutions that exceed customer expectations through innovation, quality, and exceptional service.',
        vision: 'To be the most trusted and innovative name in the printing industry, setting new standards for excellence.',
      },
      services: [
        {
          title: 'DTF Printing',
          description: 'Direct to Film printing for vibrant, durable designs on various fabrics. Perfect for custom apparel and promotional items.',
          icon: '🖨️',
          image: '',
          isActive: true,
        },
        {
          title: 'DTF UV Printing',
          description: 'UV-cured Direct to Film printing for enhanced durability and color brilliance. Ideal for high-quality, long-lasting prints.',
          icon: '☀️',
          image: '',
          isActive: true,
        },
        {
          title: 'Vinyl Printing',
          description: 'High-quality vinyl printing for signage, decals, and custom graphics. Versatile and weather-resistant solutions.',
          icon: '📐',
          image: '',
          isActive: true,
        },
        {
          title: 'Laser Cutting',
          description: 'Precision laser cutting for intricate designs and custom shapes. Perfect for detailed work and custom fabrication.',
          icon: '✂️',
          image: '',
          isActive: true,
        },
        {
          title: 'Fabric Printing',
          description: 'Professional fabric printing for textiles, banners, and promotional materials. Vibrant colors and lasting quality.',
          icon: '🎨',
          image: '',
          isActive: true,
        },
      ],
      whyChooseUs: {
        title: 'Why Choose Sendroli Group',
        features: [
          {
            title: 'Premium Quality',
            description: 'We use only the best materials and cutting-edge technology to ensure superior results.',
            icon: '⭐',
            image: '',
          },
          {
            title: 'Fast Turnaround',
            description: 'Quick production times without compromising on quality. Your projects delivered on time.',
            icon: '⚡',
            image: '',
          },
          {
            title: 'Expert Team',
            description: 'Experienced professionals dedicated to bringing your vision to life with precision and care.',
            icon: '👥',
            image: '',
          },
          {
            title: 'Competitive Pricing',
            description: 'Affordable rates for exceptional quality and service. Great value for your investment.',
            icon: '💰',
            image: '',
          },
        ],
      },
      portfolio: {
        title: 'Our Portfolio',
        items: [],
      },
      contact: {
        phone: '+20 123 456 7890',
        whatsapp: '+20 123 456 7890',
        email: 'info@sendroligroup.com',
        address: 'Cairo, Egypt',
        qrCode: '',
        facebook: 'https://web.facebook.com/sendroligroup',
        instagram: '',
        linkedin: '',
      },
      seo: {
        metaTitle: 'Sendroli Group - Premium Printing Solutions in Egypt',
        metaDescription: 'Leading provider of DTF, DTF UV, Vinyl, Laser Cutting, and Fabric Printing services in Egypt. Quality printing solutions for your business.',
        keywords: [
          'DTF printing Egypt',
          'DTF UV printing',
          'Vinyl printing Cairo',
          'Laser cutting services',
          'Fabric printing Egypt',
          'Sendroli Group',
          'Custom printing solutions',
          'Professional printing services',
        ],
        ogImage: '/assets/logo.jpg',
      },
      branding: {
        primaryColor: '#000000',
        secondaryColor: '#FFFFFF',
        accentColor: '#00CED1',
        gradientStart: '#00CED1',
        gradientEnd: '#0099CC',
      },
      logo: {
        url: '/assets/logo.jpg',
        altText: 'Sendroli Group - Premium Printing Services',
      },
      isMaintenanceMode: false,
      maintenanceMessage: 'Website is under maintenance. Please check back later.',
    });

    console.log('✅ Website settings seeded successfully!');
    console.log('Settings ID:', settings._id);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding website settings:', error);
    process.exit(1);
  }
};

seedWebsiteSettings();

