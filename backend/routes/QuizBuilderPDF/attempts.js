const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');

// TODO: Member 2 - Implement attempt routes

router.get('/', authMiddleware, async (req, res) => {
  res.json({ message: 'Attempt routes - Member 2' });
});

module.exports = router;
