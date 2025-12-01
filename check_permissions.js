// Quick browser console script to check current user role
// Paste this in your browser console on the frontend app

console.log('🔍 Checking current user permissions...\n');

// Get token from localStorage
const token = localStorage.getItem('token');
if (!token) {
  console.log('❌ No token found in localStorage. Please login first.');
} else {
  console.log('✅ Token found in localStorage');
  
  // Decode JWT token (without verification, just to see the payload)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('📋 Token payload:', payload);
    
    // Make API call to check permissions
    fetch('https://backend-8xpbnpbsj-oos-projects-e7124c64.vercel.app/api/auth/debug/permissions', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log('\n🎯 Permission Analysis:');
      console.log(data);
      
      if (data.success) {
        const { currentUser, endpointAccess, requiredRoles } = data.data;
        
        console.log(`\n👤 Current User: ${currentUser.username} (${currentUser.role})`);
        console.log('\n📊 Endpoint Access:');
        
        Object.keys(endpointAccess).forEach(endpoint => {
          const hasAccess = endpointAccess[endpoint];
          const required = requiredRoles[endpoint];
          console.log(`  ${endpoint}: ${hasAccess ? '✅' : '❌'} (needs: ${required.join(' or ')})`);
        });
        
        // Specific guidance for material withdrawal
        if (!endpointAccess.materialWithdrawal) {
          console.log('\n⚠️  MATERIAL WITHDRAWAL ISSUE:');
          console.log(`   Your role: ${currentUser.role}`);
          console.log('   Required roles: admin or worker');
          console.log('   Solution: Ask an admin to change your role to "worker" or "admin"');
        }
      }
    })
    .catch(error => {
      console.error('❌ Error checking permissions:', error);
    });
    
  } catch (e) {
    console.log('❌ Error decoding token:', e);
  }
}

console.log('\n💡 Copy and paste this in your browser console while on the frontend app!');