const axios = require('axios');

// Test configuration
const API_BASE = 'http://localhost:5000/api';
const TEST_USER = {
  username: 'admin',
  password: 'admin123'
};

let authToken = '';

async function login() {
  try {
    console.log('🔑 Logging in...');
    const response = await axios.post(`${API_BASE}/auth/login`, TEST_USER);
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testCreateMaterial() {
  try {
    console.log('\n📝 Testing material creation...');
    const materialData = {
      name: 'Test Material With Selling Price',
      category: 'other',
      unit: 'piece',
      minStockLevel: 10,
      currentStock: 50,
      costPerUnit: 25.50,
      sellingPrice: 45.75,
      isOrderType: true,
      description: 'Test material for selling price validation'
    };
    
    console.log('Sending data:', materialData);
    
    const response = await axios.post(`${API_BASE}/materials`, materialData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Material created successfully');
    console.log('Material ID:', response.data.data._id);
    console.log('Selling Price saved:', response.data.data.sellingPrice);
    console.log('Is Order Type:', response.data.data.isOrderType);
    
    return response.data.data._id;
  } catch (error) {
    console.error('❌ Material creation failed:', error.response?.data?.message || error.message);
    if (error.response?.data?.errors) {
      console.error('Validation errors:', error.response.data.errors);
    }
    return null;
  }
}

async function testUpdateMaterial(materialId) {
  try {
    console.log('\n📝 Testing material update...');
    const updateData = {
      sellingPrice: 65.25,
      isOrderType: false,
      description: 'Updated material with new selling price'
    };
    
    console.log('Updating with data:', updateData);
    
    const response = await axios.put(`${API_BASE}/materials/${materialId}`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Material updated successfully');
    console.log('Updated Selling Price:', response.data.data.sellingPrice);
    console.log('Is Order Type:', response.data.data.isOrderType);
    
    return true;
  } catch (error) {
    console.error('❌ Material update failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetMaterial(materialId) {
  try {
    console.log('\n📖 Testing material retrieval...');
    
    const response = await axios.get(`${API_BASE}/materials/${materialId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Material retrieved successfully');
    console.log('Name:', response.data.data.name);
    console.log('Selling Price:', response.data.data.sellingPrice);
    console.log('Is Order Type:', response.data.data.isOrderType);
    
    return true;
  } catch (error) {
    console.error('❌ Material retrieval failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function cleanupMaterial(materialId) {
  try {
    console.log('\n🧹 Cleaning up test material...');
    
    await axios.delete(`${API_BASE}/materials/${materialId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Test material cleaned up');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.response?.data?.message || error.message);
  }
}

async function runTests() {
  console.log('🧪 Starting Material API Tests for Selling Price\n');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('Cannot proceed without login');
    process.exit(1);
  }
  
  // Test creation
  const materialId = await testCreateMaterial();
  if (!materialId) {
    console.error('Cannot proceed without creating material');
    process.exit(1);
  }
  
  // Test update
  await testUpdateMaterial(materialId);
  
  // Test retrieval
  await testGetMaterial(materialId);
  
  // Cleanup
  await cleanupMaterial(materialId);
  
  console.log('\n🎉 All tests completed!');
}

// Run tests
runTests().catch(console.error);