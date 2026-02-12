const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');

// TODO: Member 4 - Implement invitation routes

router.get('/', authMiddleware, async (req, res) => {
  res.json({ message: 'Invitation routes - Member 4' });
});

module.exports = router;
