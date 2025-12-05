const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const User = require('./models/User');
const Invoice = require('./models/Invoice');
const Client = require('./models/Client');
const Notification = require('./models/Notification');

async function testInvoiceNotification() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sendroli_factory', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to database');

    // Find users who should receive notifications
    const financialUsers = await User.find({
      role: { $in: ['financial', 'admin'] },
      isActive: true,
    }).select('_id username role');

    console.log('\n📊 Users who should receive invoice notifications:');
    financialUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.role})`);
    });

    // Find the most recent invoice
    const recentInvoice = await Invoice.findOne()
      .sort({ createdAt: -1 })
      .populate('client', 'name')
      .populate('createdBy', 'username');

    if (recentInvoice) {
      console.log('\n📄 Most recent invoice:');
      console.log(`  - ID: ${recentInvoice._id}`);
      console.log(`  - Client: ${recentInvoice.client?.name || 'N/A'}`);
      console.log(`  - Created by: ${recentInvoice.createdBy?.username || 'N/A'}`);
      console.log(`  - Created at: ${recentInvoice.createdAt}`);

      // Check for notifications related to this invoice
      const notifications = await Notification.find({
        relatedId: recentInvoice._id,
        relatedType: 'invoice',
      }).populate('user', 'username role');

      console.log('\n🔔 Notifications for this invoice:');
      if (notifications.length === 0) {
        console.log('  ❌ No notifications found!');
      } else {
        notifications.forEach(notif => {
          console.log(`  - To: ${notif.user?.username} (${notif.user?.role})`);
          console.log(`    Title: ${notif.title}`);
          console.log(`    Message: ${notif.message}`);
          console.log(`    Read: ${notif.read}`);
          console.log(`    Icon: ${notif.icon || 'N/A'}`);
        });
      }
    } else {
      console.log('\n❌ No invoices found in database');
    }

    // Check all invoice-related notifications
    const allInvoiceNotifications = await Notification.find({
      type: 'invoice',
    }).populate('user', 'username role').sort({ createdAt: -1 }).limit(10);

    console.log('\n🔔 All recent invoice notifications:');
    if (allInvoiceNotifications.length === 0) {
      console.log('  ❌ No invoice notifications found!');
    } else {
      allInvoiceNotifications.forEach(notif => {
        console.log(`  - To: ${notif.user?.username} (${notif.user?.role})`);
        console.log(`    Title: ${notif.title}`);
        console.log(`    Created: ${notif.createdAt}`);
        console.log(`    Related ID: ${notif.relatedId}`);
      });
    }

    console.log('\n✅ Test completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testInvoiceNotification();
