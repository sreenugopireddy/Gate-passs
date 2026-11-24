// controllers/hodController.js - Complete file (No approval/rejection emails)

const fs = require('fs');
const GatePassRequest = require('../models/GatePassRequest');
const User = require('../models/User');
const { generateQrToken } = require('../utils/qrUtil');
const ExcelJS = require('exceljs');
const { sendWelcomeEmail, verifyEmailConnection } = require('../config/mailer');
const { log } = require('../middleware/audit');
const { generateGatePassPDFBuffer } = require('../utils/pdfUtil');

// Verify email on startup
verifyEmailConnection();

// ==================== UTILITY FUNCTIONS ====================

const generateDefaultPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password + 'A1!';
};

// ==================== REQUEST MANAGEMENT ====================

// Get pending requests for HOD's department
exports.getPending = async (req, res) => {
  try {
    const department = req.user.department;
    const pending = await GatePassRequest.find({ status: 'pending', department })
      .populate('student', '-password')
      .sort({ emergency: -1, createdAt: 1 });
    res.json({ pending });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve a gate pass request - NO EMAIL
exports.approveRequest = async (req, res) => {
  try {
    const gp = await GatePassRequest.findById(req.params.id).populate('student');
    if (!gp) return res.status(404).json({ message: 'Not found' });
    if (gp.status !== 'pending') return res.status(400).json({ message: 'Request not pending' });

    gp.status = 'approved';
    gp.approvalBy = req.user._id;
    gp.approvalAt = new Date();
    gp.approvalRemarks = req.body.remarks || '';

    if (req.user.signatureUrl) {
      gp.approvalSignatureUrl = req.user.signatureUrl;
    }

    const expiry = new Date(gp.expectedReturnTime).getTime();
    gp.qrPayload = generateQrToken({ 
      passId: gp.passId, 
      studentId: gp.student.studentId || gp.student._id, 
      expiry 
    });

    await gp.save();
    
    // ⭐ NO EMAIL SENT - Only socket notification
    try {
      const io = req.app.get('io');
      if (io) io.emit('request-approved', { 
        id: gp._id, 
        passId: gp.passId, 
        department: gp.department 
      });
    } catch (e) { 
      console.error('Socket emit failed:', e); 
    }

    await log(req, req.user, 'approve', 'gatepass', { 
      passId: gp.passId, 
      student: gp.student.email 
    });

    res.json({ message: 'Approved', gatepass: gp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject a gate pass request - NO EMAIL
exports.rejectRequest = async (req, res) => {
  try {
    const gp = await GatePassRequest.findById(req.params.id).populate('student');
    if (!gp) return res.status(404).json({ message: 'Not found' });
    if (gp.status !== 'pending') return res.status(400).json({ message: 'Request not pending' });

    gp.status = 'rejected';
    gp.approvalBy = req.user._id;
    gp.approvalAt = new Date();
    gp.approvalRemarks = req.body.remarks || '';

    await gp.save();
    
    // ⭐ NO EMAIL SENT - Only socket notification
    try {
      const io = req.app.get('io');
      if (io) io.emit('request-rejected', { 
        id: gp._id, 
        passId: gp.passId, 
        department: gp.department 
      });
    } catch (e) { 
      console.error('Socket emit failed:', e); 
    }

    await log(req, req.user, 'reject', 'gatepass', { 
      passId: gp.passId, 
      student: gp.student.email 
    });

    res.json({ message: 'Rejected', gatepass: gp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== STUDENT MANAGEMENT ====================

// List students under HOD's department
exports.listStudents = async (req, res) => {
  try {
    const department = req.user.department;
    const students = await User.find({ role: 'student', department })
      .select('-password')
      .sort({ name: 1 });
    res.json({ students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Register single student - SENDS WELCOME EMAIL (Only email in system)
exports.registerStudent = async (req, res) => {
  try {
    const { name, email, password, studentId, year, mobile, parentMobile, section } = req.body;
    const department = req.user.department;
    
    console.log('📝 Creating student with data:', { name, email, studentId, year, section, mobile, parentMobile });
    
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    const defaultPassword = password || generateDefaultPassword();
    
    const user = new User({ 
      name, 
      email, 
      password: defaultPassword, 
      role: 'student', 
      studentId: studentId || `STU${Date.now()}`,
      department, 
      year: year || '1', 
      mobile: mobile || '', 
      parentMobile: parentMobile || '', 
      section: section || 'A',
      forcePasswordChange: true 
    });
    
    await user.save();
    console.log('✅ Student created with section:', user.section);

    // ⭐ SEND WELCOME EMAIL (Only email in the system)
    const emailResult = await sendWelcomeEmail(user, defaultPassword);
    
    res.json({ 
      message: 'Student registered successfully!',
      student: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        studentId: user.studentId,
        year: user.year,
        section: user.section,
        mobile: user.mobile,
        parentMobile: user.parentMobile
      },
      emailSent: emailResult.success,
      emailError: emailResult.success ? null : emailResult.error,
      defaultPassword: defaultPassword
    });
    
  } catch (err) {
    console.error('Error creating student:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const { name, studentId, year, mobile, parentMobile, section } = req.body;
    const studentId_param = req.params.id;
    
    console.log('📝 Updating student with data:', { name, studentId, year, section, mobile, parentMobile });
    
    const student = await User.findById(studentId_param);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    if (student.department !== req.user.department) {
      return res.status(403).json({ message: 'You can only update students in your department' });
    }
    
    if (name) student.name = name;
    if (studentId) student.studentId = studentId;
    if (year) student.year = year;
    if (mobile) student.mobile = mobile;
    if (parentMobile) student.parentMobile = parentMobile;
    if (section !== undefined && section !== null) student.section = section;
    
    await student.save();
    console.log('✅ Student updated with section:', student.section);
    
    res.json({ 
      message: 'Student updated successfully!',
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        year: student.year,
        section: student.section,
        mobile: student.mobile,
        parentMobile: student.parentMobile
      }
    });
    
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    if (student.department !== req.user.department) {
      return res.status(403).json({ message: 'You can only delete students in your department' });
    }
    
    const activePasses = await GatePassRequest.find({ 
      student: studentId, 
      status: { $in: ['pending', 'approved'] } 
    });
    
    if (activePasses.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete student with active gate passes.' 
      });
    }
    
    await student.deleteOne();
    
    res.json({ 
      message: 'Student deleted successfully!',
      studentId: studentId
    });
    
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Bulk import students - SENDS WELCOME EMAIL TO EACH (Only email in system)
exports.bulkRegisterStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const workbook = new ExcelJS.Workbook();
    const path = req.file.path;
    
    try {
      if (req.file.originalname.toLowerCase().endsWith('.csv')) {
        await workbook.csv.readFile(path);
      } else {
        await workbook.xlsx.readFile(path);
      }
    } catch (err) {
      console.error('Error reading file:', err);
      return res.status(400).json({ 
        message: 'Error reading file. Please check file format.',
        details: err.message 
      });
    }
    
    const ws = workbook.worksheets[0];
    if (!ws) {
      return res.status(400).json({ message: 'No worksheet found in the file' });
    }

    const department = req.user.department;
    
    const headerRow = ws.getRow(1);
    const headers = [];
    headerRow.eachCell((cell, colNumber) => {
      const value = cell.text?.toString().trim().toLowerCase();
      headers[colNumber] = value;
    });

    const colIndex = {};
    const columnMapping = {
      name: ['name', 'student name', 'full name'],
      roll: ['roll', 'roll number', 'studentid', 'student id', 'id'],
      email: ['email', 'email address', 'mail'],
      mobile: ['mobile', 'phone', 'contact', 'mobile number', 'phone number'],
      parentmobile: ['parentmobile', 'parent mobile', 'parent phone', 'parent contact'],
      year: ['year', 'class', 'semester'],
      branch: ['branch', 'department', 'dept', 'course'],
      section: ['section', 'sec']
    };

    for (const [key, possibleNames] of Object.entries(columnMapping)) {
      for (let i = 1; i < headers.length; i++) {
        if (headers[i] && possibleNames.some(name => headers[i].includes(name))) {
          colIndex[key] = i;
          break;
        }
      }
    }

    if (Object.keys(colIndex).length === 0) {
      const defaultCols = ['name', 'roll', 'email', 'mobile', 'parentmobile', 'year', 'branch', 'section'];
      defaultCols.forEach((key, index) => {
        colIndex[key] = index + 1;
      });
    }

    const requiredCols = ['name', 'email'];
    const missingCols = requiredCols.filter(col => !colIndex[col]);
    if (missingCols.length > 0) {
      return res.status(400).json({ 
        message: `Missing required columns: ${missingCols.join(', ')}`,
        requiredFormat: 'Name, Roll, Email, Mobile, ParentMobile, Year, Branch, Section'
      });
    }

    const results = {
      totalRecords: 0,
      created: 0,
      failed: 0,
      emailSent: 0,
      emailFailed: 0,
      errors: [],
      successList: [],
      summary: {
        byYear: {},
        byBranch: {},
        bySection: {}
      }
    };

    const records = [];
    for (let i = 2; i <= ws.rowCount; i++) {
      const row = ws.getRow(i);
      const name = row.getCell(colIndex.name).text?.toString().trim();
      const email = colIndex.email ? row.getCell(colIndex.email).text?.toString().trim().toLowerCase() : '';
      
      if (!name && !email) continue;
      
      records.push({
        rowNumber: i,
        name: name || '',
        roll: colIndex.roll ? row.getCell(colIndex.roll).text?.toString().trim() : '',
        email: email || '',
        mobile: colIndex.mobile ? row.getCell(colIndex.mobile).text?.toString().trim() : '',
        parentMobile: colIndex.parentmobile ? row.getCell(colIndex.parentmobile).text?.toString().trim() : '',
        year: colIndex.year ? row.getCell(colIndex.year).text?.toString().trim() : '',
        branch: colIndex.branch ? row.getCell(colIndex.branch).text?.toString().trim() : '',
        section: colIndex.section ? row.getCell(colIndex.section).text?.toString().trim() : ''
      });
    }

    results.totalRecords = records.length;

    if (records.length === 0) {
      return res.status(400).json({ 
        message: 'No data found in the file.',
        results
      });
    }

    for (const record of records) {
      const { rowNumber, name, email, roll, mobile, parentMobile, year, branch, section } = record;
      
      const validationErrors = [];
      
      if (!name) validationErrors.push('Name is required');
      if (!email) validationErrors.push('Email is required');
      
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          validationErrors.push('Invalid email format');
        }
      }
      
      if (email) {
        try {
          const existing = await User.findOne({ email });
          if (existing) {
            validationErrors.push('Email already registered');
          }
        } catch (e) {
          validationErrors.push('Database error checking email');
        }
      }
      
      if (mobile && !/^[0-9]{10}$/.test(mobile)) {
        validationErrors.push('Invalid mobile number (must be 10 digits)');
      }
      
      if (parentMobile && !/^[0-9]{10}$/.test(parentMobile)) {
        validationErrors.push('Invalid parent mobile number (must be 10 digits)');
      }

      if (validationErrors.length > 0) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          name: name || 'Unknown',
          email: email || 'Unknown',
          reason: validationErrors.join('; ')
        });
        continue;
      }

      try {
        const defaultPassword = generateDefaultPassword();
        const studentId = roll || `STU${Date.now()}${rowNumber}`;
        
        const user = new User({
          name,
          email,
          password: defaultPassword,
          role: 'student',
          studentId: studentId,
          department: branch || department,
          year: year || '1',
          mobile: mobile || '',
          parentMobile: parentMobile || '',
          section: section || 'A',
          forcePasswordChange: true
        });
        
        await user.save();
        console.log('✅ Bulk created student with section:', user.section);
        
        results.created++;
        results.successList.push({
          row: rowNumber,
          name,
          email,
          studentId: studentId,
          section: section || 'A',
          defaultPassword: defaultPassword
        });

        // ⭐ SEND WELCOME EMAIL (Only email in the system)
        const emailResult = await sendWelcomeEmail(user, defaultPassword);
        if (emailResult.success) {
          results.emailSent++;
        } else {
          results.emailFailed++;
        }

        const yearKey = year || 'Not Specified';
        const branchKey = branch || 'Not Specified';
        const sectionKey = section || 'Not Specified';
        
        results.summary.byYear[yearKey] = (results.summary.byYear[yearKey] || 0) + 1;
        results.summary.byBranch[branchKey] = (results.summary.byBranch[branchKey] || 0) + 1;
        results.summary.bySection[sectionKey] = (results.summary.bySection[sectionKey] || 0) + 1;
        
      } catch (e) {
        console.error('Error creating student row', rowNumber, e);
        results.failed++;
        results.errors.push({
          row: rowNumber,
          name: name || 'Unknown',
          email: email || 'Unknown',
          reason: e.message || 'Database error'
        });
      }
    }

    try { fs.unlinkSync(path); } catch (e) {}

    const response = {
      message: 'Import completed',
      results: {
        totalRecords: results.totalRecords,
        created: results.created,
        failed: results.failed,
        emailSent: results.emailSent,
        emailFailed: results.emailFailed,
        successRate: results.totalRecords > 0 ? Math.round((results.created / results.totalRecords) * 100) : 0,
        errors: results.errors.slice(0, 20),
        summary: results.summary,
        successList: results.successList.slice(0, 10)
      }
    };

    res.json(response);
    
  } catch (err) {
    console.error('Import error:', err);
    try { if (req.file && req.file.path) fs.unlinkSync(req.file.path); } catch (e) {}
    res.status(500).json({ 
      message: 'Server error during import: ' + err.message,
      details: err.stack
    });
  }
};

// Download sample template
exports.downloadTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    worksheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Roll', key: 'roll', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'ParentMobile', key: 'parentMobile', width: 15 },
      { header: 'Year', key: 'year', width: 10 },
      { header: 'Branch', key: 'branch', width: 20 },
      { header: 'Section', key: 'section', width: 10 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF667EEA' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 30;

    const sampleData = [
      {
        name: 'John Doe',
        roll: 'CS2024001',
        email: 'john.doe@college.edu',
        mobile: '9876543210',
        parentMobile: '9876543211',
        year: '1',
        branch: 'Computer Science',
        section: 'A'
      },
      {
        name: 'Jane Smith',
        roll: 'CS2024002',
        email: 'jane.smith@college.edu',
        mobile: '9876543212',
        parentMobile: '9876543213',
        year: '2',
        branch: 'Computer Science',
        section: 'B'
      },
      {
        name: 'Bob Johnson',
        roll: 'CS2024003',
        email: 'bob.johnson@college.edu',
        mobile: '9876543214',
        parentMobile: '9876543215',
        year: '3',
        branch: 'Computer Science',
        section: 'A'
      }
    ];

    sampleData.forEach(data => {
      worksheet.addRow(data);
    });

    const instructionRow = worksheet.getRow(7);
    instructionRow.getCell(1).value = 'Instructions:';
    instructionRow.getCell(1).font = { bold: true, color: { argb: 'FFDC2626' } };
    
    const instructions = [
      '1. Do not modify the header row',
      '2. Fill student details starting from row 2',
      '3. Name and Email are required fields',
      '4. Section: A, B, C, or D',
      '5. Default password will be auto-generated and sent via email'
    ];
    
    instructions.forEach((text, index) => {
      const row = worksheet.getRow(8 + index);
      row.getCell(1).value = text;
      row.getCell(1).font = { color: { argb: 'FF666666' } };
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=student_import_template.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating template' });
  }
};

// ==================== DASHBOARD & REPORTS ====================

// HOD Dashboard Statistics
exports.dashboard = async (req, res) => {
  try {
    const department = req.user.department;
    const totalStudents = await User.countDocuments({ role: 'student', department });
    const totalPending = await GatePassRequest.countDocuments({ department, status: 'pending' });

    const startOfDay = new Date(); 
    startOfDay.setHours(0, 0, 0, 0);
    
    const approvedToday = await GatePassRequest.countDocuments({ 
      department, 
      status: 'approved', 
      approvalAt: { $gte: startOfDay } 
    });
    
    const rejectedToday = await GatePassRequest.countDocuments({ 
      department, 
      status: 'rejected', 
      approvalAt: { $gte: startOfDay } 
    });
    
    const emergencyRequests = await GatePassRequest.countDocuments({ 
      department, 
      emergency: true 
    });
    
    const studentsOutside = await GatePassRequest.countDocuments({ 
      department, 
      status: 'approved', 
      exitTime: { $exists: true }, 
      entryTime: { $exists: false } 
    });

    const fromDate = new Date(); 
    fromDate.setDate(fromDate.getDate() - 30);
    
    const approvals = await GatePassRequest.find({ 
      department, 
      status: 'approved', 
      approvalAt: { $gte: fromDate } 
    }).select('approvalAt createdAt');
    
    let avgApproval = 0;
    if (approvals.length) {
      const totalMinutes = approvals.reduce((acc, a) => 
        acc + ((new Date(a.approvalAt) - new Date(a.createdAt)) / 60000 || 0), 0);
      avgApproval = Math.round(totalMinutes / approvals.length);
    }

    const now = new Date();
    const yearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const monthly = await GatePassRequest.aggregate([
      { $match: { department, createdAt: { $gte: yearAgo } } },
      { $group: { 
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, 
        count: { $sum: 1 } 
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({ 
      totalStudents, 
      totalPending, 
      approvedToday, 
      rejectedToday, 
      emergencyRequests, 
      studentsOutside, 
      avgApproval, 
      monthly 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// List requests with advanced filters
exports.listRequests = async (req, res) => {
  try {
    const department = req.user.department;
    const { 
      q, rollNumber, year, section, status, emergency, 
      startDate, endDate, sort = 'latest', page = 1, limit = 25 
    } = req.query;
    
    const filter = { department };
    
    let studentIds = null;
    if (q || rollNumber) {
      const studentQuery = { role: 'student', department };
      if (q) studentQuery.$or = [
        { name: new RegExp(q, 'i') }, 
        { email: new RegExp(q, 'i') }
      ];
      if (rollNumber) studentQuery.studentId = rollNumber;
      const studs = await User.find(studentQuery).select('_id');
      studentIds = studs.map(s => s._id);
      if (studentIds.length === 0) {
        return res.json({ requests: [], total: 0 });
      }
      filter.student = { $in: studentIds };
    }
    
    if (year) filter.year = year;
    if (section) filter.section = section;
    if (status) filter.status = status;
    if (emergency) filter.emergency = emergency === 'true';
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'oldest') sortObj = { createdAt: 1 };
    if (sort === 'emergency') sortObj = { emergency: -1, createdAt: -1 };

    const skip = (Math.max(1, page) - 1) * limit;
    const requests = await GatePassRequest.find(filter)
      .populate('student', '-password')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await GatePassRequest.countDocuments(filter);
    res.json({ requests, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single request with risk analysis
exports.getRequest = async (req, res) => {
  try {
    const gp = await GatePassRequest.findById(req.params.id).populate('student', '-password');
    if (!gp) return res.status(404).json({ message: 'Not found' });
    if (gp.department !== req.user.department) return res.status(403).json({ message: 'Forbidden' });

    const totalTaken = await GatePassRequest.countDocuments({ student: gp.student._id });
    const approvedCount = await GatePassRequest.countDocuments({ 
      student: gp.student._id, 
      status: 'approved' 
    });
    const rejectedCount = await GatePassRequest.countDocuments({ 
      student: gp.student._id, 
      status: 'rejected' 
    });
    const lastExit = await GatePassRequest.findOne({ 
      student: gp.student._id, 
      status: 'approved', 
      exitTime: { $exists: true } 
    }).sort({ exitTime: -1 }).select('exitTime');

    const attendancePercent = gp.student.attendancePercent || null;

    let riskScore = 0;
    if (totalTaken > 20) riskScore += 40;
    if (approvedCount > 5) riskScore += 20;
    if (gp.student && gp.student.lastLateReturns && gp.student.lastLateReturns > 3) riskScore += 20;
    if (gp.emergency) riskScore += 20;
    
    let riskLevel = 'Low';
    if (riskScore >= 60) riskLevel = 'High'; 
    else if (riskScore >= 30) riskLevel = 'Medium';

    res.json({ 
      request: gp, 
      history: { totalTaken, approvedCount, rejectedCount, lastExit }, 
      attendancePercent, 
      risk: { riskScore, riskLevel } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== BULK OPERATIONS ====================

// Bulk approve requests - NO EMAIL
exports.bulkApprove = async (req, res) => {
  try {
    const ids = req.body.ids || [];
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No ids provided' });
    }
    
    const results = [];
    for (const id of ids) {
      const gp = await GatePassRequest.findById(id).populate('student');
      if (!gp) continue;
      if (gp.department !== req.user.department) continue;
      if (gp.status !== 'pending') continue;
      
      gp.status = 'approved';
      gp.approvalBy = req.user._id;
      gp.approvalAt = new Date();
      gp.approvalRemarks = req.body.remarks || '';
      await gp.save();
      results.push(gp._id);
      
      await log(req, req.user, 'approve', 'gatepass', { 
        passId: gp.passId, 
        student: gp.student.email 
      });
    }
    res.json({ message: 'Bulk approve completed', count: results.length, ids: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Bulk reject requests - NO EMAIL
exports.bulkReject = async (req, res) => {
  try {
    const ids = req.body.ids || [];
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No ids provided' });
    }
    
    const results = [];
    for (const id of ids) {
      const gp = await GatePassRequest.findById(id).populate('student');
      if (!gp) continue;
      if (gp.department !== req.user.department) continue;
      if (gp.status !== 'pending') continue;
      
      gp.status = 'rejected';
      gp.approvalBy = req.user._id;
      gp.approvalAt = new Date();
      gp.approvalRemarks = req.body.remarks || '';
      await gp.save();
      results.push(gp._id);
      
      await log(req, req.user, 'reject', 'gatepass', { 
        passId: gp.passId, 
        student: gp.student.email 
      });
    }
    res.json({ message: 'Bulk reject completed', count: results.length, ids: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== REPORTS ====================

// Generate reports in multiple formats
exports.generateReport = async (req, res) => {
  try {
    const department = req.user.department;
    const { type = 'daily', format = 'json', startDate, endDate } = req.query;

    let from = null; 
    let to = new Date();
    const now = new Date();
    
    if (type === 'daily') { 
      from = new Date(); 
      from.setHours(0, 0, 0, 0); 
    } else if (type === 'weekly') { 
      from = new Date(); 
      from.setDate(now.getDate() - 7); 
    } else if (type === 'monthly') { 
      from = new Date(); 
      from.setMonth(now.getMonth() - 1); 
    } else if (type === 'semester') { 
      from = new Date(); 
      from.setMonth(now.getMonth() - 6); 
    }
    
    if (startDate) from = new Date(startDate);
    if (endDate) to = new Date(endDate);

    const filter = { department };
    if (from || to) filter.createdAt = {};
    if (from) filter.createdAt.$gte = from;
    if (to) filter.createdAt.$lte = to;

    const items = await GatePassRequest.find(filter)
      .populate('student', '-password')
      .sort({ createdAt: -1 });

    if (format === 'json') return res.json({ items });

    const rows = items.map(i => ({
      passId: i.passId,
      studentName: i.student?.name || '',
      studentId: i.student?.studentId || '',
      department: i.department,
      reason: i.reason,
      destination: i.destination,
      outTime: i.outTime ? i.outTime.toISOString() : '',
      expectedReturnTime: i.expectedReturnTime ? i.expectedReturnTime.toISOString() : '',
      emergency: i.emergency ? 'Yes' : 'No',
      status: i.status,
      createdAt: i.createdAt.toISOString()
    }));

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report-${type}.csv`);
      const header = Object.keys(rows[0] || {}).join(',') + '\n';
      res.write(header);
      for (const r of rows) {
        const line = Object.values(r).map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',') + '\n';
        res.write(line);
      }
      return res.end();
    }

    if (format === 'excel') {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Report');
      if (rows.length) ws.columns = Object.keys(rows[0]).map(k => ({ header: k, key: k }));
      rows.forEach(r => ws.addRow(r));
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=report-${type}.xlsx`);
      await wb.xlsx.write(res);
      return res.end();
    }

    if (format === 'pdf') {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 30 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=report-${type}.pdf`);
      doc.pipe(res);
      doc.fontSize(16).text(`Gatepass Report - ${type}`, { align: 'center' });
      doc.moveDown();
      rows.forEach(r => {
        doc.fontSize(10).text(Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(' | '));
        doc.moveDown(0.3);
      });
      doc.end();
      return;
    }

    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
// controllers/hodController.js - Add this function

// Upload HOD signature (HOD uploads their own signature)
exports.uploadSignature = async (req, res) => {
  try {
    const userId = req.user._id; // Current logged-in HOD
    
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('📸 Uploading signature for HOD:', userId);
    console.log('📁 File:', req.file.originalname);

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify the user is HOD
    if (user.role !== 'hod') {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(403).json({ message: 'Only HODs can upload signature' });
    }

    // Upload to Cloudinary
    let result;
    try {
      const cloudinary = require('../config/cloudinary');
      result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'gatepass/signatures',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [
          { width: 400, height: 150, crop: 'limit' },
          { quality: 'auto' }
        ]
      });
      
      console.log('✅ Upload successful:', result.secure_url);
      
    } catch (cloudinaryError) {
      console.error('❌ Cloudinary upload failed:', cloudinaryError.message);
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      
      return res.status(500).json({ 
        message: 'Failed to upload to Cloudinary',
        details: cloudinaryError.message
      });
    }

    // Update user with signature URL
    user.signatureUrl = result.secure_url;
    await user.save();

    // Clean up local file
    try { fs.unlinkSync(req.file.path); } catch (e) {}

    // Log the action
    try { await log(req, req.user, 'upload-signature', 'user', { userId: user._id }); } catch(e) {}

    res.json({ 
      message: 'Signature uploaded successfully', 
      signatureUrl: result.secure_url 
    });

  } catch (err) {
    console.error('❌ Upload signature error:', err);
    try { if (req.file && req.file.path) fs.unlinkSync(req.file.path); } catch (e) {}
    res.status(500).json({ 
      message: 'Server error: ' + err.message 
    });
  }
};