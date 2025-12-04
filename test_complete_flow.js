/**
 * Complete Session Management Test
 * Tests the entire flow from login to dashboard data access
 */

const axios = require('axios');

const BACKEND_URL = 'https://backend-j5j55w1xg-oos-projects-e7124c64.vercel.app/api';

// Test credentials
const TEST_USER = {
  username: 'admin',
  password: 'admin123'
};

let firstToken = null;
let secondToken = null;

console.log('🧪 Starting Complete Flow Test\n');
console.log('================================================\n');

// Test 1: First Device Login (Should Succeed or get 409, then force login)
async function test1_firstLogin() {
  console.log('📱 Test 1: First Device Login');
  console.log('─────────────────────────────');
  
  try {
    const response = await axios.post(`${BACKEND_URL}/auth/login`, TEST_USER);
    
    if (response.data.success && response.data.token) {
      firstToken = response.data.token;
      console.log('✅ First login successful');
      console.log('📊 Response structure:');
      console.log('   - success:', response.data.success);
      console.log('   - token:', firstToken ? 'Present' : 'Missing');
      console.log('   - user:', response.data.user ? 'Present' : 'Missing');
      console.log('   - user.role:', response.data.user?.role || 'Missing');
      console.log('   - sessionInfo:', response.data.sessionInfo ? 'Present' : 'Missing');
      console.log('   - sessionVersion:', response.data.sessionInfo?.sessionVersion || 'N/A');
      return true;
    } else {
      console.log('❌ Login failed:', response.data);
      return false;
    }
  } catch (error) {
    // If there's already an active session, force login to clear it
    if (error.response?.status === 409 && error.response?.data?.code === 'ACTIVE_SESSION') {
      console.log('⚠️  Active session detected, forcing login to clear...');
      try {
        const forceResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
          ...TEST_USER,
          force: true
        });
        
        if (forceResponse.data.success && forceResponse.data.token) {
          firstToken = forceResponse.data.token;
          console.log('✅ Force login successful, session cleared');
          console.log('📊 Response structure:');
          console.log('   - user.role:', forceResponse.data.user?.role || 'Missing');
          return true;
        }
      } catch (forceError) {
        console.log('❌ Force login failed:', forceError.response?.data || forceError.message);
        return false;
      }
    }
    console.log('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Access Protected Endpoint with Valid Token
async function test2_accessDashboard() {
  console.log('\n🔒 Test 2: Access Protected Endpoint (Dashboard Data)');
  console.log('─────────────────────────────────────────────────────');
  
  if (!firstToken) {
    console.log('❌ No token from first login');
    return false;
  }
  
  try {
    // Try to get order stats (protected endpoint)
    const response = await axios.get(`${BACKEND_URL}/orders/stats/financial`, {
      headers: {
        'Authorization': `Bearer ${firstToken}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ Dashboard data accessed successfully');
      console.log('📊 Data retrieved:');
      console.log('   - Orders:', response.data.data?.overall?.totalOrders || 0);
      console.log('   - Revenue:', response.data.data?.overall?.totalRevenue || 0);
      return true;
    } else {
      console.log('❌ Failed to access dashboard data:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error accessing protected endpoint:', error.response?.data || error.message);
    console.log('   Status:', error.response?.status);
    console.log('   Message:', error.response?.data?.message);
    return false;
  }
}

// Test 3: Second Device Login (Should Get 409 Conflict)
async function test3_secondLogin() {
  console.log('\n📱 Test 3: Second Device Login (Expect 409 Conflict)');
  console.log('────────────────────────────────────────────────────');
  
  try {
    const response = await axios.post(`${BACKEND_URL}/auth/login`, TEST_USER);
    console.log('❌ Second login succeeded when it should have been blocked');
    console.log('   Response:', response.data);
    return false;
  } catch (error) {
    if (error.response?.status === 409 && error.response?.data?.code === 'ACTIVE_SESSION') {
      console.log('✅ Session conflict detected correctly (409)');
      console.log('📊 Session info received:');
      console.log('   - Code:', error.response.data.code);
      console.log('   - Message:', error.response.data.message);
      console.log('   - Device:', error.response.data.sessionInfo?.device);
      console.log('   - Last Active:', error.response.data.sessionInfo?.lastActive);
      console.log('   - Session Version:', error.response.data.sessionInfo?.sessionVersion);
      return true;
    } else {
      console.log('❌ Wrong error response:', error.response?.data);
      console.log('   Expected: 409 with ACTIVE_SESSION');
      console.log('   Got:', error.response?.status, error.response?.data?.code);
      return false;
    }
  }
}

// Test 4: Force Login from Second Device
async function test4_forceLogin() {
  console.log('\n💪 Test 4: Force Login from Second Device');
  console.log('──────────────────────────────────────────');
  
  try {
    const response = await axios.post(`${BACKEND_URL}/auth/login`, {
      ...TEST_USER,
      force: true
    });
    
    if (response.data.success && response.data.token) {
      secondToken = response.data.token;
      console.log('✅ Force login successful');
      console.log('📊 New session created:');
      console.log('   - New Token:', secondToken !== firstToken ? 'Different' : 'Same (ERROR!)');
      console.log('   - Message:', response.data.message);
      console.log('   - Session Version:', response.data.sessionInfo?.sessionVersion);
      return true;
    } else {
      console.log('❌ Force login failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error during force login:', error.response?.data || error.message);
    return false;
  }
}

// Test 5: First Device Token Should Be Invalid
async function test5_oldTokenInvalid() {
  console.log('\n🚫 Test 5: Old Token Should Be Rejected');
  console.log('────────────────────────────────────────');
  
  if (!firstToken) {
    console.log('❌ No old token to test');
    return false;
  }
  
  try {
    const response = await axios.get(`${BACKEND_URL}/orders/stats/financial`, {
      headers: {
        'Authorization': `Bearer ${firstToken}`
      }
    });
    
    console.log('❌ Old token still accepted (should be rejected)');
    console.log('   Response:', response.data);
    return false;
  } catch (error) {
    if (error.response?.status === 401 && 
        (error.response?.data?.code === 'TOKEN_INVALIDATED' || 
         error.response?.data?.code === 'INVALID_TOKEN')) {
      console.log('✅ Old token correctly rejected (401)');
      console.log('📊 Error details:');
      console.log('   - Code:', error.response.data.code);
      console.log('   - Message:', error.response.data.message);
      return true;
    } else {
      console.log('❌ Wrong error response:', error.response?.data);
      console.log('   Expected: 401 with TOKEN_INVALIDATED or INVALID_TOKEN');
      console.log('   Got:', error.response?.status, error.response?.data?.code);
      return false;
    }
  }
}

// Test 6: New Token Should Work
async function test6_newTokenWorks() {
  console.log('\n✅ Test 6: New Token Should Work');
  console.log('─────────────────────────────────');
  
  if (!secondToken) {
    console.log('❌ No new token to test');
    return false;
  }
  
  try {
    const response = await axios.get(`${BACKEND_URL}/orders/stats/financial`, {
      headers: {
        'Authorization': `Bearer ${secondToken}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ New token works correctly');
      console.log('📊 Successfully accessed protected data');
      return true;
    } else {
      console.log('❌ New token failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error with new token:', error.response?.data || error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  const tests = [
    { name: 'First Login', fn: test1_firstLogin },
    { name: 'Access Dashboard', fn: test2_accessDashboard },
    { name: 'Session Conflict', fn: test3_secondLogin },
    { name: 'Force Login', fn: test4_forceLogin },
    { name: 'Old Token Invalid', fn: test5_oldTokenInvalid },
    { name: 'New Token Works', fn: test6_newTokenWorks }
  ];
  
  for (const test of tests) {
    const result = await test.fn();
    results.tests.push({ name: test.name, passed: result });
    if (result) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  // Print summary
  console.log('\n\n================================================');
  console.log('📊 TEST SUMMARY');
  console.log('================================================\n');
  
  results.tests.forEach((test, index) => {
    const status = test.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${status} - ${test.name}`);
  });
  
  console.log('\n================================================');
  console.log(`Total: ${results.tests.length} tests`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log('================================================\n');
  
  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Session management is working correctly.\n');
  } else {
    console.log('⚠️  SOME TESTS FAILED. Please review the output above.\n');
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
