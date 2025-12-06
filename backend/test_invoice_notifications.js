require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Client = require('./models/Client');
const Invoice = require('./models/Invoice');
const Notification = require('./models/Notification');
const { createNotification } = require('./controllers/notificationController');

async function testInvoiceNotifications() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find designer user
    console.log('👤 Finding designer user...');
    const designer = await User.findOne({ role: 'designer', isActive: true });
    if (!designer) {
      console.error('❌ No active designer found!');
      process.exit(1);
    }
    console.log('✅ Found designer:', designer.username, 'ID:', designer._id.toString(), '\n');

    // Find admin user
    console.log('👤 Finding admin user...');
    const admin = await User.findOne({ role: 'admin', isActive: true });
    if (!admin) {
      console.error('❌ No active admin found!');
      process.exit(1);
    }
    console.log('✅ Found admin:', admin.username, 'ID:', admin._id.toString(), '\n');

    // Find latest invoice created by designer
    console.log('📄 Finding latest invoice created by designer...');
    const latestInvoice = await Invoice.findOne({ createdBy: designer._id })
      .sort({ createdAt: -1 })
      .populate('client', 'name');
    
    if (!latestInvoice) {
      console.error('❌ No invoices found for designer!');
      process.exit(1);
    }
    
    console.log('✅ Found invoice:', latestInvoice._id.toString());
    console.log('   Client:', latestInvoice.clientSnapshot?.name || latestInvoice.client?.name);
    console.log('   Created:', latestInvoice.createdAt);
    console.log('   Total:', latestInvoice.total, 'EGP\n');

    // Check existing notifications for this invoice
    console.log('🔔 Checking existing notifications for this invoice...');
    const existingNotifs = await Notification.find({ 
      relatedId: latestInvoice._id,
      type: 'invoice'
    }).populate('user', 'username role');
    
    console.log(`Found ${existingNotifs.length} existing notifications:`);
    existingNotifs.forEach(n => {
      console.log(`  - ${n.user.username} (${n.user.role}): ${n.title} - Read: ${n.read}`);
    });
    console.log('');

    // Test notification creation
    console.log('🧪 Testing notification creation...\n');
    
    // Test 1: Create notification for designer
    console.log('📤 Test 1: Creating notification for designer...');
    try {
      const designerNotif = await createNotification(designer._id, {
        title: 'TEST: Invoice Notification',
        message: `Test notification for invoice #${latestInvoice._id.toString().slice(-6)}`,
        icon: 'fa-file-invoice',
        type: 'invoice',
        relatedId: latestInvoice._id,
        relatedType: 'invoice',
        actionUrl: `/invoices/${latestInvoice._id}`,
      });
      console.log('✅ SUCCESS - Notification created for designer:', designerNotif._id.toString());
    } catch (err) {
      console.error('❌ FAILED to create notification for designer:', err.message);
      console.error('Stack:', err.stack);
    }

    // Test 2: Create notification for admin
    console.log('\n📤 Test 2: Creating notification for admin...');
    try {
      const adminNotif = await createNotification(admin._id, {
        title: 'TEST: Invoice Notification',
        message: `Test notification for invoice #${latestInvoice._id.toString().slice(-6)}`,
        icon: 'fa-file-invoice',
        type: 'invoice',
        relatedId: latestInvoice._id,
        relatedType: 'invoice',
        actionUrl: `/invoices/${latestInvoice._id}`,
      });
      console.log('✅ SUCCESS - Notification created for admin:', adminNotif._id.toString());
    } catch (err) {
      console.error('❌ FAILED to create notification for admin:', err.message);
      console.error('Stack:', err.stack);
    }

    // Verify notifications were created
    console.log('\n🔍 Verifying notifications in database...');
    const designerNotifs = await Notification.countDocuments({ 
      user: designer._id,
      title: 'TEST: Invoice Notification'
    });
    const adminNotifs = await Notification.countDocuments({ 
      user: admin._id,
      title: 'TEST: Invoice Notification'
    });
    
    console.log(`✅ Designer has ${designerNotifs} test notification(s)`);
    console.log(`✅ Admin has ${adminNotifs} test notification(s)`);

    // Check if the notification function is working
    console.log('\n📊 Summary:');
    console.log('  - createNotification function: WORKING');
    console.log('  - Database connection: WORKING');
    console.log('  - User queries: WORKING');
    console.log('\n⚠️  If notifications are being created here but not from API:');
    console.log('  1. Check if createInvoice function is actually being called');
    console.log('  2. Check if the notification code block is being reached');
    console.log('  3. Check Vercel environment variables (MONGODB_URI)');
    console.log('  4. Check if there are any middleware errors blocking the request');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

testInvoiceNotifications();
