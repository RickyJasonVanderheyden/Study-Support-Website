const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const profileUploadDir = path.join(__dirname, '..', 'uploads', 'profile');
fs.mkdirSync(profileUploadDir, { recursive: true });

const profileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, profileUploadDir),
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `user-${req.user?._id || 'unknown'}-${Date.now()}${safeExt}`);
  },
});

const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      cb(new Error('Only image uploads are allowed'));
      return;
    }
    cb(null, true);
  },
});

const isSliitEmail = (value) => /^it\d{8}@my\.sliit\.lk$/i.test(String(value || '').trim());
const isAdminEmail = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return false;
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
};
const getItDigitsFromSliitEmail = (value) => {
  const match = String(value || '').trim().match(/^it(\d{8})@my\.sliit\.lk$/i);
  return match ? match[1] : null;
};
const getItDigitsFromRegNo = (value) => {
  const match = String(value || '').trim().match(/^IT(\d{8})$/i);
  return match ? match[1] : null;
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, registrationNumber, mobileNumber, adminToken } = req.body;

    const registeringAsAdmin = isAdminEmail(email);
    if (!registeringAsAdmin) {
      if (!isSliitEmail(email)) {
        return res.status(400).json({ error: 'Please use your SLIIT email (itXXXXXXXX@my.sliit.lk)' });
      }
      const emailDigits = getItDigitsFromSliitEmail(email);
      const regDigits = getItDigitsFromRegNo(registrationNumber);
      if (!regDigits) {
        return res.status(400).json({ error: 'Registration number must be IT followed by 8 digits (e.g., IT12345678)' });
      }
      if (!emailDigits || emailDigits !== regDigits) {
        return res.status(400).json({ error: 'Email IT number and registration number must match (e.g., it12345678@my.sliit.lk and IT12345678)' });
      }
    }

    const existingUser = await User.findOne({ 
      $or: [{ email }, { registrationNumber }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email or registration number already exists' 
      });
    }

    const trimmedLeadToken = (adminToken || '').trim();
    const sessionLeadSecret = (process.env.SESSION_LEAD_SECRET || '').trim();
    const isSessionLeadApplication =
      Boolean(trimmedLeadToken && sessionLeadSecret) && trimmedLeadToken === sessionLeadSecret;

    const user = await User.create({
      name,
      email,
      password,
      registrationNumber,
      mobileNumber,
      roleRequest: isSessionLeadApplication ? 'pending_session_lead' : 'none',
      role: registeringAsAdmin ? 'super_admin' : 'student'
    });

    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        registrationNumber: user.registrationNumber,
        mobileNumber: user.mobileNumber,
        groupNumber: user.groupNumber,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
        role: user.role,
        roleRequest: user.roleRequest
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!isSliitEmail(normalizedEmail) && !isAdminEmail(normalizedEmail)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.role !== 'super_admin' && user.roleRequest === 'pending_session_lead') {
      return res.status(403).json({
        error: 'Your Session Lead request is pending approval. Please wait for Super Admin review.',
        code: 'SESSION_LEAD_PENDING'
      });
    }

    if (user.role !== 'super_admin' && user.roleRequest === 'rejected') {
      return res.status(403).json({
        error: 'Your Session Lead request was rejected. Contact admin for more information.',
        code: 'SESSION_LEAD_REJECTED'
      });
    }

    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        registrationNumber: user.registrationNumber,
        mobileNumber: user.mobileNumber,
        groupNumber: user.groupNumber,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
        role: user.role,
        roleRequest: user.roleRequest
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current profile
router.get('/me', authMiddleware, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      registrationNumber: req.user.registrationNumber,
      mobileNumber: req.user.mobileNumber,
      groupNumber: req.user.groupNumber,
      profileImageUrl: req.user.profileImageUrl,
      role: req.user.role,
      roleRequest: req.user.roleRequest,
      createdAt: req.user.createdAt,
    },
  });
});

// Update current profile (name, mobile number, group number, profile image)
router.put('/profile', authMiddleware, profileUpload.single('profileImage'), async (req, res) => {
  try {
    const updates = {};

    if (typeof req.body.name === 'string' && req.body.name.trim()) {
      updates.name = req.body.name.trim();
    }
    if (typeof req.body.mobileNumber === 'string' && req.body.mobileNumber.trim()) {
      updates.mobileNumber = req.body.mobileNumber.trim();
    }
    if (typeof req.body.groupNumber === 'string') {
      updates.groupNumber = req.body.groupNumber.trim() || null;
    }

    if (req.file) {
      updates.profileImageUrl = `/uploads/profile/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json({
      success: true,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        registrationNumber: updatedUser.registrationNumber,
        mobileNumber: updatedUser.mobileNumber,
        groupNumber: updatedUser.groupNumber,
        profileImageUrl: updatedUser.profileImageUrl,
        role: updatedUser.role,
        roleRequest: updatedUser.roleRequest,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
