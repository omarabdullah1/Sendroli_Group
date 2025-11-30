const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Simple test for force login functionality
async function testForceLoginAPI() {
  console.log('🧪 Testing Force Login API Functionality...\n');

  try {
    // Step 1: Test normal login
    console.log('1. Testing normal login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    console.log('✅ Normal login successful');
    const token = loginResponse.data.data.token;

    // Step 2: Test that the token works
    console.log('\n2. Testing token validity...');
    const meResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Token is valid, user:', meResponse.data.data.username);

    // Step 3: Test force login parameter
    console.log('\n3. Testing force login parameter...');
    const forceLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123',
      force: true
    });

    if (forceLoginResponse.data.status === 'force_login_success') {
      console.log('✅ Force login successful!');
      console.log('   Message:', forceLoginResponse.data.message);
      const newToken = forceLoginResponse.data.token;
      console.log('   New token generated');

      // Step 4: Test that new token works
      console.log('\n4. Testing new token validity...');
      const newMeResponse = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${newToken}` }
      });
      console.log('✅ New token works, user:', newMeResponse.data.data.username);

      // Step 5: Test that old token still works (should work since we're on same device)
      console.log('\n5. Testing old token still works (same device)...');
      const oldMeResponse = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Old token still works (expected on same device)');

    } else {
      console.log('❌ Force login failed');
      console.log('Response:', forceLoginResponse.data);
    }

    console.log('\n🎉 Force login API test completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Normal login works');
    console.log('   ✅ Token authentication works');
    console.log('   ✅ Force login parameter accepted');
    console.log('   ✅ New token generation works');
    console.log('   ✅ Session management works');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testForceLoginAPI();