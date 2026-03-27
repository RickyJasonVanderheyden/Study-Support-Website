const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const Invitation = require('../../models/Invitation');
const Group = require('../../models/Group');
const User = require('../../models/User');
const ActivityLog = require('../../models/ActivityLog');

// Helper: Log activity
const logActivity = async (groupId, userId, action, details = '', targetUser = null, metadata = {}) => {
  await ActivityLog.create({
    group: groupId,
    performedBy: userId,
    action,
    targetUser,
    details,
    metadata
  });
};

// POST /api/module4/invitations/send - Send invitation
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { groupId, userId, message } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    // Only leader can send invitations
    const leader = group.members.find(m => m.user.toString() === req.user._id.toString() && m.role === 'leader');
    if (!leader && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the group leader can send invitations' });
    }

    // Check group is active
    if (group.status !== 'active') {
      return res.status(400).json({ error: 'Cannot send invitations for inactive groups' });
    }

    // Check max members
    const activeCount = group.members.filter(m => m.status !== 'inactive').length;
    if (activeCount >= group.maxMembers) {
      return res.status(400).json({ error: `Group is full (max ${group.maxMembers} members)` });
    }

    // Check user exists
    const invitedUser = await User.findById(userId);
    if (!invitedUser) return res.status(404).json({ error: 'User not found' });

    // Check not already a member
    const alreadyMember = group.members.some(m => m.user.toString() === userId);
    if (alreadyMember) {
      return res.status(400).json({ error: 'User is already a member of this group' });
    }

    // Check no pending invitation exists
    const existingInvite = await Invitation.findOne({
      group: groupId,
      invitedUser: userId,
      status: 'pending'
    });
    if (existingInvite) {
      return res.status(400).json({ error: 'An invitation is already pending for this user' });
    }

    const invitation = await Invitation.create({
      group: groupId,
      invitedBy: req.user._id,
      invitedUser: userId,
      message: message || '',
    });

    await logActivity(
      groupId, req.user._id, 'invitation_sent',
      `Invitation sent to ${invitedUser.name}`,
      userId
    );

    const populated = await Invitation.findById(invitation._id)
      .populate('group', 'name moduleCode semester')
      .populate('invitedBy', 'name email')
      .populate('invitedUser', 'name email registrationNumber');

    res.status(201).json({ success: true, invitation: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/module4/invitations/received - Get my pending invitations
router.get('/received', authMiddleware, async (req, res) => {
  try {
    // Auto-expire old invitations
    await Invitation.updateMany(
      { status: 'pending', expiresAt: { $lt: new Date() } },
      { status: 'expired' }
    );

    const invitations = await Invitation.find({
      invitedUser: req.user._id,
      status: 'pending'
    })
      .populate('group', 'name moduleCode semester status members')
      .populate('invitedBy', 'name email registrationNumber')
      .sort({ createdAt: -1 });

    res.json({ success: true, invitations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/module4/invitations/sent/:groupId - Get sent invitations for a group
router.get('/sent/:groupId', authMiddleware, async (req, res) => {
  try {
    const invitations = await Invitation.find({
      group: req.params.groupId
    })
      .populate('invitedUser', 'name email registrationNumber')
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, invitations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/module4/invitations/:id/accept - Accept invitation
router.put('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) return res.status(404).json({ error: 'Invitation not found' });

    // Only the invited user can accept
    if (invitation.invitedUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You cannot accept this invitation' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: `Invitation is already ${invitation.status}` });
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ error: 'This invitation has expired' });
    }

    // Add user to group
    const group = await Group.findById(invitation.group);
    if (!group) return res.status(404).json({ error: 'Group no longer exists' });

    // Check max members again
    const activeCount = group.members.filter(m => m.status !== 'inactive').length;
    if (activeCount >= group.maxMembers) {
      return res.status(400).json({ error: 'Group is now full' });
    }

    // Check not already a member
    const alreadyMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (!alreadyMember) {
      group.members.push({
        user: req.user._id,
        role: 'member',
        status: 'active'
      });
      await group.save();
    }

    invitation.status = 'accepted';
    invitation.respondedAt = new Date();
    await invitation.save();

    await logActivity(
      group._id, req.user._id, 'invitation_accepted',
      `${req.user.name} accepted the invitation and joined the group`
    );

    res.json({ success: true, message: 'Invitation accepted! You are now a member.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/module4/invitations/:id/decline - Decline invitation
router.put('/:id/decline', authMiddleware, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) return res.status(404).json({ error: 'Invitation not found' });

    if (invitation.invitedUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You cannot decline this invitation' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: `Invitation is already ${invitation.status}` });
    }

    invitation.status = 'declined';
    invitation.respondedAt = new Date();
    await invitation.save();

    await logActivity(
      invitation.group, req.user._id, 'invitation_declined',
      `${req.user.name} declined the invitation`
    );

    res.json({ success: true, message: 'Invitation declined' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
