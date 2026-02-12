const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({ dest: 'uploads/temp/' });

// TODO: Member 2 - Implement AI generation routes

router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  res.json({ message: 'Content generation routes - Member 2' });
});

module.exports = router;
