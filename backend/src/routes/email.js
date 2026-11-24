// routes/email.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../config/mailer');

// Test email connection
router.get('/test', protect, authorize('hod', 'admin'), async (req, res) => {
  try {
    const { initEmailJS } = require('../config/emailjs');
    const initialized = initEmailJS();
    
    res.json({ 
      success: initialized,
      message: initialized ? '✅ EmailJS is configured and ready' : '❌ EmailJS configuration failed',
      config: {
        serviceId: process.env.EMAILJS_SERVICE_ID ? 'Set' : 'Not Set',
        templateId: process.env.EMAILJS_TEMPLATE_ID ? 'Set' : 'Not Set',
        publicKey: process.env.EMAILJS_PUBLIC_KEY ? 'Set' : 'Not Set'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '❌ EmailJS test failed',
      error: error.message
    });
  }
});

// Send test email
router.post('/send-test', protect, authorize('hod', 'admin'), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const testStudent = {
      name: 'Test User',
      email: email,
      studentId: 'TEST001',
      department: 'Test Department',
      year: '1',
      section: 'A',
      mobile: '9876543210',
      parentMobile: '9876543211'
    };

    const result = await sendWelcomeEmail(testStudent, 'Test@123');
    
    res.json({
      success: result.success,
      message: result.success ? '✅ Test email sent successfully!' : '❌ Failed to send test email',
      error: result.error || null
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '❌ Failed to send test email',
      error: error.message
    });
  }
});

module.exports = router;