const AuditLog = require('../models/AuditLog');

exports.log = async (req, user, action, resource, meta) => {
  try {
    await AuditLog.create({ user: user?._id, action, resource, ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress, meta });
  } catch (e) {
    console.error('Audit log failed', e);
  }
};
