const jwt = require('jsonwebtoken');

exports.generateQrToken = (payload) => {
  // payload: { passId, studentId, approvalId, expiry }
  return jwt.sign(payload, process.env.JWT_QR_SECRET, { expiresIn: Math.max(60, Math.floor((payload.expiry - Date.now()) / 1000)) + 's' });
};

exports.verifyQrToken = (token) => {
  return jwt.verify(token, process.env.JWT_QR_SECRET);
};
