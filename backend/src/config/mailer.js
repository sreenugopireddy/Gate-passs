// config/mailer.js
const emailjs = require('@emailjs/nodejs');

// Initialize EmailJS
const initEmailJS = () => {
  try {
    // Check if credentials exist
    if (!process.env.EMAILJS_PUBLIC_KEY || !process.env.EMAILJS_PRIVATE_KEY) {
      console.error('❌ EmailJS credentials missing in .env file');
      console.log('   Please check: EMAILJS_PUBLIC_KEY and EMAILJS_PRIVATE_KEY');
      return false;
    }

    if (!process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_TEMPLATE_ID) {
      console.error('❌ EmailJS Service/Template ID missing in .env file');
      console.log('   Please check: EMAILJS_SERVICE_ID and EMAILJS_TEMPLATE_ID');
      return false;
    }

    emailjs.init({
      publicKey: process.env.EMAILJS_PUBLIC_KEY,
      privateKey: process.env.EMAILJS_PRIVATE_KEY
    });

    console.log('✅ EmailJS initialized successfully');
    console.log(`   Service ID: ${process.env.EMAILJS_SERVICE_ID}`);
    console.log(`   Template ID: ${process.env.EMAILJS_TEMPLATE_ID}`);
    return true;
  } catch (error) {
    console.error('❌ EmailJS initialization failed:', error.message);
    return false;
  }
};

// Send Welcome Email
const sendWelcomeEmail = async (student, password) => {
  try {
    // Check if student has email
    if (!student.email) {
      console.error('❌ Student email is missing');
      return { success: false, error: 'Student email is missing' };
    }

    // Prepare template parameters
    const templateParams = {
      to_email: student.email,
      to_name: student.name || 'Student',
      student_id: student.studentId || 'Not assigned',
      department: student.department || 'Not assigned',
      year: student.year || '1',
      section: student.section || 'A',
      password: password || 'N/A',
      login_url: process.env.FRONTEND_URL || 'http://localhost:5173',
      current_year: new Date().getFullYear()
    };

    console.log(`📧 Sending welcome email to: ${student.email}`);
    
    // Send email using EmailJS
    const response = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log(`✅ Welcome email sent to ${student.email}`);
    return { success: true, data: response };
    
  } catch (error) {
    console.error(`❌ Failed to send email to ${student.email}:`, error.message || error);
    
    // Log more details for debugging
    if (error.status) {
      console.error(`   HTTP Status: ${error.status}`);
    }
    if (error.text) {
      console.error(`   Error Text: ${error.text}`);
    }
    
    // ⭐ Don't fail the whole operation if email fails
    // Just log the error and return failure status
    return { 
      success: false, 
      error: error.message || 'Unknown error',
      status: error.status || null,
      text: error.text || null
    };
  }
};

// Send Test Email (for debugging)
const sendTestEmail = async (testEmail) => {
  try {
    const testStudent = {
      email: testEmail,
      name: 'Test User',
      studentId: 'TEST001',
      department: 'Test Department',
      year: '1',
      section: 'A'
    };
    
    const result = await sendWelcomeEmail(testStudent, 'Test@123');
    return result;
  } catch (error) {
    console.error('Test email failed:', error);
    return { success: false, error: error.message };
  }
};

// Verify email connection
const verifyEmailConnection = async () => {
  try {
    // Check if all required env variables are set
    const required = ['EMAILJS_PUBLIC_KEY', 'EMAILJS_PRIVATE_KEY', 'EMAILJS_SERVICE_ID', 'EMAILJS_TEMPLATE_ID'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error(`❌ Missing EmailJS environment variables: ${missing.join(', ')}`);
      return false;
    }

    console.log('✅ EmailJS configured successfully');
    console.log(`   Service ID: ${process.env.EMAILJS_SERVICE_ID}`);
    console.log(`   Template ID: ${process.env.EMAILJS_TEMPLATE_ID}`);
    return true;
  } catch (error) {
    console.error('Email verification failed:', error.message);
    return false;
  }
};

// Initialize on load
const initialized = initEmailJS();

module.exports = {
  initEmailJS,
  sendWelcomeEmail,
  sendTestEmail,
  verifyEmailConnection,
  initialized
};