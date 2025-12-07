const axios = require('axios');

// Test user role and permissions
async function testUserRole() {
  try {
    const API_BASE = 'https://backend-8xpbnpbsj-oos-projects-e7124c64.vercel.app/api';
    
    // Get token from localStorage or prompt for it
    const token = process.argv[2];
    
    if (!token) {
      console.log('❌ Please provide a JWT token as argument:');
      console.log('node test_user_role.js "your-jwt-token-here"');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('🔍 Testing user permissions...\n');

    // Test current user info
    try {
      const userResponse = await axios.get(`${API_BASE}/auth/me`, { headers });
      console.log('✅ Current User:', {
        username: userResponse.data.user.username,
        role: userResponse.data.user.role,
        fullName: userResponse.data.user.fullName,
        isActive: userResponse.data.user.isActive
      });
      
      const userRole = userResponse.data.user.role;
      console.log(`\n📋 Role: ${userRole.toUpperCase()}\n`);
      
      // Test specific endpoints based on role
      const tests = [
        {
          name: 'Material Withdrawal',
          url: `${API_BASE}/inventory/withdrawals`,
          requiredRoles: ['admin', 'worker'],
          hasAccess: ['admin', 'worker'].includes(userRole)
        },
        {
          name: 'Financial Stats', 
          url: `${API_BASE}/orders/stats/financial`,
          requiredRoles: ['financial', 'admin'],
          hasAccess: ['financial', 'admin'].includes(userRole)
        },
        {
          name: 'Orders (General)',
          url: `${API_BASE}/orders`,
          requiredRoles: ['designer', 'worker', 'financial', 'admin'],
          hasAccess: ['designer', 'worker', 'financial', 'admin'].includes(userRole)
        }
      ];

      for (const test of tests) {
        console.log(`🧪 Testing: ${test.name}`);
        console.log(`   Required roles: ${test.requiredRoles.join(', ')}`);
        console.log(`   Your access: ${test.hasAccess ? '✅ YES' : '❌ NO'}`);
        
        if (!test.hasAccess) {
          console.log(`   ⚠️  You need one of these roles: ${test.requiredRoles.join(', ')}`);
        }
        console.log('');
      }
      
    } catch (error) {
      console.log('❌ Error getting user info:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testUserRole();