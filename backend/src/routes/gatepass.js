const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { applyGatePass, getHistory, getStatus, downloadGatePass } = require('../controllers/gatepassController');

// Accept up to 5 supporting documents as multipart/form-data
router.post('/apply', protect, authorize('student'), upload.array('supportingDocs', 5), applyGatePass);
router.get('/history', protect, authorize('student'), getHistory);
router.get('/status/:id', protect, getStatus);
router.get('/download/:id', protect, authorize('student','hod','admin'), downloadGatePass);

module.exports = router;
