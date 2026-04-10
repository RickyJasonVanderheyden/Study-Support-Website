const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const Group = require('../../models/Group');
const ActivityLog = require('../../models/ActivityLog');
const { findExistingGroupForModule, logActivity } = require('./helpers');

// POST /api/module4/groups - Create a new group
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, moduleCode, academicYear, tags } = req.body;
    const User = require('../../models/User');
    const user = await User.findById(req.user._id);

    // Only students and admins can create groups
    if (user.role === 'instructor') {
      return res.status(403).json({ error: 'Instructors cannot create groups' });
    }

    // For students, enforce academic placement and max members
    if (user.role === 'student') {
      if (!user.year || !user.semester || !user.mainGroup || !user.subGroup) {
        return res.status(400).json({
          error: 'Please complete your academic placement profile (Year, Semester, Group) before creating a group.'
        });
      }
    }

    // Check if student is already in a group for this module
    if (user.role === 'student') {
      const existing = await findExistingGroupForModule(user._id, moduleCode);
      if (existing) {
        return res.status(400).json({
          error: `You are already a member of "${existing.name}" for module ${moduleCode.toUpperCase()}. You cannot create another group for the same module.`
        });
      }
    }

    const groupData = {
      name,
      description,
      moduleCode,
      academicYear,
      maxMembers: 4, 
      tags: tags || [],
      createdBy: user._id,
      year: user.role === 'student' ? user.year : req.body.year,
      semester: user.role === 'student' ? user.semester : req.body.semester,
      mainGroup: user.role === 'student' ? user.mainGroup : req.body.mainGroup,
      subGroup: user.role === 'student' ? user.subGroup : req.body.subGroup,
      members: user.role === 'student' ? [{
        user: user._id,
        role: 'leader',
        status: 'active'
      }] : [] // Admins are facilitators, not members
    };

    // Validate placement for admin-created groups
    if (user.role !== 'student') {
      if (!groupData.year || !groupData.semester || !groupData.mainGroup || !groupData.subGroup) {
        return res.status(400).json({
          error: 'Please provide Year, Semester, Main Group, and Sub Group for this group.'
        });
      }
    }

    const group = await Group.create(groupData);

    await logActivity(group._id, req.user._id, 'group_created', `Group "${name}" was created`);

    const populated = await Group.findById(group._id)
      .populate('members.user', 'name email registrationNumber semester skills')
      .populate('createdBy', 'name email registrationNumber');

    res.status(201).json({ success: true, group: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/module4/groups - Get all my groups
router.get('/', authMiddleware, async (req, res) => {
  try {
    let groups;

    if (req.user.role === 'admin') {
      groups = await Group.find({ status: { $ne: 'archived' } })
        .populate('members.user', 'name email registrationNumber year semester mainGroup subGroup')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'instructor') {
      const { moduleCode } = req.query;
      const filter = { status: { $ne: 'archived' } };
      if (moduleCode) filter.moduleCode = moduleCode.toUpperCase();
      groups = await Group.find(filter)
        .populate('members.user', 'name email registrationNumber year semester mainGroup subGroup')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    } else {
      groups = await Group.find({
        'members.user': req.user._id,
        status: { $ne: 'archived' }
      })
        .populate('members.user', 'name email registrationNumber year semester mainGroup subGroup')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    }

    res.json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/module4/groups/search - Search available groups
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { moduleCode, year, semester, mainGroup, subGroup, name, tags } = req.query;
    const User = require('../../models/User');
    const user = await User.findById(req.user._id);

    const filter = { status: 'active' };

    // Students are ALWAYS locked to their own sub-group (cannot override via query params)
    if (user.role === 'student' && user.year && user.semester && user.mainGroup && user.subGroup) {
      filter.year = user.year;
      filter.semester = user.semester;
      filter.mainGroup = user.mainGroup;
      filter.subGroup = user.subGroup;
    } else {
      if (year) filter.year = year;
      if (semester) filter.semester = semester;
      if (mainGroup) filter.mainGroup = parseInt(mainGroup);
      if (subGroup) filter.subGroup = parseInt(subGroup);
    }

    if (moduleCode) filter.moduleCode = moduleCode.toUpperCase();
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (tags) filter.tags = { $in: tags.split(',').map(t => t.trim().toLowerCase()) };

    const groups = await Group.find(filter)
      .populate('members.user', 'name email registrationNumber year semester mainGroup subGroup')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/module4/groups/:id - Get single group details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'name email registrationNumber year semester mainGroup subGroup skills bio role')
      .populate('createdBy', 'name email registrationNumber');

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check access: must be a member, instructor, or admin
    const isMember = group.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember && req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ success: true, group });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/module4/groups/:id - Update group info
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    // Only leader or admin can update
    const leader = group.members.find(m => m.user.toString() === req.user._id.toString() && m.role === 'leader');
    if (!leader && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the group leader can update group info' });
    }

    const { name, description, academicYear, maxMembers, tags, status } = req.body;

    // Module code and placement are IMMUTABLE after creation
    if (req.body.moduleCode && req.body.moduleCode.toUpperCase() !== group.moduleCode) {
      return res.status(400).json({ error: 'Module code cannot be changed after group creation.' });
    }
    if (req.body.year || req.body.semester || req.body.mainGroup || req.body.subGroup) {
      const placementChanged = 
        (req.body.year && req.body.year !== group.year) ||
        (req.body.semester && req.body.semester !== group.semester) ||
        (req.body.mainGroup && parseInt(req.body.mainGroup) !== group.mainGroup) ||
        (req.body.subGroup && parseInt(req.body.subGroup) !== group.subGroup);
      if (placementChanged && req.user.role !== 'admin') {
        return res.status(400).json({ error: 'Academic placement cannot be changed. Contact an admin if this is needed.' });
      }
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (academicYear) group.academicYear = academicYear;
    if (maxMembers) group.maxMembers = maxMembers;
    if (tags) group.tags = tags;
    if (status) group.status = status;

    // Only admins can change placement (as an override)
    if (req.user.role === 'admin') {
      if (req.body.year) group.year = req.body.year;
      if (req.body.semester) group.semester = req.body.semester;
      if (req.body.mainGroup) group.mainGroup = req.body.mainGroup;
      if (req.body.subGroup) group.subGroup = req.body.subGroup;
    }

    await group.save();

    await logActivity(group._id, req.user._id, 'group_updated', `Group info was updated`);

    const updated = await Group.findById(group._id)
      .populate('members.user', 'name email registrationNumber year semester mainGroup subGroup skills')
      .populate('createdBy', 'name email registrationNumber');

    res.json({ success: true, group: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/module4/groups/:id - Archive group
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    // Admin bypass: Admins can delete any group
    if (req.user.role !== 'admin') {
      const leader = group.members.find(m => m.user && m.user.toString() === req.user._id.toString() && m.role === 'leader');
      if (!leader) {
        return res.status(403).json({ error: 'Only the group leader or admin can delete a group' });
      }
    }

    await Group.findByIdAndUpdate(group._id, { status: 'archived' });

    await logActivity(group._id, req.user._id, 'group_deleted', `Group "${group.name}" was archived`);

    res.json({ success: true, message: 'Group archived successfully' });
  } catch (error) {
    console.error('DELETE GROUP ERROR:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

module.exports = router;
