const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Invoice = require('./models/Invoice');
const User = require('./models/User');

async function checkInvoiceCreator() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📄 Finding latest invoices...');
    const latestInvoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('createdBy', 'username role')
      .select('invoiceNumber total createdBy createdAt');
    
    console.log('Latest 10 invoices:\n');
    for (const invoice of latestInvoices) {
      console.log(`Invoice: ${invoice._id.toString()}`);
      console.log(`   Number: ${invoice.invoiceNumber || 'N/A'}`);
      console.log(`   Total: ${invoice.total} EGP`);
      console.log(`   Created by: ${invoice.createdBy?.username} (${invoice.createdBy?.role})`);
      console.log(`   Created at: ${invoice.createdAt}`);
      console.log('');
    }

    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkInvoiceCreator();
