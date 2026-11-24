const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { log } = require('../middleware/audit');

exports.login = async (req, res) => {
  const { email, password, employeeId } = req.body;
  try {
    // allow HODs to login with employeeId as well as email
    let user = null;
    if (employeeId) {
      user = await User.findOne({ employeeId });
    }
    if (!user && email) {
      user = await User.findOne({ email });
    }
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });

    // update last login metadata
    try{
      user.lastLoginAt = new Date();
      user.lastLoginIP = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      await user.save();
    }catch(e){console.error('Failed to update last login', e)}

    res.json({ token, user: { id: user._id, name: user.name, role: user.role, department: user.department, lastLoginAt: user.lastLoginAt, forcePasswordChange: user.forcePasswordChange } });
    // audit
    try{ await log(req, user, 'login', 'auth', { email: user.email, employeeId: user.employeeId }); }catch(e){}
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.me = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    res.json({ user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    const { currentPassword, newPassword } = req.body;
    // If user has forcePasswordChange set, currentPassword may be optional
    if (!user.forcePasswordChange) {
      const ok = await user.matchPassword(currentPassword || '');
      if (!ok) return res.status(400).json({ message: 'Current password incorrect' });
    }

    // validate password policy
    const policy = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}/;
    if (!policy.test(newPassword)) return res.status(400).json({ message: 'Password does not meet policy' });

    user.password = newPassword;
    user.forcePasswordChange = false;
    await user.save();
    try{ const { log } = require('../middleware/audit'); await log(req, req.user, 'change-password', 'auth', {}); }catch(e){}
    res.json({ message: 'Password changed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
