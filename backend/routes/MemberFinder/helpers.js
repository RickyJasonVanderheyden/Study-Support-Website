const Group = require('../../models/Group');

/**
 * Check if a user is already an active member of any group
 * with the given module code.
 * 
 * @param {string} userId - The user's ObjectId
 * @param {string} moduleCode - The module code to check (e.g. "SE3040")
 * @param {string|null} excludeGroupId - Optional group ID to exclude (for updates)
 * @returns {Object|null} - The existing group if found, or null
 */
const findExistingGroupForModule = async (userId, moduleCode, excludeGroupId = null) => {
    const filter = {
        'members.user': userId,
        moduleCode: moduleCode.toUpperCase(),
        status: { $ne: 'archived' }
    };

    if (excludeGroupId) {
        filter._id = { $ne: excludeGroupId };
    }

    const group = await Group.findOne(filter).select('name moduleCode members');
    if (!group) return null;

    // Double-check: the user must be active/pending (not inactive) in that group
    const membership = group.members.find(
        m => m.user && m.user.toString() === userId.toString() && m.status !== 'inactive'
    );
    return membership ? group : null;
};

/**
 * Get a map of userId -> [{ groupName, moduleCode, groupId }]
 * for a list of user IDs. Used to show "already in group" badges.
 * 
 * @param {Array} userIds - Array of user ObjectIds
 * @returns {Object} - Map of userId string to array of group info
 */
const getUserGroupMap = async (userIds) => {
    const existingGroups = await Group.find({
        'members.user': { $in: userIds },
        status: { $ne: 'archived' }
    }).select('name moduleCode members');

    const userGroupMap = {};
    existingGroups.forEach(g => {
        g.members.forEach(m => {
            if (m.user && m.status !== 'inactive' && userIds.some(id => id && id.toString() === m.user.toString())) {
                const key = m.user.toString();
                if (!userGroupMap[key]) userGroupMap[key] = [];
                userGroupMap[key].push({
                    groupId: g._id,
                    groupName: g.name,
                    moduleCode: g.moduleCode
                });
            }
        });
    });

    return userGroupMap;
};

module.exports = { findExistingGroupForModule, getUserGroupMap };
