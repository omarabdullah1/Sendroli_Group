const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://omarabdullah:0120532094@sendr.klm8j.mongodb.net/sendroli_factory?retryWrites=true&w=majority&appName=Sendr';

async function testNotification() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const Notification = mongoose.model('Notification');
    
    // Try to create a test notification directly
    const testNotif = await Notification.create({
      user: '692c3e247095d4fb773ff266',
      title: 'TEST Daily Inventory Count',
      message: 'This is a manual test notification',
      icon: 'fa-clipboard-check',
      type: 'inventory',
      relatedId: null,
      relatedType: 'inventory',
      actionUrl: '/inventory'
    });
    
    console.log('Test notification created:', testNotif._id);
    
    await mongoose.connection.close();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  }
}

testNotification();
