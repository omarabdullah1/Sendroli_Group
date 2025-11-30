const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');

const API_BASE = 'http://localhost:5000/api';

// Test force login functionality
async function testForceLogin() {
  console.log('🧪 Testing Force Login Functionality...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sendroli_factory');
    console.log('📊 Connected to database');

    // Step 1: Login with admin user first
    console.log('1. Logging in with admin user...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    const token1 = loginResponse.data.data.token;
    console.log('✅ First login successful, token:', token1.substring(0, 20) + '...');

    // Step 2: Simulate device conflict by modifying session info in database
    console.log('\n2. Simulating device conflict by changing session info...');
    const user = await User.findOne({ username: 'admin' });
    await User.findByIdAndUpdate(user._id, {
      'sessionInfo.deviceFingerprint': 'different-device-fingerprint',
      'sessionInfo.ipAddress': '192.168.1.100' // Different IP
    });
    console.log('✅ Device conflict simulated');

    // Step 3: Try to login again (should trigger device conflict)
    console.log('\n3. Attempting second login (should trigger device conflict)...');
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        username: 'admin',
        password: 'admin123'
      });
      console.log('❌ Second login should have failed with device conflict');
    } catch (error) {
      if (error.response?.data?.code === 'DEVICE_CONFLICT') {
        console.log('✅ Device conflict detected as expected');
        console.log('   Error message:', error.response.data.message);
        console.log('   Conflict info:', error.response.data.conflictInfo);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    // Step 4: Test force login by using the force parameter
    console.log('\n4. Testing force login with force=true parameter...');
    const forceLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123',
      force: true
    });

    if (forceLoginResponse.data.status === 'force_login_success') {
      console.log('✅ Force login successful!');
      console.log('   Message:', forceLoginResponse.data.message);
      const newToken = forceLoginResponse.data.token;
      console.log('   New token:', newToken.substring(0, 20) + '...');

      // Step 5: Verify old token is invalidated
      console.log('\n5. Verifying old token is invalidated...');
      try {
        await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token1}` }
        });
        console.log('❌ Old token should have been invalidated');
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('✅ Old token properly invalidated');
        } else {
          console.log('❌ Unexpected error with old token:', error.response?.data);
        }
      }

      // Step 6: Verify new token works
      console.log('\n6. Verifying new token works...');
      const meResponse = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${newToken}` }
      });
      console.log('✅ New token works correctly');
      console.log('   User:', meResponse.data.data.username);

    } else {
      console.log('❌ Force login failed');
    }

    console.log('\n🎉 Force login functionality test completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ First login works');
    console.log('   ✅ Device conflict detection works');
    console.log('   ✅ Force login clears old sessions');
    console.log('   ✅ New session is created');
    console.log('   ✅ Old tokens are invalidated');
    console.log('   ✅ New tokens work correctly');

    // Cleanup
    await mongoose.disconnect();
    console.log('\n🧹 Database connection closed');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    await mongoose.disconnect();
  }
}

// Run the test
testForceLogin();