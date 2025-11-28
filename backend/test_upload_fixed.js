const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUploadWithCurrentSession() {
  try {
    // Try to find active token by connecting to MongoDB and getting it directly
    const mongoose = require('mongoose');
    require('dotenv').config();
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sendroli_factory');
    const User = require('./models/User');
    
    // Clear the session first to reset state
    console.log('1. Clearing admin session...');
    await User.findOneAndUpdate(
      { username: 'admin' },
      { 
        $unset: { activeToken: 1, sessionInfo: 1 } 
      }
    );
    console.log('✅ Session cleared');
    
    await mongoose.disconnect();
    
    // Now try to login fresh
    console.log('2. Logging in with fresh session...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data?.token || loginResponse.data.token;
    console.log('✅ Login successful, token obtained');
    
    // Create a simple test image file
    const testImagePath = path.join(__dirname, 'test-image.txt');
    fs.writeFileSync(testImagePath, 'This is a test file for upload');
    
    // Upload the test file
    console.log('3. Testing upload endpoint...');
    
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath), {
      filename: 'test-image.jpg',
      contentType: 'image/jpeg'
    });
    
    const uploadResponse = await axios.post('http://localhost:5000/api/website/upload', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Upload successful:', uploadResponse.data);
    
    // Clean up test file
    fs.unlinkSync(testImagePath);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testUploadWithCurrentSession();