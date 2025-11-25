#!/usr/bin/env node

// Test script to verify material selling price functionality
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testMaterialSellingPrice() {
  console.log('🧪 Testing Material Selling Price API...\n');

  try {
    // Step 1: Login to get auth token
    console.log('1. Logging in to get auth token...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    const token = loginResponse.data.data.token || loginResponse.data.token;
    console.log('✅ Login successful');
    
    const axiosWithAuth = axios.create({
      baseURL: API_BASE,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 2: Create a material with selling price
    console.log('\n2. Creating material with selling price...');
    const testMaterial = {
      name: 'Test Material for Selling Price',
      category: 'other',
      unit: 'piece',
      minStockLevel: 10,
      currentStock: 50,
      costPerUnit: 15.50,
      sellingPrice: 25.75, // This should be saved
      isOrderType: true,
      description: 'Test material to verify selling price functionality'
    };

    console.log('Sending material data:', JSON.stringify(testMaterial, null, 2));

    const createResponse = await axiosWithAuth.post('/materials', testMaterial);
    
    if (!createResponse.data.success) {
      throw new Error('Material creation failed');
    }

    const createdMaterial = createResponse.data.data;
    console.log('✅ Material created successfully');
    console.log('Created material ID:', createdMaterial._id);
    console.log('Created material selling price:', createdMaterial.sellingPrice, '(Type:', typeof createdMaterial.sellingPrice, ')');

    // Step 3: Fetch the material to verify selling price was saved
    console.log('\n3. Fetching created material to verify selling price...');
    const fetchResponse = await axiosWithAuth.get(`/materials/${createdMaterial._id}`);
    
    const fetchedMaterial = fetchResponse.data.data;
    console.log('✅ Material fetched successfully');
    console.log('Fetched material selling price:', fetchedMaterial.sellingPrice, '(Type:', typeof fetchedMaterial.sellingPrice, ')');

    // Step 4: Update the material with a new selling price
    console.log('\n4. Updating material with new selling price...');
    const updatedData = {
      sellingPrice: 35.99
    };

    console.log('Sending update data:', JSON.stringify(updatedData, null, 2));

    const updateResponse = await axiosWithAuth.put(`/materials/${createdMaterial._id}`, updatedData);
    
    if (!updateResponse.data.success) {
      throw new Error('Material update failed');
    }

    const updatedMaterial = updateResponse.data.data;
    console.log('✅ Material updated successfully');
    console.log('Updated material selling price:', updatedMaterial.sellingPrice, '(Type:', typeof updatedMaterial.sellingPrice, ')');

    // Step 5: Verify the update by fetching again
    console.log('\n5. Fetching updated material to verify new selling price...');
    const finalFetchResponse = await axiosWithAuth.get(`/materials/${createdMaterial._id}`);
    
    const finalMaterial = finalFetchResponse.data.data;
    console.log('✅ Final material fetch successful');
    console.log('Final material selling price:', finalMaterial.sellingPrice, '(Type:', typeof finalMaterial.sellingPrice, ')');

    // Step 6: Clean up - delete the test material
    console.log('\n6. Cleaning up - deleting test material...');
    await axiosWithAuth.delete(`/materials/${createdMaterial._id}`);
    console.log('✅ Test material deleted');

    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log('================');
    console.log('Original selling price:', testMaterial.sellingPrice);
    console.log('Created with selling price:', createdMaterial.sellingPrice);
    console.log('Fetched selling price after creation:', fetchedMaterial.sellingPrice);
    console.log('Updated to selling price:', updatedData.sellingPrice);
    console.log('Final selling price after update:', finalMaterial.sellingPrice);

    // Check if there were any issues
    const issues = [];
    if (createdMaterial.sellingPrice !== testMaterial.sellingPrice) {
      issues.push(`❌ Creation issue: Expected ${testMaterial.sellingPrice}, got ${createdMaterial.sellingPrice}`);
    }
    if (fetchedMaterial.sellingPrice !== testMaterial.sellingPrice) {
      issues.push(`❌ Fetch after creation issue: Expected ${testMaterial.sellingPrice}, got ${fetchedMaterial.sellingPrice}`);
    }
    if (updatedMaterial.sellingPrice !== updatedData.sellingPrice) {
      issues.push(`❌ Update issue: Expected ${updatedData.sellingPrice}, got ${updatedMaterial.sellingPrice}`);
    }
    if (finalMaterial.sellingPrice !== updatedData.sellingPrice) {
      issues.push(`❌ Fetch after update issue: Expected ${updatedData.sellingPrice}, got ${finalMaterial.sellingPrice}`);
    }

    if (issues.length === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Selling price functionality is working correctly.');
    } else {
      console.log('\n🚨 ISSUES FOUND:');
      issues.forEach(issue => console.log(issue));
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Check if axios is available
try {
  require('axios');
  testMaterialSellingPrice();
} catch (error) {
  console.log('⚠️  axios not found. Installing it...');
  console.log('Please run: npm install axios');
  console.log('Then run this script again: node test_material_selling_price.js');
}