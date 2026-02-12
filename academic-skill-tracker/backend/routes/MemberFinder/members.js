const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');

// TODO: Member 4 - Implement member routes

router.get('/', authMiddleware, async (req, res) => {
  res.json({ message: 'Member routes - Member 4' });
});

module.exports = router;
