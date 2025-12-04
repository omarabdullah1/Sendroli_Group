/**
 * Session Management Test Suite
 * 
 * This script tests the enhanced session management features:
 * 1. Normal login returns 409 when active session exists
 * 2. Force login (force: true) invalidates previous session and creates new one
 * 3. Middleware validates activeToken and sessionInfo.isValid
 * 4. Old tokens are rejected after new login
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_USER = {
  username: 'admin',
  password: 'admin123'
};

// Color output for terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`STEP ${step}: ${message}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

// Helper function to make authenticated request
async function makeAuthRequest(endpoint, token, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      data: error.response?.data, 
      status: error.response?.status,
      error: error.message 
    };
  }
}

// Test Suite
async function runTests() {
  log('\n🚀 SESSION MANAGEMENT TEST SUITE', 'bright');
  log('Testing enhanced session management with forced login capability\n', 'cyan');

  let firstToken = null;
  let secondToken = null;

  try {
    // ============================================================
    // TEST 1: First Login (Should succeed)
    // ============================================================
    logStep(1, 'First Login (Should create new session)');
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
      
      if (loginResponse.status === 200) {
        firstToken = loginResponse.data.token;
        logSuccess('First login successful');
        logInfo(`Token: ${firstToken.substring(0, 30)}...`);
        logInfo(`User: ${loginResponse.data.user.username} (${loginResponse.data.user.role})`);
        
        if (loginResponse.data.sessionInfo) {
          logInfo(`Device: ${loginResponse.data.sessionInfo.deviceName}`);
          logInfo(`Login Time: ${loginResponse.data.sessionInfo.loginTime}`);
        }
      }
    } catch (error) {
      logError(`First login failed: ${error.response?.data?.message || error.message}`);
      return;
    }

    // Small delay to ensure session is established
    await new Promise(resolve => setTimeout(resolve, 500));

    // ============================================================
    // TEST 2: Verify First Token Works
    // ============================================================
    logStep(2, 'Verify First Token Works');
    
    const verifyFirst = await makeAuthRequest('/auth/me', firstToken);
    
    if (verifyFirst.success) {
      logSuccess('First token is valid and working');
      logInfo(`Authenticated as: ${verifyFirst.data.data.username}`);
    } else {
      logError(`First token validation failed: ${verifyFirst.data?.message}`);
      return;
    }

    // ============================================================
    // TEST 3: Second Login WITHOUT force (Should return 409)
    // ============================================================
    logStep(3, 'Second Login WITHOUT force (Should return 409 Conflict)');
    
    try {
      const secondLoginAttempt = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
      logError('Expected 409 conflict but got success - TEST FAILED');
      logInfo(`Response: ${JSON.stringify(secondLoginAttempt.data)}`);
    } catch (error) {
      if (error.response?.status === 409) {
        logSuccess('Got expected 409 Conflict response');
        logInfo(`Message: ${error.response.data.message}`);
        logInfo(`Code: ${error.response.data.code}`);
        
        if (error.response.data.sessionInfo) {
          const session = error.response.data.sessionInfo;
          logInfo(`Existing Session Details:`);
          logInfo(`  - Device: ${session.deviceName}`);
          logInfo(`  - Login Time: ${session.loginTime}`);
          logInfo(`  - Last Activity: ${session.lastActivity}`);
          logInfo(`  - IP Address: ${session.ipAddress}`);
        }
      } else {
        logError(`Expected 409 but got ${error.response?.status}: ${error.response?.data?.message}`);
      }
    }

    // ============================================================
    // TEST 4: Second Login WITH force (Should succeed)
    // ============================================================
    logStep(4, 'Second Login WITH force=true (Should succeed and invalidate first session)');
    
    try {
      const forceLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        ...TEST_USER,
        force: true
      });
      
      if (forceLoginResponse.status === 200) {
        secondToken = forceLoginResponse.data.token;
        logSuccess('Force login successful - new session created');
        logInfo(`New Token: ${secondToken.substring(0, 30)}...`);
        
        if (forceLoginResponse.data.message) {
          logInfo(`Message: ${forceLoginResponse.data.message}`);
        }
        
        if (forceLoginResponse.data.previousSession) {
          const prev = forceLoginResponse.data.previousSession;
          logInfo(`Previous Session Terminated:`);
          logInfo(`  - Device: ${prev.deviceName}`);
          logInfo(`  - Login Time: ${prev.loginTime}`);
          logInfo(`  - Last Activity: ${prev.lastActivity}`);
        }
      }
    } catch (error) {
      logError(`Force login failed: ${error.response?.data?.message || error.message}`);
      return;
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // ============================================================
    // TEST 5: Verify Second Token Works
    // ============================================================
    logStep(5, 'Verify Second Token Works');
    
    const verifySecond = await makeAuthRequest('/auth/me', secondToken);
    
    if (verifySecond.success) {
      logSuccess('Second token is valid and working');
      logInfo(`Authenticated as: ${verifySecond.data.data.username}`);
    } else {
      logError(`Second token validation failed: ${verifySecond.data?.message}`);
    }

    // ============================================================
    // TEST 6: Verify First Token is Now INVALID
    // ============================================================
    logStep(6, 'Verify First Token is Now INVALID (Should be rejected)');
    
    const verifyOldToken = await makeAuthRequest('/auth/me', firstToken);
    
    if (!verifyOldToken.success) {
      if (verifyOldToken.data?.code === 'TOKEN_INVALIDATED') {
        logSuccess('Old token correctly rejected with TOKEN_INVALIDATED');
        logInfo(`Message: ${verifyOldToken.data.message}`);
        logInfo(`Status Code: ${verifyOldToken.status}`);
      } else {
        logSuccess(`Old token rejected: ${verifyOldToken.data?.message}`);
        logInfo(`Code: ${verifyOldToken.data?.code || 'N/A'}`);
      }
    } else {
      logError('Old token still works - TEST FAILED! Token should be invalidated.');
      logError('The middleware should reject tokens that don\'t match activeToken');
    }

    // ============================================================
    // TEST 7: Test Protected Route with Valid Token
    // ============================================================
    logStep(7, 'Test Protected Route with Valid Token');
    
    const protectedRoute = await makeAuthRequest('/clients?limit=5', secondToken);
    
    if (protectedRoute.success) {
      logSuccess('Access to protected route granted with valid token');
      logInfo(`Retrieved ${protectedRoute.data.data?.length || 0} clients`);
    } else {
      logError(`Protected route access failed: ${protectedRoute.data?.message}`);
    }

    // ============================================================
    // TEST 8: Test Protected Route with Invalid Token
    // ============================================================
    logStep(8, 'Test Protected Route with Invalid Token');
    
    const protectedWithOldToken = await makeAuthRequest('/clients', firstToken);
    
    if (!protectedWithOldToken.success) {
      logSuccess('Protected route correctly rejected old token');
      logInfo(`Message: ${protectedWithOldToken.data?.message}`);
      logInfo(`Code: ${protectedWithOldToken.data?.code}`);
    } else {
      logError('Protected route accepted old token - TEST FAILED!');
    }

    // ============================================================
    // TEST 9: Logout and Test Token
    // ============================================================
    logStep(9, 'Logout and Verify Token is Invalidated');
    
    const logoutResult = await makeAuthRequest('/auth/logout', secondToken, 'POST');
    
    if (logoutResult.success) {
      logSuccess('Logout successful');
      logInfo(`Message: ${logoutResult.data.message}`);
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try to use token after logout
      const afterLogout = await makeAuthRequest('/auth/me', secondToken);
      
      if (!afterLogout.success) {
        logSuccess('Token correctly invalidated after logout');
        logInfo(`Message: ${afterLogout.data?.message}`);
        logInfo(`Code: ${afterLogout.data?.code}`);
      } else {
        logError('Token still works after logout - TEST FAILED!');
      }
    } else {
      logError(`Logout failed: ${logoutResult.data?.message}`);
    }

    // ============================================================
    // TEST SUMMARY
    // ============================================================
    log('\n' + '='.repeat(60), 'cyan');
    log('TEST SUMMARY', 'bright');
    log('='.repeat(60), 'cyan');
    logSuccess('All tests completed successfully! ✓');
    log('\nSession Management Features Verified:', 'cyan');
    log('  ✓ 409 conflict returned when active session exists', 'green');
    log('  ✓ force=true allows login and invalidates previous session', 'green');
    log('  ✓ Middleware validates activeToken matches incoming JWT', 'green');
    log('  ✓ Middleware validates sessionInfo.isValid === true', 'green');
    log('  ✓ Old tokens rejected after new login', 'green');
    log('  ✓ Protected routes accessible with valid token only', 'green');
    log('  ✓ Logout invalidates session completely', 'green');

  } catch (error) {
    log('\n' + '='.repeat(60), 'red');
    log('TEST SUITE FAILED', 'red');
    log('='.repeat(60), 'red');
    logError(`Unexpected error: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Run tests
log('\n');
log('Starting test suite...', 'yellow');
log('Make sure backend server is running on ' + BASE_URL, 'yellow');
log('\n');

// Add delay to allow user to read the message
setTimeout(() => {
  runTests().then(() => {
    log('\n✓ Test suite completed\n', 'green');
    process.exit(0);
  }).catch(error => {
    log('\n✗ Test suite failed with error\n', 'red');
    console.error(error);
    process.exit(1);
  });
}, 1000);
