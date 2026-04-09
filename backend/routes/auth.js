const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
        role: user.role,
        roleRequest: user.roleRequest
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
