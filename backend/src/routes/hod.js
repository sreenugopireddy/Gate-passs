// routes/hod.js - Make sure these routes exist
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getPending,
  approveRequest,
  rejectRequest,
  dashboard,
  listRequests,
  getRequest,
  bulkApprove,
  bulkReject,
  generateReport,
  listStudents,
  registerStudent,
  bulkRegisterStudents,
  downloadTemplate,
  uploadSignature  ,
  updateStudent,   // ADD THIS
  deleteStudent    // ADD THIS
} = require('../controllers/hodController');

router.get('/requests/pending', protect, authorize('hod'), getPending);
router.get('/dashboard', protect, authorize('hod'), dashboard);
router.get('/requests', protect, authorize('hod'), listRequests);
router.get('/request/:id', protect, authorize('hod'), getRequest);
router.get('/reports', protect, authorize('hod'), generateReport);
router.get('/students', protect, authorize('hod'), listStudents);
router.get('/download-template', protect, authorize('hod'), downloadTemplate);

// Student CRUD routes
router.post('/students', protect, authorize('hod'), registerStudent);
router.put('/students/:id', protect, authorize('hod'), updateStudent);    // ADD THIS
router.delete('/students/:id', protect, authorize('hod'), deleteStudent);  // ADD THIS
router.post('/students/bulk-import', protect, authorize('hod'), upload.single('file'), bulkRegisterStudents);

router.put('/request/:id/approve', protect, authorize('hod'), approveRequest);
router.put('/request/:id/reject', protect, authorize('hod'), rejectRequest);
router.put('/requests/bulk-approve', protect, authorize('hod'), bulkApprove);
router.put('/requests/bulk-reject', protect, authorize('hod'), bulkReject);
router.post('/upload-signature', protect, authorize('hod'), upload.single('signature'), uploadSignature);

module.exports = router;