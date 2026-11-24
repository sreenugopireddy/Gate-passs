const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { createStudent, listStudents, getStudent, updateStudent, deleteStudent, uploadSignature, bulkImportStudents } = require('../controllers/adminController');

router.post('/students', protect, authorize('admin'), createStudent);
router.post('/students/bulk-import', protect, authorize('admin'), upload.single('file'), bulkImportStudents);
router.get('/students', protect, authorize('admin'), listStudents);
router.get('/students/:id', protect, authorize('admin'), getStudent);
router.put('/students/:id', protect, authorize('admin'), updateStudent);
router.delete('/students/:id', protect, authorize('admin'), deleteStudent);

// upload signature for HOD or admin (accept by admin or hod)
router.post('/hod/:id/signature', protect, authorize('admin','hod'), upload.single('signature'), uploadSignature);

module.exports = router;
