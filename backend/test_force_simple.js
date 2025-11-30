const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testForceLogin() {
  try {
    console.log('Testing force login functionality...');
    
    // First, logout to clear any existing session
    try {
      await axios.post(`${API_BASE}/auth/logout`, {}, {
        headers: { Authorization: 'Bearer dummy' }
      });
    } catch (e) {
      // Ignore logout errors
    }
    
    // Login with force to clear any existing session
    console.log('1. Force login to clear existing session...');
    const login1 = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123',
      force: true
    });
    console.log('Force login result:', login1.data.status === 'force_login_success' ? 'SUCCESS' : 'FAILED');
    
    // Try login again (should work with warning)
    console.log('2. Second login (same device)...');
    const login2 = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    console.log('Second login result:', login2.data.success ? 'SUCCESS' : 'FAILED');
    console.log('Has warning:', !!login2.data.data?.warning);
    
    // Test force login
    console.log('3. Force login...');
    const forceLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123',
      force: true
    });
    console.log('Force login result:', forceLogin.data.status === 'force_login_success' ? 'SUCCESS' : 'FAILED');
    
    console.log('All tests completed!');
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testForceLogin();
