const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');

// TODO: Member 3 - Implement booking routes

router.get('/', authMiddleware, async (req, res) => {
  res.json({ message: 'Booking routes - Member 3' });
});

module.exports = router;
