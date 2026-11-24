const express = require('express');
const router = express.Router();
const { login, me, changePassword } = require('../controllers/authController');

router.post('/login', login);
const { protect } = require('../middleware/auth');
router.get('/me', protect, me);
router.post('/change-password', protect, changePassword);

module.exports = router;
