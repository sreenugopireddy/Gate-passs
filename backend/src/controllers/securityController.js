// controllers/securityController.js
const GatePassRequest = require('../models/GatePassRequest');
const SecurityScan = require('../models/SecurityScan');
const User = require('../models/User');

// Scan QR code and verify pass - NO DATABASE SAVE
exports.scanPass = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'No token provided' });
    }

    const { verifyQrToken } = require('../utils/qrUtil');
    let payload;
    try {
      payload = verifyQrToken(token);
    } catch (err) {
      return res.status(400).json({ 
        valid: false,
        message: 'Invalid or expired QR token' 
      });
    }

    const gp = await GatePassRequest.findOne({ passId: payload.passId })
      .populate('student', '-password');
    
    if (!gp) {
      return res.status(404).json({ 
        valid: false,
        message: 'Pass not found' 
      });
    }

    if (gp.status !== 'approved') {
      return res.status(403).json({ 
        valid: false,
        message: 'Pass not approved' 
      });
    }

    const now = Date.now();
    if (payload.expiry < now) {
      return res.status(400).json({ 
        valid: false,
        message: 'PASS EXPIRED' 
      });
    }

    // ✅ ONLY VERIFY - NO DATABASE SAVE HERE
    res.json({ 
      valid: true, 
      gatepass: gp 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark exit - SAVE TO DATABASE
exports.markExit = async (req, res) => {
  try {
    const { passId } = req.body;
    if (!passId) {
      return res.status(400).json({ message: 'Pass ID required' });
    }

    // Check if pass exists and is approved
    const gp = await GatePassRequest.findOne({ passId });
    if (!gp) {
      return res.status(404).json({ message: 'Pass not found' });
    }

    if (gp.status !== 'approved') {
      return res.status(403).json({ message: 'Pass not approved' });
    }

    if (gp.exitTime) {
      return res.status(400).json({ message: 'Exit already recorded' });
    }

    // Update gate pass with exit time
    gp.exitTime = new Date();
    await gp.save();

    // ✅ SAVE SCAN TO DATABASE - ONLY ON EXIT
    try {
      const scan = new SecurityScan({
        passId: gp.passId,
        student: gp.student._id,
        studentName: gp.student.name,
        studentId: gp.student.studentId,
        department: gp.department,
        status: 'success',
        scannedBy: req.user._id,
        scannedAt: new Date(),
        exitTime: new Date(),
        gatepass: gp._id
      });
      await scan.save();
      console.log('✅ Exit scan saved to database:', gp.passId);
    } catch (scanErr) {
      console.error('Failed to save exit scan:', scanErr);
    }

    res.json({ 
      message: 'Exit recorded', 
      exitTime: gp.exitTime 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark entry - UPDATE SCAN RECORD
exports.markEntry = async (req, res) => {
  try {
    const { passId } = req.body;
    if (!passId) {
      return res.status(400).json({ message: 'Pass ID required' });
    }

    const gp = await GatePassRequest.findOne({ passId });
    if (!gp) {
      return res.status(404).json({ message: 'Pass not found' });
    }

    if (!gp.exitTime) {
      return res.status(400).json({ message: 'Exit not recorded' });
    }

    if (gp.entryTime) {
      return res.status(400).json({ message: 'Entry already recorded' });
    }

    gp.entryTime = new Date();
    const durationMs = gp.entryTime - gp.exitTime;
    gp.durationMinutes = Math.round(durationMs / (1000 * 60));
    await gp.save();

    // ✅ UPDATE SCAN RECORD WITH ENTRY TIME
    try {
      await SecurityScan.findOneAndUpdate(
        { passId: passId, exitTime: { $exists: true }, entryTime: { $exists: false } },
        { entryTime: new Date() },
        { sort: { scannedAt: -1 } } // Get the latest scan for this pass
      );
      console.log('✅ Entry time updated for scan:', gp.passId);
    } catch (scanErr) {
      console.error('Failed to update entry scan:', scanErr);
    }

    res.json({ 
      message: 'Entry recorded', 
      entryTime: gp.entryTime,
      durationMinutes: gp.durationMinutes 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get security stats from database
exports.getStats = async (req, res) => {
  try {
    // Get stats from SecurityScan collection (only exit scans)
    const totalScans = await SecurityScan.countDocuments({ exitTime: { $exists: true } });
    const validScans = await SecurityScan.countDocuments({ status: 'success', exitTime: { $exists: true } });
    const invalidScans = await SecurityScan.countDocuments({ status: 'error', exitTime: { $exists: true } });

    // Students currently outside (approved, exitTime set, no entryTime)
    const outside = await GatePassRequest.countDocuments({
      status: 'approved',
      exitTime: { $exists: true },
      entryTime: { $exists: false }
    });

    // Students who have returned
    const returned = await GatePassRequest.countDocuments({
      status: 'approved',
      exitTime: { $exists: true },
      entryTime: { $exists: true }
    });

    // Pending requests
    const pending = await GatePassRequest.countDocuments({ status: 'pending' });

    // Today's exit scans
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayScans = await SecurityScan.countDocuments({
      exitTime: { $exists: true },
      scannedAt: { $gte: startOfDay }
    });

    // Weekly scans
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyScans = await SecurityScan.countDocuments({
      exitTime: { $exists: true },
      scannedAt: { $gte: weekAgo }
    });

    // Monthly scans
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthlyScans = await SecurityScan.countDocuments({
      exitTime: { $exists: true },
      scannedAt: { $gte: monthAgo }
    });

    // Average duration
    const durations = await GatePassRequest.aggregate([
      { $match: { 
        durationMinutes: { $exists: true, $ne: null },
        durationMinutes: { $gt: 0 }
      }},
      { $group: {
        _id: null,
        avgDuration: { $avg: '$durationMinutes' }
      }}
    ]);
    const averageDuration = durations.length > 0 ? Math.round(durations[0].avgDuration) : 0;

    // Peak hour for exits
    const peakHourData = await SecurityScan.aggregate([
      { $match: { exitTime: { $exists: true } } },
      { $group: {
        _id: { $hour: '$exitTime' },
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const peakHour = peakHourData.length > 0 ? peakHourData[0]._id : null;

    res.json({
      totalScans,
      validScans,
      invalidScans,
      outside,
      returned,
      pending,
      todayScans,
      weeklyScans,
      monthlyScans,
      averageDuration,
      peakHour: peakHour ? `${peakHour}:00 - ${peakHour + 1}:00` : 'N/A'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get scan history from database
exports.getHistory = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const scans = await SecurityScan.find({ exitTime: { $exists: true } })
      .populate('student', 'name studentId email')
      .populate('scannedBy', 'name')
      .sort({ scannedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SecurityScan.countDocuments({ exitTime: { $exists: true } });

    const history = scans.map(scan => ({
      id: scan._id,
      passId: scan.passId,
      student: scan.studentName || scan.student?.name || 'Unknown',
      studentId: scan.studentId || scan.student?.studentId,
      status: scan.status || 'success',
      timestamp: scan.scannedAt || scan.createdAt,
      exitTime: scan.exitTime,
      entryTime: scan.entryTime,
      scannedBy: scan.scannedBy?.name || 'Security'
    }));

    res.json({ 
      scans: history,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get daily chart data
exports.getDailyChart = async (req, res) => {
  try {
    const days = 7;
    const result = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const count = await SecurityScan.countDocuments({
        exitTime: { $exists: true },
        scannedAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      result.push({
        day: dayNames[date.getDay()],
        scans: count,
        date: date.toISOString().split('T')[0]
      });
    }
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};