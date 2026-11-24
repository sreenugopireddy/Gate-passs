// config/emailjs.js
const emailjs = require('@emailjs/nodejs');

// Initialize EmailJS
const initEmailJS = () => {
  try {
    emailjs.init({
      publicKey: process.env.EMAILJS_PUBLIC_KEY,
      privateKey: process.env.EMAILJS_PRIVATE_KEY
    });
    console.log('✅ EmailJS initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ EmailJS initialization failed:', error.message);
    return false;
  }
};

// Send email using EmailJS
const sendEmailJS = async (templateParams) => {
  try {
    const response = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('❌ EmailJS send error:', error.message);
    return { success: false, error: error.message };
  }
};

// Send welcome email to student
const sendWelcomeEmailJS = async (student, password) => {
  const templateParams = {
    to_email: student.email,
    to_name: student.name,
    student_id: student.studentId || 'Not assigned',
    roll_number: student.rollNumber || student.studentId || 'Not assigned',
    department: student.department || 'Not assigned',
    year: student.year || '1',
    section: student.section || 'A',
    password: password,
    login_url: process.env.FRONTEND_URL || 'http://localhost:5173',
    current_year: new Date().getFullYear(),
    mobile: student.mobile || 'Not provided',
    parent_mobile: student.parentMobile || 'Not provided'
  };

  console.log(`📧 Sending welcome email to ${student.email}...`);
  const result = await sendEmailJS(templateParams);
  
  if (result.success) {
    console.log(`✅ Welcome email sent to ${student.email}`);
  } else {
    console.error(`❌ Failed to send email to ${student.email}:`, result.error);
  }
  
  return result;
};

// Send approval email
const sendApprovalEmailJS = async (student, passData) => {
  const templateParams = {
    to_email: student.email,
    to_name: student.name,
    pass_id: passData.passId,
    reason: passData.reason,
    destination: passData.destination,
    out_time: passData.outTime ? new Date(passData.outTime).toLocaleString() : 'Not specified',
    return_time: passData.expectedReturnTime ? new Date(passData.expectedReturnTime).toLocaleString() : 'Not specified',
    remarks: passData.approvalRemarks || 'No remarks',
    approval_date: new Date().toLocaleString(),
    status: 'Approved',
    login_url: process.env.FRONTEND_URL || 'http://localhost:5173'
  };

  console.log(`📧 Sending approval email to ${student.email}...`);
  const result = await sendEmailJS(templateParams);
  
  if (result.success) {
    console.log(`✅ Approval email sent to ${student.email}`);
  } else {
    console.error(`❌ Failed to send approval email to ${student.email}:`, result.error);
  }
  
  return result;
};

// Send rejection email
const sendRejectionEmailJS = async (student, passData) => {
  const templateParams = {
    to_email: student.email,
    to_name: student.name,
    pass_id: passData.passId,
    reason: passData.reason,
    remarks: passData.approvalRemarks || 'No reason provided',
    rejection_date: new Date().toLocaleString(),
    status: 'Rejected',
    login_url: process.env.FRONTEND_URL || 'http://localhost:5173'
  };

  console.log(`📧 Sending rejection email to ${student.email}...`);
  const result = await sendEmailJS(templateParams);
  
  if (result.success) {
    console.log(`✅ Rejection email sent to ${student.email}`);
  } else {
    console.error(`❌ Failed to send rejection email to ${student.email}:`, result.error);
  }
  
  return result;
};

module.exports = {
  initEmailJS,
  sendEmailJS,
  sendWelcomeEmailJS,
  sendApprovalEmailJS,
  sendRejectionEmailJS
};