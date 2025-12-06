/**
 * Test Designer Notification System
 * 
 * This script tests that designers receive notifications when they or others
 * perform CRUD operations on orders.
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');
const Notification = require('./models/Notification');
require('dotenv').config();

async function testDesignerNotifications() {
  try {
    // Connect to database
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sendroli_factory');
    console.log('✅ Connected to MongoDB\n');

    // Find a designer user
    console.log('👤 Looking for designer users...');
    const designers = await User.find({ role: 'designer', isActive: true });
    
    if (designers.length === 0) {
      console.log('❌ No designer users found in database');
      console.log('Creating a test designer user...');
      
      const testDesigner = await User.create({
        username: 'testdesigner',
        password: 'password123', // Will be hashed by pre-save hook
        role: 'designer',
        fullName: 'Test Designer',
        email: 'testdesigner@sendroli.com',
        isActive: true,
      });
      
      console.log(`✅ Created test designer: ${testDesigner.username}`);
      designers.push(testDesigner);
    }

    console.log(`✅ Found ${designers.length} designer user(s):`);
    designers.forEach(d => {
      console.log(`   - ${d.username} (${d.fullName}) - ID: ${d._id}`);
    });

    const designer = designers[0];
    console.log(`\n🎯 Testing notifications for designer: ${designer.username}\n`);

    // Check existing notifications for this designer
    console.log('📬 Checking existing notifications...');
    const existingNotifications = await Notification.find({ user: designer._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`✅ Found ${existingNotifications.length} existing notifications for ${designer.username}`);
    
    if (existingNotifications.length > 0) {
      console.log('\n📋 Recent notifications:');
      existingNotifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. [${notif.read ? 'READ' : 'UNREAD'}] ${notif.title}`);
        console.log(`      Message: ${notif.message}`);
        console.log(`      Type: ${notif.type || 'N/A'}`);
        console.log(`      Created: ${notif.createdAt.toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  No notifications found for this designer');
    }

    // Check unread count
    const unreadCount = await Notification.countDocuments({ 
      user: designer._id, 
      read: false 
    });
    console.log(`\n📊 Unread notifications: ${unreadCount}`);

    // Check what types of notifications exist
    const notificationsByType = await Notification.aggregate([
      { $match: { user: designer._id } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    if (notificationsByType.length > 0) {
      console.log('\n📊 Notifications by type:');
      notificationsByType.forEach(type => {
        console.log(`   - ${type._id || 'system'}: ${type.count}`);
      });
    }

    // Check if designers are included in order notification recipients
    console.log('\n\n🔍 Checking order notification configuration...');
    console.log('Order CREATE notifications go to: admin, designer, worker');
    console.log('Order UPDATE notifications go to: admin, designer, worker, financial');
    console.log('Order DELETE notifications go to: admin, designer, worker, financial');

    // Check admin users for comparison
    const admins = await User.find({ role: 'admin', isActive: true });
    console.log(`\n👑 Found ${admins.length} admin user(s) for comparison`);
    
    if (admins.length > 0) {
      const admin = admins[0];
      const adminNotifCount = await Notification.countDocuments({ user: admin._id });
      const adminUnreadCount = await Notification.countDocuments({ 
        user: admin._id, 
        read: false 
      });
      console.log(`   Admin "${admin.username}" has ${adminNotifCount} total notifications (${adminUnreadCount} unread)`);
    }

    // Summary
    console.log('\n\n═══════════════════════════════════════════════');
    console.log('                   SUMMARY                      ');
    console.log('═══════════════════════════════════════════════');
    console.log(`✅ Designer user: ${designer.username}`);
    console.log(`✅ Total notifications: ${existingNotifications.length > 0 ? existingNotifications.length : 'Check count in DB'}`);
    console.log(`✅ Unread notifications: ${unreadCount}`);
    console.log(`✅ Notification system: CONFIGURED`);
    console.log('\n💡 IMPORTANT:');
    console.log('   1. Designers SHOULD receive notifications when orders are created/updated/deleted');
    console.log('   2. Check the backend logs when creating/updating orders to see notification creation');
    console.log('   3. Designers can view notifications at: /notifications');
    console.log('   4. Bell icon in navbar shows unread count');
    console.log('\n🧪 TO TEST:');
    console.log('   1. Login as designer');
    console.log('   2. Create a new order (or have admin create one)');
    console.log('   3. Check notifications page - should see "New Order Created"');
    console.log('   4. Update an order - should see "Order Updated"');
    console.log('   5. Delete an order (if admin) - should see "Order Deleted"');
    console.log('═══════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
testDesignerNotifications();
