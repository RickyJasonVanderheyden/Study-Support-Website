const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');

// TODO: Member 1 - Implement goal routes

router.get('/', authMiddleware, async (req, res) => {
  res.json({ message: 'Goal routes - Member 1' });
});

module.exports = router;
