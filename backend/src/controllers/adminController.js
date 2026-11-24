const User = require('../models/User');
const transporter = require('../config/mailer');
const fs = require('fs');

exports.createStudent = async (req, res) => {
  try {
    const { name, email, password, studentId, department, year, mobile } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });
    const user = new User({ name, email, password, role: 'student', studentId, department, year, mobile, forcePasswordChange: true });
    await user.save();
    // send welcome email
    try{
      const mailOptions = {
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: user.email,
        subject: 'Welcome to Smart College Gate Pass Portal',
        text: `Dear ${user.name},\n\nYour account has been created.\nStudent ID: ${user.studentId || ''}\nDefault Password: ${password || ''}\nPlease login and change your password immediately.\n\nRegards,\nCollege Administration`
      };
      await transporter.sendMail(mailOptions);
    }catch(e){ console.error('Welcome email failed', e) }

    res.json({ message: 'Student created', student: { id: user._id, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json({ students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('-password');
    if (!student) return res.status(404).json({ message: 'Not found' });
    res.json({ student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Not found' });
    const updates = req.body;
    Object.assign(student, updates);
    await student.save();
    res.json({ message: 'Updated', student: { id: student._id, name: student.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Not found' });
    await student.remove();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.uploadSignature = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const result = await require('../config/cloudinary').uploader.upload(req.file.path, { folder: 'gatepass/signatures' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.signatureUrl = result.secure_url;
    await user.save();
    // cleanup local file
    try { require('fs').unlinkSync(req.file.path); } catch (e) {}
    try{ const { log } = require('../middleware/audit'); await log(req, req.user, 'upload-signature', 'user', { userId: user._id }); }catch(e){}
    res.json({ message: 'Signature uploaded', signatureUrl: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
// Bulk import students via CSV/Excel upload
exports.bulkImportStudents = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const path = req.file.path;
    if (req.file.originalname.toLowerCase().endsWith('.csv')) {
      await workbook.csv.readFile(path);
    } else {
      await workbook.xlsx.readFile(path);
    }
    const ws = workbook.worksheets[0];
    const results = { created: 0, errors: [] };
    for (let i = 2; i <= ws.rowCount; i++) {
      const row = ws.getRow(i);
      const name = row.getCell(1).text?.trim();
      const roll = row.getCell(2).text?.trim();
      const email = row.getCell(3).text?.trim();
      const mobile = row.getCell(4).text?.trim();
      const parentMobile = row.getCell(5).text?.trim();
      const year = row.getCell(6).text?.trim();
      const branch = row.getCell(7).text?.trim();
      const section = row.getCell(8).text?.trim();
      if (!name || !email) { results.errors.push({ row: i, reason: 'Missing name or email' }); continue; }
      try {
        const existing = await User.findOne({ email });
        if (existing) { results.errors.push({ row: i, reason: 'Email exists' }); continue; }
        const defaultPassword = Math.random().toString(36).slice(-8) + 'A1!';
        const user = new User({ name, email, password: defaultPassword, role: 'student', studentId: roll, department: branch, year, mobile, parentMobile, section, forcePasswordChange: true });
        await user.save();
        // send welcome email
        try{
          await transporter.sendMail({
            from: process.env.FROM_EMAIL || process.env.SMTP_USER,
            to: user.email,
            subject: 'Welcome to Smart College Gate Pass Portal',
            text: `Dear ${user.name},\n\nYour account has been created.\nStudent ID: ${user.studentId || ''}\nDefault Password: ${defaultPassword}\nPlease login and change your password immediately.\n\nRegards,\nCollege Administration`
          });
        }catch(e){ console.error('Welcome email failed', e) }
        results.created++;
      } catch (e) {
        results.errors.push({ row: i, reason: e.message });
      }
    }
    // cleanup file
    try{ fs.unlinkSync(path); }catch(e){}
    res.json({ message: 'Import completed', results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};