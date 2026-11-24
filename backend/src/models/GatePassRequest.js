const mongoose = require('mongoose');

const GatePassSchema = new mongoose.Schema({
  passId: { type: String, required: true, unique: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  department: { type: String },
  reason: { type: String },
  destination: { type: String },
  outTime: { type: Date },
  expectedReturnTime: { type: Date },
  emergency: { type: Boolean, default: false },
  supportingDocs: [{ url: String, public_id: String }],
  status: { type: String, enum: ['pending','approved','rejected','cancelled'], default: 'pending' },
  approvalRemarks: { type: String },
  approvalBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvalAt: { type: Date },
  approvalSignatureUrl: { type: String },
  exitTime: { type: Date },
  entryTime: { type: Date },
  durationMinutes: { type: Number },
  qrPayload: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GatePassRequest', GatePassSchema);
