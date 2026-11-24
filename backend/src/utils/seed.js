require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

const seed = async () => {
  try {
    await connectDB();
    // create admin
    const admin = await User.findOne({ email: 'admin@college.edu' });
    if (!admin) {
      await User.create({ name: 'Admin', email: 'admin@college.edu', password: 'password123', role: 'admin' });
      console.log('Admin created');
    }
    const hod = await User.findOne({ email: 'hod@college.edu' });
    if (!hod) {
      await User.create({ name: 'HOD', email: 'hod@college.edu', password: 'password123', role: 'hod', department: 'Computer Science' });
      console.log('HOD created');
    }
    const security = await User.findOne({ email: 'security@college.edu' });
    if (!security) {
      await User.create({ name: 'Security', email: 'security@college.edu', password: 'password123', role: 'security' });
      console.log('Security created');
    }
    const student = await User.findOne({ email: 'student@college.edu' });
    if (!student) {
      await User.create({ name: 'Student One', email: 'student@college.edu', password: 'password123', role: 'student', studentId: 'S1001', department: 'Computer Science', year: '3' });
      console.log('Student created');
    }
    return { admin, hod, security, student };
  } catch (err) {
    console.error(err);
    throw err;
  }
};

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seed };
