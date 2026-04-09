const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, registrationNumber, mobileNumber, adminToken } = req.body;

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
      role: (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
        .includes((email || '').trim().toLowerCase())
        ? 'super_admin'
        : 'student'
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

    const user = await User.findOne({ email }).select('+password');
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
