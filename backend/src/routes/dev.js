const express = require('express');
const router = express.Router();
const { seed } = require('../utils/seed');

router.post('/seed', async (req, res) => {
  try {
    await seed();
    res.json({ message: 'Seed completed' });
  } catch (err) {
    res.status(500).json({ message: 'Seed failed', error: err.message });
  }
});

module.exports = router;
