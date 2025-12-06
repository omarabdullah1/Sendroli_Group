const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');

async function checkDesignerStatus() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('👤 Finding designer user...');
    const designer = await User.findOne({ role: 'designer' });
    
    if (!designer) {
      console.log('❌ No designer user found');
      process.exit(1);
    }

    console.log('✅ Found designer:', designer.username);
    console.log('   ID:', designer._id.toString());
    console.log('   Role:', designer.role);
    console.log('   isActive:', designer.isActive);
    console.log('   Email:', designer.email);
    console.log('   Full Name:', designer.fullName);
    console.log('');

    // Test query with isActive: true
    console.log('🔍 Testing query: User.find({ role: "designer", isActive: true })');
    const activeDesigners = await User.find({ role: 'designer', isActive: true });
    console.log(`   Found ${activeDesigners.length} active designer(s)`);
    activeDesigners.forEach(d => {
      console.log(`   - ${d.username} (ID: ${d._id.toString()})`);
    });
    console.log('');

    // Test query with role: { $in: ['designer', 'admin'] }, isActive: true
    console.log('🔍 Testing query: User.find({ role: { $in: ["designer", "admin"] }, isActive: true })');
    const designersAndAdmins = await User.find({ 
      role: { $in: ['designer', 'admin'] }, 
      isActive: true 
    });
    console.log(`   Found ${designersAndAdmins.length} user(s)`);
    designersAndAdmins.forEach(u => {
      console.log(`   - ${u.username} (${u.role}) - ID: ${u._id.toString()}`);
    });
    console.log('');

    // Check if designer is in the results
    const designerInResults = designersAndAdmins.some(u => u._id.toString() === designer._id.toString());
    if (designerInResults) {
      console.log('✅ Designer IS included in query results');
    } else {
      console.log('❌ Designer IS NOT included in query results');
      console.log('   This explains why notifications are not being created!');
    }

    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDesignerStatus();
