const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Notification = require('./models/Notification');
const User = require('./models/User');

async function checkLatestInvoiceNotifications() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const invoiceId = '69349196599031a245a56bea'; // Latest invoice from previous check
    
    console.log('🔔 Finding notifications for invoice:', invoiceId);
    const notifications = await Notification.find({
      relatedId: invoiceId,
      relatedType: 'invoice'
    }).populate('user', 'username role');
    
    console.log(`\nFound ${notifications.length} notification(s):\n`);
    
    if (notifications.length === 0) {
      console.log('❌ NO NOTIFICATIONS FOUND FOR THIS INVOICE!');
      console.log('   This confirms notifications are NOT being created.\n');
    } else {
      notifications.forEach(n => {
        console.log(`- ${n.user?.username} (${n.user?.role})`);
        console.log(`  Title: ${n.title}`);
        console.log(`  Message: ${n.message}`);
        console.log(`  Read: ${n.isRead}`);
        console.log('');
      });
    }
    
    // Also check for ANY invoice notifications created recently
    console.log('🔍 Checking all notifications created in last 30 minutes...');
    const recentTime = new Date(Date.now() - 30 * 60 * 1000);
    const recentNotifications = await Notification.find({
      type: 'invoice',
      createdAt: { $gte: recentTime }
    }).populate('user', 'username role').sort({ createdAt: -1 });
    
    console.log(`\nFound ${recentNotifications.length} recent invoice notification(s):\n`);
    recentNotifications.forEach(n => {
      console.log(`- ${n.user?.username} (${n.user?.role}) - ${n.title}`);
      console.log(`  Invoice: ${n.relatedId}`);
      console.log(`  Created: ${n.createdAt}`);
      console.log('');
    });

    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkLatestInvoiceNotifications();
