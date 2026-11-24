// config/cloudinary.js
const cloudinary = require('cloudinary').v2;

// Log configuration status (without exposing secrets)
console.log('📸 Cloudinary Configuration:');
console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing'}`);
console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   API Secret: ${process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing'}`);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Test the configuration
const testCloudinaryConnection = async () => {
  try {
    // Just ping the API to check credentials
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    console.log('⚠️ Please check your Cloudinary credentials in .env file');
    return false;
  }
};

// Run test on startup
testCloudinaryConnection();

module.exports = cloudinary;