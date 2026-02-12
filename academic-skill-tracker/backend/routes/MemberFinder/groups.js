const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');

// TODO: Member 4 - Implement group routes

router.get('/', authMiddleware, async (req, res) => {
  res.json({ message: 'Group routes - Member 4' });
});

module.exports = router;
