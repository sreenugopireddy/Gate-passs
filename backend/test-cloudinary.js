// test-cloudinary.js
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

console.log('📸 Testing Cloudinary Configuration...\n');

// Log credentials (partial for security)
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function testCloudinary() {
  try {
    // Test 1: Ping the API
    console.log('\n🔍 Testing API connection...');
    const pingResult = await cloudinary.api.ping();
    console.log('✅ API connection successful!');
    
    // Test 2: Try to upload a sample image
    console.log('\n📤 Testing upload...');
    const result = await cloudinary.uploader.upload(
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      { 
        folder: 'test',
        public_id: 'test-upload'
      }
    );
    console.log('✅ Upload successful!');
    console.log('📸 URL:', result.secure_url);
    console.log('📝 Public ID:', result.public_id);
    
    // Test 3: Delete test image
    console.log('\n🗑️ Cleaning up...');
    await cloudinary.uploader.destroy('test/test-upload');
    console.log('✅ Cleanup complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('HTTP Code:', error.http_code);
    
    if (error.http_code === 403) {
      console.log('\n⚠️ 403 Error means:');
      console.log('1. Your Cloudinary credentials are invalid');
      console.log('2. Your API key or secret is wrong');
      console.log('3. Your account might be inactive');
      console.log('\n🔧 Solutions:');
      console.log('1. Go to Cloudinary Dashboard → Account → API Keys');
      console.log('2. Check your cloud_name, api_key, and api_secret');
      console.log('3. Try regenerating your API key');
      console.log('4. Make sure your account is active');
    }
  }
}

testCloudinary();