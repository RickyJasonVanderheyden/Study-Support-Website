const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
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

// Helper: Check if user is the group leader
const isLeader = (group, userId) => {
  return group.members.some(m => m.user.toString() === userId.toString() && m.role === 'leader');
};

// Helper: Check if user is a group member
const isMember = (group, userId) => {
  return group.members.some(m => m.user.toString() === userId.toString());
};

// GET /api/module4/members/browse - Browse students from same sub-group for team finding
router.get('/browse', authMiddleware, async (req, res) => {
  try {
    const { q, semester, year, mainGroup, subGroup } = req.query;
    const currentUser = await User.findById(req.user._id);

    // Build query: only activated students, exclude current user
    const query = {
      isActivated: true,
      role: 'student',
      _id: { $ne: req.user._id }
    };

    // By default, show students from the SAME sub-group
    if (currentUser.year && currentUser.semester && currentUser.mainGroup && currentUser.subGroup) {
      query.year = year || currentUser.year;
      query.semester = semester || currentUser.semester;
      query.mainGroup = mainGroup ? parseInt(mainGroup) : currentUser.mainGroup;
      query.subGroup = subGroup ? parseInt(subGroup) : currentUser.subGroup;
    } else {
      // If filters are provided manually
      if (year) query.year = year;
      if (semester) query.semester = semester;
      if (mainGroup) query.mainGroup = parseInt(mainGroup);
      if (subGroup) query.subGroup = parseInt(subGroup);
    }

    // Optional search by name, email, or skills
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { registrationNumber: { $regex: q, $options: 'i' } },
        { skills: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    const users = await User.find(query)
      .select('name email registrationNumber year semester mainGroup subGroup skills bio role')
      .sort({ name: 1 })
      .limit(60);

    res.json({
      success: true,
      users,
      currentPlacement: {
        year: currentUser.year,
        semester: currentUser.semester,
        mainGroup: currentUser.mainGroup,
        subGroup: currentUser.subGroup
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/module4/members/:groupId - Get all members of a group
router.get('/:groupId', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('members.user', 'name email registrationNumber semester skills bio role');

    if (!group) return res.status(404).json({ error: 'Group not found' });

    if (!isMember(group, req.user._id) && req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Optional filter by status
    let members = group.members;
    if (req.query.status) {
      members = members.filter(m => m.status === req.query.status);
    }

    res.json({ success: true, members, groupName: group.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/module4/members/:groupId/search - Search users to add
router.get('/:groupId/search', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!isLeader(group, req.user._id)) {
      return res.status(403).json({ error: 'Only the leader can search for new members' });
    }

    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    // Get existing member IDs to exclude
    const existingMemberIds = group.members.map(m => m.user.toString());

    const users = await User.find({
      $and: [
        { _id: { $nin: existingMemberIds } },
        { role: 'student' },
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { registrationNumber: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    }).select('name email registrationNumber semester skills bio').limit(20);

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/module4/members/:groupId/add - Add a member to the group
router.post('/:groupId/add', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!isLeader(group, req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the leader can add members' });
    }

    // Check group is active
    if (group.status !== 'active') {
      return res.status(400).json({ error: 'Cannot add members to an inactive group' });
    }

    // Check max members
    const activeCount = group.members.filter(m => m.status !== 'inactive').length;
    if (activeCount >= group.maxMembers) {
      return res.status(400).json({ error: `Group is full (max ${group.maxMembers} members)` });
    }

    // Check user exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) return res.status(404).json({ error: 'User not found' });

    // Check not already a member
    if (isMember(group, userId)) {
      return res.status(400).json({ error: 'User is already a member of this group' });
    }

    group.members.push({
      user: userId,
      role: 'member',
      status: 'active'
    });

    await group.save();

    await logActivity(
      group._id, req.user._id, 'member_added',
      `${userToAdd.name} was added to the group`,
      userId
    );

    const updated = await Group.findById(group._id)
      .populate('members.user', 'name email registrationNumber semester skills bio role');

    res.json({ success: true, members: updated.members });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/module4/members/:groupId/update/:userId - Update member role/status/contribution
router.put('/:groupId/update/:userId', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!isLeader(group, req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the leader can update members' });
    }

    const member = group.members.find(m => m.user.toString() === req.params.userId);
    if (!member) return res.status(404).json({ error: 'Member not found in this group' });

    const { role, status, contributionScore } = req.body;
    const changes = [];

    if (role && role !== member.role) {
      changes.push(`role: ${member.role} → ${role}`);
      member.role = role;

      await logActivity(
        group._id, req.user._id, 'member_role_changed',
        `Member role changed to ${role}`,
        req.params.userId,
        { oldRole: member.role, newRole: role }
      );
    }

    if (status && status !== member.status) {
      changes.push(`status: ${member.status} → ${status}`);

      await logActivity(
        group._id, req.user._id, 'member_status_changed',
        `Member status changed to ${status}`,
        req.params.userId,
        { oldStatus: member.status, newStatus: status }
      );

      member.status = status;
    }

    if (contributionScore !== undefined && contributionScore !== member.contributionScore) {
      changes.push(`contribution: ${member.contributionScore} → ${contributionScore}`);

      await logActivity(
        group._id, req.user._id, 'contribution_updated',
        `Contribution score updated to ${contributionScore}`,
        req.params.userId,
        { oldScore: member.contributionScore, newScore: contributionScore }
      );

      member.contributionScore = contributionScore;
    }

    await group.save();

    const updated = await Group.findById(group._id)
      .populate('members.user', 'name email registrationNumber semester skills bio role');

    res.json({ success: true, members: updated.members, changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/module4/members/:groupId/remove/:userId - Remove member
router.delete('/:groupId/remove/:userId', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!isLeader(group, req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the leader can remove members' });
    }

    const memberIndex = group.members.findIndex(m => m.user.toString() === req.params.userId);
    if (memberIndex === -1) return res.status(404).json({ error: 'Member not found' });

    // Cannot remove the leader
    if (group.members[memberIndex].role === 'leader') {
      return res.status(400).json({ error: 'Cannot remove the leader. Transfer leadership first.' });
    }

    const removedUser = await User.findById(req.params.userId).select('name');
    group.members.splice(memberIndex, 1);
    await group.save();

    await logActivity(
      group._id, req.user._id, 'member_removed',
      `${removedUser?.name || 'A member'} was removed from the group`,
      req.params.userId
    );

    const updated = await Group.findById(group._id)
      .populate('members.user', 'name email registrationNumber semester skills bio role');

    res.json({ success: true, members: updated.members });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/module4/members/:groupId/leave - Leave group
router.put('/:groupId/leave', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const member = group.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member) return res.status(404).json({ error: 'You are not a member of this group' });

    if (member.role === 'leader') {
      return res.status(400).json({ error: 'Leaders cannot leave. Transfer leadership first.' });
    }

    group.members = group.members.filter(m => m.user.toString() !== req.user._id.toString());
    await group.save();

    await logActivity(
      group._id, req.user._id, 'member_left',
      `${req.user.name} left the group`
    );

    res.json({ success: true, message: 'You have left the group' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/module4/members/:groupId/transfer/:userId - Transfer leadership
router.put('/:groupId/transfer/:userId', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!isLeader(group, req.user._id)) {
      return res.status(403).json({ error: 'Only the current leader can transfer leadership' });
    }

    const targetMember = group.members.find(m => m.user.toString() === req.params.userId);
    if (!targetMember) return res.status(404).json({ error: 'Target user is not a member' });
    if (targetMember.status !== 'active') {
      return res.status(400).json({ error: 'Can only transfer leadership to an active member' });
    }

    // Demote current leader
    const currentLeader = group.members.find(m => m.user.toString() === req.user._id.toString());
    currentLeader.role = 'member';

    // Promote target
    targetMember.role = 'leader';

    await group.save();

    const targetUser = await User.findById(req.params.userId).select('name');
    await logActivity(
      group._id, req.user._id, 'leadership_transferred',
      `Leadership transferred to ${targetUser?.name}`,
      req.params.userId
    );

    const updated = await Group.findById(group._id)
      .populate('members.user', 'name email registrationNumber semester skills bio role');

    res.json({ success: true, members: updated.members });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/module4/members/profile/:userId - Get member profile
router.get('/profile/:userId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('name email registrationNumber semester skills bio role createdAt');

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get groups this user belongs to
    const groups = await Group.find({
      'members.user': req.params.userId,
      status: { $ne: 'archived' }
    }).select('name moduleCode semester members status');

    // Calculate average contribution
    let totalContribution = 0;
    let groupCount = 0;
    const groupInfo = groups.map(g => {
      const membership = g.members.find(m => m.user.toString() === req.params.userId);
      if (membership) {
        totalContribution += membership.contributionScore;
        groupCount++;
      }
      return {
        _id: g._id,
        name: g.name,
        moduleCode: g.moduleCode,
        semester: g.semester,
        role: membership?.role,
        status: membership?.status,
        contributionScore: membership?.contributionScore,
        groupStatus: g.status
      };
    });

    const avgContribution = groupCount > 0 ? Math.round(totalContribution / groupCount) : 0;

    res.json({
      success: true,
      profile: {
        ...user.toObject(),
        groups: groupInfo,
        averageContribution: avgContribution,
        totalGroups: groupCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
