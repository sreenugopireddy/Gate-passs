// routes/security.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  scanPass,
  markExit,
  markEntry,
  getStats,
  getHistory
} = require('../controllers/securityController');

// Scan QR code
router.post('/scan', protect, authorize('security'), scanPass);

// Mark exit
router.post('/mark-exit', protect, authorize('security'), markExit);

// Mark entry
router.post('/mark-entry', protect, authorize('security'), markEntry);

// Get stats
router.get('/stats', protect, authorize('security'), getStats);

// Get history
router.get('/history', protect, authorize('security'), getHistory);

module.exports = router;