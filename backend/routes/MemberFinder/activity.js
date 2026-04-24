const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const ActivityLog = require('../../models/ActivityLog');
const Group = require('../../models/Group');

// GET /api/module4/activity/:groupId - Get activity timeline (paginated)
router.get('/:groupId', authMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) return res.status(404).json({ error: 'Group not found' });

        // Check access
        const isMember = group.members.some(m => m.user.toString() === req.user._id.toString());
        if (!isMember && req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.role !== 'instructor') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const total = await ActivityLog.countDocuments({ group: req.params.groupId });

        const activities = await ActivityLog.find({ group: req.params.groupId })
            .populate('performedBy', 'name email registrationNumber')
            .populate('targetUser', 'name email registrationNumber')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            activities,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/module4/activity/:groupId/stats - Get aggregated stats per member
router.get('/:groupId/stats', authMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId)
            .populate('members.user', 'name registrationNumber');
        if (!group) return res.status(404).json({ error: 'Group not found' });

        // Check access
        const isMember = group.members.some(m => {
            const memberId = m.user._id ? m.user._id.toString() : m.user.toString();
            return memberId === req.user._id.toString();
        });
        if (!isMember && req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.role !== 'instructor') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get action counts per user
        const actionStats = await ActivityLog.aggregate([
            { $match: { group: group._id } },
            {
                $group: {
                    _id: '$performedBy',
                    totalActions: { $sum: 1 },
                    actions: { $push: '$action' }
                }
            }
        ]);

        // Build stats per member
        const memberStats = group.members.map(member => {
            const userActions = actionStats.find(
                s => s._id.toString() === member.user._id.toString()
            );

            return {
                user: member.user,
                role: member.role,
                status: member.status,
                contributionScore: member.contributionScore,
                joinedAt: member.joinedAt,
                totalActions: userActions?.totalActions || 0
            };
        });

        // Overall stats
        const totalActivities = await ActivityLog.countDocuments({ group: group._id });
        const avgContribution = group.members.length > 0
            ? Math.round(group.members.reduce((sum, m) => sum + m.contributionScore, 0) / group.members.length)
            : 0;

        const groupAge = Math.ceil((new Date() - group.createdAt) / (1000 * 60 * 60 * 24));

        res.json({
            success: true,
            stats: {
                members: memberStats,
                summary: {
                    totalMembers: group.members.length,
                    activeMembers: group.members.filter(m => m.status === 'active').length,
                    pendingMembers: group.members.filter(m => m.status === 'pending').length,
                    inactiveMembers: group.members.filter(m => m.status === 'inactive').length,
                    totalActivities,
                    averageContribution: avgContribution,
                    groupAgeDays: groupAge
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/module4/activity/:groupId/contributions - Get contribution data for charts
router.get('/:groupId/contributions', authMiddleware, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId)
            .populate('members.user', 'name registrationNumber');
        if (!group) return res.status(404).json({ error: 'Group not found' });

        // Check access
        const isMember = group.members.some(m => {
            const memberId = m.user._id ? m.user._id.toString() : m.user.toString();
            return memberId === req.user._id.toString();
        });
        if (!isMember && req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.role !== 'instructor') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const contributions = group.members.map(member => ({
            name: member.user.name,
            registrationNumber: member.user.registrationNumber,
            role: member.role,
            status: member.status,
            contributionScore: member.contributionScore
        }));

        res.json({ success: true, contributions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
