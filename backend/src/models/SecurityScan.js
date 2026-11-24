// models/SecurityScan.js
const mongoose = require('mongoose');

const SecurityScanSchema = new mongoose.Schema({
  passId: { type: String, required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentName: { type: String },
  studentId: { type: String },
  department: { type: String },
  status: { type: String, enum: ['success', 'error', 'pending'], default: 'success' },
  scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  scannedAt: { type: Date, default: Date.now },
  exitTime: { type: Date },      // When student exits
  entryTime: { type: Date },     // When student returns
  gatepass: { type: mongoose.Schema.Types.ObjectId, ref: 'GatePassRequest' },
  errorMessage: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for faster queries
SecurityScanSchema.index({ passId: 1 });
SecurityScanSchema.index({ scannedAt: -1 });
SecurityScanSchema.index({ student: 1 });
SecurityScanSchema.index({ status: 1 });
SecurityScanSchema.index({ exitTime: 1 });
SecurityScanSchema.index({ entryTime: 1 });

module.exports = mongoose.model('SecurityScan', SecurityScanSchema);