const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const Invitation = require('../../models/Invitation');
const Group = require('../../models/Group');
const User = require('../../models/User');
const ActivityLog = require('../../models/ActivityLog');
const { findExistingGroupForModule } = require('./helpers');

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
    const leader = group.members.find(m => m.user && m.user.toString() === req.user._id.toString() && m.role === 'leader');
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

    // RESTRICTION: A group leader (student) can only invite students from the SAME sub-group
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      const isSamePlacement = 
        invitedUser.year === group.year &&
        invitedUser.semester === group.semester &&
        invitedUser.mainGroup === group.mainGroup &&
        invitedUser.subGroup === group.subGroup;
      
      if (!isSamePlacement) {
        return res.status(400).json({ 
          error: `${invitedUser.name} is not in your sub-group (${group.year}·${group.semester}·MG${group.mainGroup}·SG${group.subGroup}). You can only invite students from your own class.` 
        });
      }
    }

    // Check not already a member
    const alreadyMember = group.members.some(m => m.user.toString() === userId);
    if (alreadyMember) {
      return res.status(400).json({ error: 'User is already a member of this group' });
    }

    // Check if user is already in another group for the same module
    const existingGroupForModule = await findExistingGroupForModule(userId, group.moduleCode, group._id);
    if (existingGroupForModule) {
      return res.status(400).json({
        error: `${invitedUser.name} is already in "${existingGroupForModule.name}" for module ${group.moduleCode}. They cannot join another group for the same module.`
      });
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
    console.error('INVITATION SEND ERROR:', error);
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

// PUT /api/module4/invitations/:id/accept - Accept invitation or join request
router.put('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) return res.status(404).json({ error: 'Invitation not found' });

    const isJoinRequest = invitation.type === 'join_request';

    // For regular invitations: only the invited user can accept
    // For join requests: only the invited user (leader) can approve
    if (invitation.invitedUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: isJoinRequest ? 'Only the group leader can approve join requests' : 'You cannot accept this invitation' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: `Invitation is already ${invitation.status}` });
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ error: 'This invitation has expired' });
    }

    const group = await Group.findById(invitation.group);
    if (!group) return res.status(404).json({ error: 'Group no longer exists' });

    // The user being added depends on the type:
    // - Regular invitation: the invitedUser (current user) joins
    // - Join request: the invitedBy (the requester) joins
    const userToAdd = isJoinRequest ? invitation.invitedBy : req.user._id;
    const userToAddName = isJoinRequest
      ? (await User.findById(userToAdd).select('name'))?.name || 'Unknown'
      : req.user.name;

    // Check module conflict for the user being added
    const existingGroupForModule = await findExistingGroupForModule(userToAdd, group.moduleCode, group._id);
    if (existingGroupForModule) {
      return res.status(400).json({
        error: isJoinRequest
          ? `${userToAddName} is already in "${existingGroupForModule.name}" for module ${group.moduleCode}.`
          : `You are already a member of "${existingGroupForModule.name}" for module ${group.moduleCode}. You cannot join another group for the same module.`
      });
    }

    // Check max members
    const activeCount = group.members.filter(m => m.status !== 'inactive').length;
    if (activeCount >= group.maxMembers) {
      return res.status(400).json({ error: 'Group is now full' });
    }

    // Add the user to the group
    const alreadyMember = group.members.some(m => m.user.toString() === userToAdd.toString());
    if (!alreadyMember) {
      group.members.push({ user: userToAdd, role: 'member', status: 'active' });
      await group.save();
    }

    invitation.status = 'accepted';
    invitation.respondedAt = new Date();
    await invitation.save();

    await logActivity(
      group._id, req.user._id,
      isJoinRequest ? 'join_request_accepted' : 'invitation_accepted',
      isJoinRequest
        ? `${req.user.name} approved ${userToAddName}'s join request`
        : `${req.user.name} accepted the invitation and joined the group`,
      userToAdd
    );

    res.json({
      success: true,
      message: isJoinRequest
        ? `Join request approved! ${userToAddName} is now a member.`
        : 'Invitation accepted! You are now a member.'
    });
  } catch (error) {
    console.error('INVITATION ACCEPT ERROR:', error);
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

    const isJoinRequest = invitation.type === 'join_request';

    invitation.status = 'declined';
    invitation.respondedAt = new Date();
    await invitation.save();

    await logActivity(
      invitation.group, req.user._id,
      isJoinRequest ? 'join_request_declined' : 'invitation_declined',
      isJoinRequest
        ? `${req.user.name} declined the join request`
        : `${req.user.name} declined the invitation`
    );

    res.json({ success: true, message: 'Invitation declined' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
