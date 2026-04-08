const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSessionLeadApprovalEmail, sendSessionLeadRejectionEmail } = require('../utils/emailService');

// Middleware to protect routes for super_admin only
const superAdminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication token missing' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super Admin privileges required.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// GET all pending Session Lead requests
router.get('/requests', superAdminAuth, async (req, res) => {
  try {
    const pendingUsers = await User.find({ roleRequest: 'pending_session_lead' })
      .select('name email registrationNumber createdAt roleRequest');
    
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH approve a session lead
router.patch('/approve', superAdminAuth, async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { role: 'session_lead', roleRequest: 'none' },
      { new: true }
    ).select('name email role');

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Send approval email
    const emailResult = await sendSessionLeadApprovalEmail(user.email, user.name);
    if (emailResult.success) {
      console.log(`✅ Approval email sent to ${user.email}`);
    } else {
      console.error(`❌ Failed to send approval email to ${user.email}:`, emailResult.error);
    }

    res.json({
      success: true,
      message: `${user.name} has been promoted to Session Lead`,
      emailSent: emailResult.success,
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH reject a session lead
router.patch('/reject', superAdminAuth, async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { roleRequest: 'rejected' },
      { new: true }
    ).select('name email');

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Send rejection email
    const emailResult = await sendSessionLeadRejectionEmail(user.email, user.name);
    if (emailResult.success) {
      console.log(`✅ Rejection email sent to ${user.email}`);
    } else {
      console.error(`❌ Failed to send rejection email to ${user.email}:`, emailResult.error);
    }

    res.json({
      success: true,
      message: `${user.name}'s request was rejected`,
      emailSent: emailResult.success
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET check status of current user's session lead request
router.get('/check-status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication token missing' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('roleRequest role');

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      roleRequest: user.roleRequest,
      role: user.role,
      canLogin: user.roleRequest !== 'pending_session_lead' && user.roleRequest !== 'rejected'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
