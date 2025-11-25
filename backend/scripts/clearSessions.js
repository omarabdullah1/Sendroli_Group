const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../models/User');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

// Clear all user sessions
const clearAllSessions = async () => {
  try {
    console.log('🧹 Clearing all user sessions...');
    
    const result = await User.updateMany(
      {},
      {
        activeToken: null,
        sessionInfo: {
          ipAddress: null,
          userAgent: null,
          deviceFingerprint: null,
          loginTime: null,
          lastActivity: null,
          isValid: false,
        },
        deviceInfo: {
          userAgent: null,
          deviceName: null,
          loginTime: null,
          ipAddress: null,
        }
      }
    );
    
    console.log(`✅ Cleared sessions for ${result.modifiedCount} users`);
    console.log('🎯 All users can now login fresh without device conflicts');
    
  } catch (error) {
    console.error('❌ Error clearing sessions:', error.message);
  }
};

// Run the script
const main = async () => {
  await connectDB();
  await clearAllSessions();
  await mongoose.connection.close();
  console.log('🏁 Script completed, database connection closed');
  process.exit(0);
};

main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});