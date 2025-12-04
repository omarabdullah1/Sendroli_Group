const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Client = require('../models/Client');
const Order = require('../models/Order');

// Load env vars
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Client.deleteMany();
    await Order.deleteMany();

    console.log('Existing data cleared...');

    // Create users
    const users = await User.create([
      {
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        fullName: 'Admin User',
        email: 'admin@factory.com',
        isActive: true,
      },
      {
        username: 'receptionist',
        password: 'recep123',
        role: 'receptionist',
        fullName: 'Receptionist User',
        email: 'receptionist@factory.com',
        isActive: true,
      },
      {
        username: 'designer',
        password: 'design123',
        role: 'designer',
        fullName: 'Designer User',
        email: 'designer@factory.com',
        isActive: true,
      },
      {
        username: 'worker',
        password: 'worker123',
        role: 'worker',
        fullName: 'Worker User',
        email: 'worker@factory.com',
        isActive: true,
      },
      {
        username: 'financial',
        password: 'finance123',
        role: 'financial',
        fullName: 'Financial User',
        email: 'financial@factory.com',
        isActive: true,
      },
    ]);

    console.log('Users created...');

    // Create clients
    const clients = await Client.create([
      {
        name: 'Ahmed Mohamed',
        phone: '01234567890',
        factoryName: 'Ahmed Textiles Factory',
        address: 'Cairo, Egypt',
        notes: 'Premium client',
        createdBy: users[1]._id, // Receptionist
      },
      {
        name: 'Sara Hassan',
        phone: '01098765432',
        factoryName: 'Sara Fashion House',
        address: 'Alexandria, Egypt',
        notes: 'Regular orders',
        createdBy: users[1]._id,
      },
      {
        name: 'Mohamed Ali',
        phone: '01555444333',
        factoryName: 'Ali Manufacturing',
        address: 'Giza, Egypt',
        notes: 'Large volume orders',
        createdBy: users[1]._id,
      },
      {
        name: 'Fatima Ibrahim',
        phone: '01666777888',
        factoryName: 'Ibrahim Designs',
        address: 'Mansoura, Egypt',
        createdBy: users[1]._id,
      },
      {
        name: 'Omar Khaled',
        phone: '01777888999',
        factoryName: 'Khaled Prints',
        address: 'Tanta, Egypt',
        notes: 'Needs quality control',
        createdBy: users[1]._id,
      },
    ]);

    console.log('Clients created...');

    // Create orders
    const orders = await Order.create([
      {
        client: clients[0]._id,
        clientSnapshot: {
          name: clients[0].name,
          phone: clients[0].phone,
          factoryName: clients[0].factoryName,
        },
        repeats: 100,
        type: 'Business Cards',
        totalPrice: 5000,
        deposit: 2000,
        orderState: 'active',
        notes: 'Rush order',
        designLink: 'https://example.com/design/business-cards-v1',
        createdBy: users[0]._id,
      },
      {
        client: clients[1]._id,
        clientSnapshot: {
          name: clients[1].name,
          phone: clients[1].phone,
          factoryName: clients[1].factoryName,
        },
        repeats: 500,
        type: 'Brochures',
        totalPrice: 15000,
        deposit: 5000,
        orderState: 'pending',
        notes: 'Awaiting design approval',
        designLink: 'https://example.com/design/brochure-draft',
        createdBy: users[0]._id,
      },
      {
        client: clients[2]._id,
        clientSnapshot: {
          name: clients[2].name,
          phone: clients[2].phone,
          factoryName: clients[2].factoryName,
        },
        repeats: 1000,
        type: 'Posters',
        totalPrice: 25000,
        deposit: 25000,
        orderState: 'done',
        notes: 'Ready for pickup',
        designLink: 'https://example.com/design/poster-final',
        createdBy: users[0]._id,
      },
      {
        client: clients[3]._id,
        clientSnapshot: {
          name: clients[3].name,
          phone: clients[3].phone,
          factoryName: clients[3].factoryName,
        },
        repeats: 200,
        type: 'Flyers',
        totalPrice: 8000,
        deposit: 3000,
        orderState: 'delivered',
        notes: 'Delivered on time',
        createdBy: users[0]._id,
      },
      {
        client: clients[4]._id,
        clientSnapshot: {
          name: clients[4].name,
          phone: clients[4].phone,
          factoryName: clients[4].factoryName,
        },
        repeats: 300,
        type: 'Catalogs',
        totalPrice: 12000,
        deposit: 4000,
        orderState: 'active',
        notes: 'Color matching required',
        designLink: 'https://example.com/design/catalog-layout',
        createdBy: users[0]._id,
      },
    ]);

    console.log('Orders created...');
    console.log('\n=== Seed Data Summary ===');
    console.log(`Users created: ${users.length}`);
    console.log(`Clients created: ${clients.length}`);
    console.log(`Orders created: ${orders.length}`);
    console.log('\n=== Default Login Credentials ===');
    console.log('Admin: username=admin, password=admin123');
    console.log('Receptionist: username=receptionist, password=recep123');
    console.log('Designer: username=designer, password=design123');
    console.log('Worker: username=worker, password=worker123');
    console.log('Financial: username=financial, password=finance123');
    console.log('\n⚠️  Remember to change these passwords in production!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
