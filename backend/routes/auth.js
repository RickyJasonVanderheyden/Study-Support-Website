const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// 1. Admin Pre-register (Whitelisting)
// Proteced: Only Admins can add students/instructors
const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(String(value || '').trim());
const isAdminEmail = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return false;
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
};

router.post('/pre-register', authMiddleware, roleMiddleware(['admin', 'super_admin']), async (req, res) => {
  try {
    const { email, registrationNumber, role, name, password, year, semester, mainGroup, subGroup } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { registrationNumber }]
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User with this email or ID already exists'
      });
    }

    // Direct Creation logic: if name and password are provided, activate immediately
    const userData = {
      name: name || '',
      email,
      registrationNumber,
      password,
      role: role || 'student',
      isActivated: !!password && !!name
    };

    // Add academic fields for students
    if (role === 'student') {
      if (year) userData.year = year;
      if (semester) userData.semester = semester;
      if (mainGroup) userData.mainGroup = parseInt(mainGroup);
      if (subGroup) userData.subGroup = parseInt(subGroup);
    }

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      message: user.isActivated ?
        `${role || 'student'} account created and activated successfully` :
        `${role || 'student'} whitelisted successfully`,
      user: {
        id: user._id,
        email: user.email,
        registrationNumber: user.registrationNumber,
        isActivated: user.isActivated,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Student Claims Account / Activate
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, registrationNumber, mobileNumber, year, semester, mainGroup, subGroup, adminToken } = req.body;

    // validation (optional but good to have)
    const registeringAsAdmin = isAdminEmail(email);
    if (!registeringAsAdmin && email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Please use a valid email address' });
      }
    }

    if (!registrationNumber) {
      return res.status(400).json({ error: 'ID Number is required.' });
    }

    // Find if the user was pre-registered
    let user = await User.findOne({
      email,
      registrationNumber,
      isActivated: false
    });

    const trimmedLeadToken = (adminToken || '').trim();
    const sessionLeadSecret = (process.env.SESSION_LEAD_SECRET || '').trim();
    const isSessionLeadApplication =
      Boolean(trimmedLeadToken && sessionLeadSecret) && trimmedLeadToken === sessionLeadSecret;

    if (!user) {
      // If not pre-registered, we create a new one directly
      const userExists = await User.findOne({
        $or: [{ email }, { registrationNumber }]
      });

      if (userExists) {
        return res.status(400).json({ error: 'This Email or ID Number is already registered.' });
      }

      let role = registeringAsAdmin ? 'super_admin' : 'student';
      if (!registeringAsAdmin) {
        if (registrationNumber && (registrationNumber.startsWith('INS') || registrationNumber.includes('INS'))) role = 'instructor';
        if (registrationNumber && (registrationNumber.startsWith('ADMIN') || registrationNumber.includes('ADMIN'))) role = 'admin';
      }

      const userData = {
        name,
        email,
        password,
        registrationNumber,
        mobileNumber,
        role,
        roleRequest: isSessionLeadApplication ? 'pending_session_lead' : 'none',
        isActivated: true
      };

      // Add academic fields for students
      if (role === 'student' || role === 'super_admin') {
        if (year) userData.year = year;
        if (semester) userData.semester = semester;
        if (mainGroup) userData.mainGroup = parseInt(mainGroup);
        if (subGroup) userData.subGroup = parseInt(subGroup);
      }

      user = await User.create(userData);

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
      return res.status(200).json({ success: true, token, user });
    }

    // Activate existing pre-registered user
    user.name = name;
    user.password = password;
    user.mobileNumber = mobileNumber;
    user.roleRequest = isSessionLeadApplication ? 'pending_session_lead' : 'none';
    if (year) user.year = year;
    if (semester) user.semester = semester;
    if (mainGroup) user.mainGroup = parseInt(mainGroup);
    if (subGroup) user.subGroup = parseInt(subGroup);
    user.isActivated = true;
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(200).json({
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

// 3. Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, isActivated: true }).select('+password');
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

// 4. Get Current User info
router.get('/me', authMiddleware, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// 4.1 Update Own Profile (Self-service)
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, bio, skills, mobileNumber } = req.body;

    if (name && name.trim()) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.substring(0, 300);
    if (skills !== undefined) {
      user.skills = Array.isArray(skills)
        ? skills.map(s => s.trim()).filter(Boolean).slice(0, 20)
        : [];
    }
    if (mobileNumber !== undefined) user.mobileNumber = mobileNumber || undefined;

    await user.save();

    // Return updated user (without password)
    const updated = await User.findById(user._id);
    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Get All Users (Admin Only)
router.get('/', authMiddleware, roleMiddleware(['admin', 'super_admin']), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Delete User (Admin Only)
router.delete('/:id', authMiddleware, roleMiddleware(['admin', 'super_admin']), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6.1 Update User (Admin Only)
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'super_admin']), async (req, res) => {
  try {
    const { name, email, registrationNumber, year, semester, mainGroup, subGroup, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ error: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (registrationNumber) user.registrationNumber = registrationNumber;
    if (year) user.year = year;
    if (semester) user.semester = semester;
    if (mainGroup) user.mainGroup = mainGroup;
    if (subGroup) user.subGroup = subGroup;
    if (role) user.role = role;

    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Lookup Whitelisted ID by Email (for auto-fill)
router.get('/check-whitelist/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email, isActivated: false });
    if (user) {
      return res.json({ found: true, registrationNumber: user.registrationNumber });
    }
    res.json({ found: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
