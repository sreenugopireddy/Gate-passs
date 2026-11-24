// controllers/gatepassController.js
const GatePassRequest = require('../models/GatePassRequest');
const User = require('../models/User');
const { generateQrToken } = require('../utils/qrUtil');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const { generateGatePassPDFBuffer } = require('../utils/pdfUtil'); // ⭐ Import enhanced PDF
const { log } = require('../middleware/audit');

// controllers/gatepassController.js - Apply Gate Pass
exports.applyGatePass = async (req, res) => {
  try {
    const user = req.user;
    const { reason, destination, outTime, expectedReturnTime, emergency } = req.body;
    const passId = 'GP-' + uuidv4().split('-')[0].toUpperCase();

    const gp = new GatePassRequest({
      passId,
      student: user._id,
      department: user.department,
      reason,
      destination,
      outTime,
      expectedReturnTime,
      emergency: !!emergency
    });

    const expiry = new Date(expectedReturnTime).getTime();
    const qrToken = generateQrToken({ passId, studentId: user.studentId || user._id, expiry });
    gp.qrPayload = qrToken;

    if (req.files && req.files.length) {
      gp.supportingDocs = gp.supportingDocs || [];
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, { folder: 'gatepass/supportingDocs' });
          gp.supportingDocs.push({ url: result.secure_url, public_id: result.public_id });
        } catch (e) {
          console.error('Cloud upload failed', e);
        } finally {
          try { fs.unlinkSync(file.path); } catch (e) { }
        }
      }
    }

    await gp.save();

    // ✅ Emit socket notification with student details
    try {
      const io = req.app.get('io');
      if (io) {
        const payload = {
          id: gp._id,
          passId: gp.passId,
          department: gp.department,
          emergency: gp.emergency,
          destination: gp.destination,
          outTime: gp.outTime,
          studentName: user.name,
          studentId: user.studentId || user._id,
          studentDepartment: user.department
        };
        
        console.log('📤 Emitting new-request:', payload);
        io.emit('new-request', payload);
        
        if (gp.emergency) {
          io.emit('emergency-request', payload);
        }
      }
    } catch(e) { 
      console.error('Socket emit failed:', e); 
    }

    res.json({ message: 'Gate pass requested', passId: gp.passId, id: gp._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const user = req.user;
    const history = await GatePassRequest.find({ student: user._id }).sort({ createdAt: -1 });
    res.json({ history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const gp = await GatePassRequest.findById(req.params.id).populate('student', '-password');
    if (!gp) return res.status(404).json({ message: 'Not found' });
    res.json({ gatepass: gp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ⭐ UPDATED DOWNLOAD FUNCTION - Uses Enhanced PDF
exports.downloadGatePass = async (req, res) => {
  try {
    const gp = await GatePassRequest.findById(req.params.id).populate('student', '-password');
    if (!gp) return res.status(404).json({ message: 'Not found' });
    if (gp.status !== 'approved') return res.status(403).json({ message: 'Gate pass not approved' });
    
    // Check authorization
    if (req.user.role === 'student' && gp.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    console.log('📄 Generating enhanced PDF for download:', gp.passId);
    
    // ⭐ USE ENHANCED PDF GENERATOR
    const pdfBuffer = await generateGatePassPDFBuffer(gp);
    
    // Set headers with cache prevention
    res.setHeader('Content-Disposition', `attachment; filename=${gp.passId}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(pdfBuffer);
    
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};