const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Group = require('../models/Group');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const ActivityLog = require('../models/ActivityLog');
const { getUserGroupMap, findExistingGroupForModule } = require('../routes/MemberFinder/helpers');
const { generateChatResponse } = require('../services/groqService');

// Simple in-memory rate limiter (per user, 10 messages/minute)
const rateLimits = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 1000;

const checkRateLimit = (userId) => {
  const now = Date.now();
  const userKey = userId.toString();
  const userData = rateLimits.get(userKey);
  if (!userData || now - userData.windowStart > RATE_WINDOW) {
    rateLimits.set(userKey, { windowStart: now, count: 1 });
    return true;
  }
  if (userData.count >= RATE_LIMIT) return false;
  userData.count++;
  return true;
};

// ==========================================
// INTENT DETECTION
// ==========================================

const MODULE_CODE_REGEX = /\b([A-Za-z]{2,4}\s?\d{3,4})\b/g;

const detectIntent = (message, userRole) => {
  const msg = message.toLowerCase();

  // Extract module codes
  const moduleCodes = [];
  let match;
  while ((match = MODULE_CODE_REGEX.exec(message)) !== null) {
    moduleCodes.push(match[1].replace(/\s/g, '').toUpperCase());
  }

  // ---- REDIRECT INTENTS (Leave / Create) ----
  if (msg.includes('leave') && (msg.includes('group') || msg.includes('team'))) {
    return { intent: 'redirect_leave', moduleCodes };
  }
  if ((msg.includes('create') || msg.includes('make') || msg.includes('start')) && (msg.includes('group') || msg.includes('team'))) {
    return { intent: 'redirect_create', moduleCodes };
  }

  // Request to join: "I want to join Earth", "join Earth group", "can I join Sun"
  const joinMatch = msg.match(/(?:want to |wanna |can i |i want to |i wanna |let me )?join\s+(?:the\s+)?(?:group\s+)?(.+?)(?:\s+group)?$/i)
    || msg.match(/join\s+(.+)/i);
  if (joinMatch && !msg.includes('create') && !msg.includes('how')) {
    const groupName = joinMatch[1].replace(/\s*group\s*$/i, '').trim();
    if (groupName && groupName.length > 1 && !['a', 'the', 'any', 'some'].includes(groupName.toLowerCase())) {
      return { intent: 'action_request_join', groupName, moduleCodes };
    }
  }

  // ---- ACTION INTENTS ----
  // Invite: "invite Janu to Earth", "send invite to Kasun"
  const inviteMatch = msg.match(/invite\s+(\w+)\s+to\s+(.+)/i) || msg.match(/send\s+invite?\s+to\s+(\w+)/i);
  if (inviteMatch) {
    return {
      intent: 'action_invite',
      targetName: inviteMatch[1],
      groupName: inviteMatch[2] || '',
      moduleCodes
    };
  }

  // Accept: "accept Phoenix", "accept invitation"
  const acceptMatch = msg.match(/accept\s+(.+)/i);
  if (acceptMatch && !msg.includes('how') && !msg.includes('can i')) {
    return { intent: 'action_accept', targetName: acceptMatch[1].trim(), moduleCodes };
  }

  // Decline: "decline Dragon", "reject invitation"
  const declineMatch = msg.match(/(decline|reject)\s+(.+)/i);
  if (declineMatch) {
    return { intent: 'action_decline', targetName: declineMatch[2].trim(), moduleCodes };
  }

  // ---- MY STATUS ----
  if (
    msg.includes('my group') || msg.includes('my team') ||
    msg.includes('am i in') || msg.includes('my status') ||
    (msg.includes('what group') && msg.includes('i ')) ||
    msg.includes('my invitation') || msg.includes('pending invitation')
  ) {
    return { intent: 'my_status', moduleCodes };
  }

  // ---- RULES ----
  if (
    msg.includes('rule') || msg.includes('how many') || msg.includes('limit') ||
    msg.includes('can i join') || msg.includes('maximum') || msg.includes('allowed') ||
    msg.includes('one group')
  ) {
    return { intent: 'rules', moduleCodes: [] };
  }

  // ---- ADMIN-ONLY INTENTS ----
  if (userRole === 'admin' || userRole === 'instructor') {
    if (msg.includes('unassigned') || msg.includes('without group') || msg.includes("don't have") || msg.includes('no group')) {
      return { intent: 'admin_unassigned', moduleCodes };
    }
    if (msg.includes('activity') || msg.includes('who left') || msg.includes('recent change') || msg.includes('what happened')) {
      return { intent: 'admin_activity', moduleCodes };
    }
    if (msg.includes('summary') || msg.includes('overview') || msg.includes('stats') || msg.includes('dashboard')) {
      return { intent: 'admin_stats', moduleCodes };
    }
    if (msg.includes('all group') || msg.includes('list group') || msg.includes('show group') || msg.includes('how many group')) {
      return { intent: 'admin_all_groups', moduleCodes };
    }
    if (msg.includes('detail') || msg.includes('info about') || msg.includes('tell me about')) {
      // Try to extract a group name
      const detailMatch = msg.match(/(?:detail|info about|tell me about)\s+(.+)/i);
      return { intent: 'admin_group_detail', groupName: detailMatch ? detailMatch[1].trim() : '', moduleCodes };
    }
  }

  // ---- GROUP RECOMMENDATION ----
  if (
    msg.includes('group') || msg.includes('join') || msg.includes('recommend') ||
    msg.includes('available') || msg.includes('find a group') || msg.includes('suggest') ||
    msg.includes('which group') || msg.includes('open group') || msg.includes('vacant') ||
    msg.includes('module') || msg.includes('members in')
  ) {
    if (moduleCodes.length > 0 || msg.includes('group') || msg.includes('available')) {
      return { intent: 'group_recommendation', moduleCodes };
    }
  }

  // ---- PEER CHECK ----
  const excludeWords = [
    'my', 'a', 'the', 'any', 'i', 'what', 'which', 'there', 'this', 'how',
    'are', 'is', 'do', 'does', 'can', 'will', 'available', 'other', 'all',
    'some', 'find', 'show', 'get', 'who', 'where', 'when', 'that', 'group',
    'module', 'team', 'member', 'members', 'student', 'students'
  ];
  const peerPatterns = [
    /is\s+(\w+)\s+(in|joined|part of|member of)/i,
    /does\s+(\w+)\s+have/i,
    /check\s+(\w+)/i,
    /(\w+)'s\s+group/i
  ];
  // Admin can also look up any student
  if (userRole === 'admin' || userRole === 'instructor') {
    const studentLookup = msg.match(/(?:what|show|find)\s+(?:groups?\s+(?:is|does))?\s*(\w+)\s+(?:in|have|joined)/i);
    if (studentLookup && !excludeWords.includes(studentLookup[1].toLowerCase())) {
      return { intent: 'admin_student_lookup', peerName: studentLookup[1], moduleCodes };
    }
  }
  for (const pattern of peerPatterns) {
    const peerMatch = msg.match(pattern);
    if (peerMatch && peerMatch[1] && !excludeWords.includes(peerMatch[1].toLowerCase())) {
      return { intent: userRole === 'admin' ? 'admin_student_lookup' : 'peer_check', peerName: peerMatch[1], moduleCodes };
    }
  }

  // ---- MEMBER SEARCH ----
  if (
    msg.includes('who') || msg.includes('find member') || msg.includes('find student') ||
    msg.includes('knows') || msg.includes('skill') || msg.includes('teammate') ||
    msg.includes('classmate') || msg.includes('developer') || msg.includes('looking for')
  ) {
    const skillTerms = extractSkills(msg);
    return { intent: 'member_search', searchQuery: skillTerms.length > 0 ? skillTerms.join(', ') : message, skills: skillTerms };
  }

  // Module code fallback
  if (moduleCodes.length > 0) {
    return { intent: 'group_recommendation', moduleCodes };
  }

  return { intent: 'general', moduleCodes: [] };
};

const extractSkills = (message) => {
  const techSkills = [
    'react', 'node', 'nodejs', 'python', 'java', 'javascript', 'typescript',
    'mongodb', 'mysql', 'sql', 'express', 'angular', 'vue', 'flutter', 'dart',
    'swift', 'kotlin', 'php', 'laravel', 'spring', 'django', 'flask',
    'aws', 'docker', 'git', 'css', 'html', 'tailwind', 'bootstrap',
    'figma', 'ui', 'ux', 'machine learning', 'ml', 'ai', 'deep learning',
    'c++', 'c#', 'rust', 'go', 'ruby', 'scala', 'r', 'matlab',
    'firebase', 'graphql', 'rest', 'api', 'nextjs', 'nest',
    'android', 'ios', 'mobile', 'web', 'backend', 'frontend', 'fullstack',
    'devops', 'testing', 'agile', 'scrum', '.net', 'wordpress'
  ];
  const msg = message.toLowerCase();
  return techSkills.filter(skill => msg.includes(skill));
};

// ==========================================
// CONTEXT GATHERING (MongoDB Queries)
// ==========================================

const gatherContext = async (intent, user) => {
  const context = { intent: intent.intent, data: {} };
  const isAdmin = user.role === 'admin' || user.role === 'instructor';

  switch (intent.intent) {

    // ---- REDIRECT INTENTS ----
    case 'redirect_leave': {
      // Check user's current groups to give helpful info
      const myGroups = await Group.find({
        'members.user': user._id,
        status: 'active'
      }).select('name moduleCode');
      context.data.myGroups = myGroups.map(g => ({ name: g.name, moduleCode: g.moduleCode }));
      break;
    }

    case 'redirect_create': {
      // Check if user already in a group for the mentioned module
      const moduleCode = intent.moduleCodes[0];
      context.data.moduleCode = moduleCode || null;
      if (moduleCode) {
        const existing = await findExistingGroupForModule(user._id, moduleCode);
        context.data.alreadyInGroup = existing ? existing.name : null;
      }
      break;
    }

    // ---- ACTION INTENTS ----
    case 'action_invite': {
      
      // Find the target student (restricted to same sub-group for students)
      const targetQuery = {
        name: { $regex: intent.targetName, $options: 'i' },
        role: 'student'
      };
      if (!isAdmin) {
        targetQuery.year = user.year;
        targetQuery.semester = user.semester;
        targetQuery.mainGroup = user.mainGroup;
        targetQuery.subGroup = user.subGroup;
      }
      const targetUser = await User.findOne(targetQuery).select('name registrationNumber year semester mainGroup subGroup');

      // Find the group
      let targetGroup = null;
      if (intent.groupName) {
        targetGroup = await Group.findOne({
          name: { $regex: intent.groupName.trim(), $options: 'i' },
          'members.user': user._id,
          status: 'active'
        });
      }

      // If no group name, try user's groups where they're leader
      if (!targetGroup) {
        const leaderGroups = await Group.find({
          'members': { $elemMatch: { user: user._id, role: 'leader' } },
          status: 'active'
        });
        if (leaderGroups.length === 1) {
          targetGroup = leaderGroups[0];
        }
        context.data.leaderGroups = leaderGroups.map(g => ({ name: g.name, moduleCode: g.moduleCode, id: g._id }));
      }

      if (targetUser && targetGroup) {
        // Validate
        const isLeader = (targetGroup.members || []).some(m => m.user && m.user.toString() === user._id.toString() && m.role === 'leader');
        const alreadyMember = (targetGroup.members || []).some(m => m.user && m.user.toString() === targetUser._id.toString());
        const activeCount = (targetGroup.members || []).filter(m => m.status !== 'inactive').length;
        const isFull = activeCount >= targetGroup.maxMembers;
        const moduleConflict = await findExistingGroupForModule(targetUser._id, targetGroup.moduleCode, targetGroup._id);
        const existingInvite = await Invitation.findOne({ group: targetGroup._id, invitedUser: targetUser._id, status: 'pending' });
        
        // Placement check
        const isSamePlacement = isAdmin || (
          targetUser.year === targetGroup.year &&
          targetUser.semester === targetGroup.semester &&
          targetUser.mainGroup === targetGroup.mainGroup &&
          targetUser.subGroup === targetGroup.subGroup
        );

        context.data.action = {
          targetUser: { id: targetUser._id, name: targetUser.name, regNo: targetUser.registrationNumber },
          group: { id: targetGroup._id, name: targetGroup.name, moduleCode: targetGroup.moduleCode, activeMembers: activeCount, maxMembers: targetGroup.maxMembers },
          validation: {
            isLeader,
            alreadyMember,
            isFull,
            isSamePlacement,
            moduleConflict: moduleConflict ? moduleConflict.name : null,
            hasExistingInvite: !!existingInvite,
            canInvite: isLeader && !alreadyMember && !isFull && !moduleConflict && !existingInvite && isSamePlacement
          }
        };
      } else {
        context.data.action = {
          targetUser: targetUser ? { name: targetUser.name } : null,
          group: targetGroup ? { name: targetGroup.name } : null,
          targetNotFound: !targetUser,
          groupNotFound: !targetGroup,
          searchedName: intent.targetName,
          searchedGroup: intent.groupName
        };
      }
      break;
    }

    case 'action_request_join': {
      // Find the group the student wants to join
      const groupName = intent.groupName;
      const targetGroup = await Group.findOne({
        name: { $regex: groupName, $options: 'i' },
        status: 'active'
      }).populate('members.user', 'name').populate('createdBy', 'name');

      if (targetGroup) {
        const activeMembers = (targetGroup.members || []).filter(m => m.status !== 'inactive');
        const isFull = activeMembers.length >= targetGroup.maxMembers;
        const alreadyMember = activeMembers.some(m => m.user && m.user._id && m.user._id.toString() === user._id.toString());
        const moduleConflict = await findExistingGroupForModule(user._id, targetGroup.moduleCode, targetGroup._id);
        const leader = (targetGroup.members || []).find(m => m.role === 'leader');
        const existingRequest = await Invitation.findOne({
          group: targetGroup._id, invitedBy: user._id, type: 'join_request', status: 'pending'
        });

        context.data.joinRequest = {
          group: {
            id: targetGroup._id, name: targetGroup.name, moduleCode: targetGroup.moduleCode,
            activeMembers: activeMembers.length, maxMembers: targetGroup.maxMembers,
            spotsLeft: targetGroup.maxMembers - activeMembers.length,
            tags: targetGroup.tags || [],
            leader: leader?.user?.name || 'Unknown',
            leaderId: leader?.user?._id
          },
          validation: {
            isFull, alreadyMember,
            moduleConflict: moduleConflict ? moduleConflict.name : null,
            hasExistingRequest: !!existingRequest,
            canJoin: !isFull && !alreadyMember && !moduleConflict && !existingRequest
          }
        };
      } else {
        context.data.joinRequest = { group: null, searchedName: groupName };
      }
      break;
    }

    case 'action_accept':
    case 'action_decline': {
      const invitations = await Invitation.find({
        invitedUser: user._id,
        status: 'pending'
      }).populate('group', 'name moduleCode members maxMembers');

      // Find matching invitation
      const targetName = intent.targetName.toLowerCase();
      const matchedInvite = invitations.find(inv =>
        inv.group && inv.group.name.toLowerCase().includes(targetName)
      );

      context.data.invitations = invitations.map(inv => ({
        id: inv._id,
        groupName: inv.group?.name,
        moduleCode: inv.group?.moduleCode,
        message: inv.message
      }));

      if (matchedInvite) {
        // Check module conflict for accept
        let moduleConflict = null;
        if (intent.intent === 'action_accept') {
          moduleConflict = await findExistingGroupForModule(user._id, matchedInvite.group.moduleCode, matchedInvite.group._id);
        }
        const activeCount = (matchedInvite.group.members || []).filter(m => m.status !== 'inactive').length;
        context.data.matchedInvite = {
          id: matchedInvite._id,
          groupName: matchedInvite.group.name,
          moduleCode: matchedInvite.group.moduleCode,
          activeMembers: activeCount,
          maxMembers: matchedInvite.group.maxMembers,
          isFull: activeCount >= matchedInvite.group.maxMembers,
          moduleConflict: moduleConflict ? moduleConflict.name : null
        };
      }
      break;
    }

    // ---- EXISTING INTENTS (unchanged logic) ----
    case 'group_recommendation': {
      const moduleCode = intent.moduleCodes[0];
      const query = { status: 'active' };
      if (!isAdmin) {
        query.year = user.year;
        query.semester = user.semester;
        query.mainGroup = user.mainGroup;
        query.subGroup = user.subGroup;
      }
      if (moduleCode) {
        query.moduleCode = moduleCode;
        context.data.moduleCode = moduleCode;
      }
      const groups = await Group.find(query)
        .populate('members.user', 'name skills')
        .sort({ createdAt: -1 }).limit(10);

      context.data.groups = groups.map(g => {
        const activeMembers = (g.members || []).filter(m => m.status !== 'inactive');
        const leader = (g.members || []).find(m => m.role === 'leader');
        return {
          name: g.name, moduleCode: g.moduleCode,
          activeMembers: activeMembers.length, maxMembers: g.maxMembers,
          spotsLeft: g.maxMembers - activeMembers.length,
          leader: leader?.user?.name || 'Unknown',
          tags: g.tags || [],
          memberNames: activeMembers.map(m => m.user?.name || 'Unknown')
        };
      });
      if (moduleCode) {
        const userGroup = await Group.findOne({ moduleCode, 'members.user': user._id, status: 'active' });
        context.data.userAlreadyInModule = userGroup ? userGroup.name : null;
      }
      break;
    }

    case 'member_search': {
      const skillQuery = intent.skills && intent.skills.length > 0
        ? { skills: { $in: intent.skills.map(s => new RegExp(s, 'i')) } }
        : { $or: [
            { name: { $regex: intent.searchQuery, $options: 'i' } },
            { skills: { $in: [new RegExp(intent.searchQuery, 'i')] } }
          ]};
      const memberFilter = {
        ...skillQuery,
        _id: { $ne: user._id },
        role: 'student',
        isActivated: true
      };
      if (!isAdmin) {
        memberFilter.year = user.year;
        memberFilter.semester = user.semester;
        memberFilter.mainGroup = user.mainGroup;
        memberFilter.subGroup = user.subGroup;
      }
      const members = await User.find(memberFilter).select('name registrationNumber skills bio year semester mainGroup subGroup').limit(10);
      const userIds = members.map(m => m._id);
      const groupMap = await getUserGroupMap(userIds);
      context.data.searchQuery = intent.searchQuery;
      context.data.members = members.map(m => ({
        name: m.name, registrationNumber: m.registrationNumber,
        skills: m.skills || [], bio: m.bio || '',
        placement: isAdmin ? `${m.year}·${m.semester}·MG${String(m.mainGroup||1).padStart(2,'0')}·SG${m.subGroup||1}` : '',
        groupStatus: groupMap[m._id.toString()]
          ? `(In: ${groupMap[m._id.toString()].map(g => `${g.groupName} for ${g.moduleCode}`).join(', ')})`
          : '(No groups — available ✅)'
      }));
      break;
    }

    case 'my_status': {
      const myGroups = await Group.find({ 'members.user': user._id, status: { $ne: 'archived' } }).populate('members.user', 'name');
      context.data.myGroups = myGroups.map(g => {
        const myMem = (g.members || []).find(m => m.user && m.user._id && m.user._id.toString() === user._id.toString());
        const active = (g.members || []).filter(m => m.status !== 'inactive');
        return {
          name: g.name, moduleCode: g.moduleCode, role: myMem?.role || 'member',
          status: g.status, memberCount: active.length, maxMembers: g.maxMembers,
          memberNames: active.map(m => m.user?.name || 'Unknown')
        };
      }).filter(g => g.role);
      // Also get pending invitations
      const pendingInvites = await Invitation.find({ invitedUser: user._id, status: 'pending' }).populate('group', 'name moduleCode');
      context.data.pendingInvitations = pendingInvites.map(inv => ({
        groupName: inv.group?.name, moduleCode: inv.group?.moduleCode, message: inv.message
      }));
      break;
    }

    case 'peer_check': {
      const peer = await User.findOne({
        name: { $regex: intent.peerName, $options: 'i' }, role: 'student',
        year: user.year, semester: user.semester, mainGroup: user.mainGroup, subGroup: user.subGroup
      }).select('name registrationNumber skills');
      if (peer) {
        const peerGroups = await Group.find({ 'members.user': peer._id, status: 'active' }).select('name moduleCode members maxMembers');
        context.data.peerInfo = {
          name: peer.name, registrationNumber: peer.registrationNumber, skills: peer.skills || [],
          groups: peerGroups.map(g => {
            const ac = (g.members || []).filter(m => m.status !== 'inactive').length;
            return { groupName: g.name, moduleCode: g.moduleCode, memberCount: ac, maxMembers: g.maxMembers, spotsLeft: g.maxMembers - ac };
          })
        };
      } else {
        context.data.peerInfo = null;
        context.data.searchedName = intent.peerName;
      }
      break;
    }

    case 'rules':
      context.data = { rules: 'static' };
      break;

    // ---- ADMIN INTENTS ----
    case 'admin_all_groups': {
      const query = { status: 'active' };
      if (intent.moduleCodes[0]) query.moduleCode = intent.moduleCodes[0];
      const groups = await Group.find(query).populate('members.user', 'name').sort({ moduleCode: 1, year: 1 });
      context.data.moduleCode = intent.moduleCodes[0] || 'all';
      context.data.groups = groups.map(g => {
        const active = (g.members || []).filter(m => m.status !== 'inactive');
        const leader = (g.members || []).find(m => m.role === 'leader');
        return {
          name: g.name, moduleCode: g.moduleCode,
          placement: `${g.year}·${g.semester}·MG${String(g.mainGroup||1).padStart(2,'0')}·SG${g.subGroup||1}`,
          activeMembers: active.length, maxMembers: g.maxMembers,
          spotsLeft: g.maxMembers - active.length,
          leader: leader?.user?.name || 'Unknown',
          isFull: active.length >= g.maxMembers
        };
      });
      context.data.totalGroups = groups.length;
      context.data.totalSpots = groups.reduce((sum, g) => sum + g.maxMembers, 0);
      context.data.filledSpots = groups.reduce((sum, g) => sum + (g.members || []).filter(m => m.status !== 'inactive').length, 0);
      break;
    }

    case 'admin_unassigned': {
      const moduleCode = intent.moduleCodes[0];
      if (!moduleCode) {
        context.data.error = 'Please specify a module code, e.g., "Who doesn\'t have a group for SE3040?"';
        break;
      }
      context.data.moduleCode = moduleCode;
      const groupsForModule = await Group.find({ moduleCode, status: 'active' });
      const assignedUserIds = new Set();
      groupsForModule.forEach(g => {
        (g.members || []).forEach(m => { if (m.status !== 'inactive') assignedUserIds.add(m.user.toString()); });
      });
      const allStudents = await User.find({ role: 'student', isActivated: true }).select('name registrationNumber year semester mainGroup subGroup');
      const unassigned = allStudents.filter(s => !assignedUserIds.has(s._id.toString()));
      context.data.unassigned = unassigned.map(s => ({
        name: s.name, registrationNumber: s.registrationNumber,
        placement: `${s.year||'?'}·${s.semester||'?'}·MG${String(s.mainGroup||'?').toString().padStart(2,'0')}·SG${s.subGroup||'?'}`
      }));
      context.data.totalStudents = allStudents.length;
      context.data.assignedCount = assignedUserIds.size;
      break;
    }

    case 'admin_activity': {
      const daysAgo = 7;
      const since = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const activities = await ActivityLog.find({ createdAt: { $gte: since } })
        .populate('performedBy', 'name')
        .populate('targetUser', 'name')
        .populate('group', 'name moduleCode')
        .sort({ createdAt: -1 }).limit(20);
      context.data.activities = activities.map(a => ({
        action: a.action, details: a.details,
        performedBy: a.performedBy?.name || 'Unknown',
        targetUser: a.targetUser?.name || null,
        groupName: a.group?.name || 'Unknown',
        moduleCode: a.group?.moduleCode || '',
        time: a.createdAt
      }));
      context.data.period = `Last ${daysAgo} days`;
      break;
    }

    case 'admin_group_detail': {
      const groupName = intent.groupName;
      const group = await Group.findOne({ name: { $regex: groupName, $options: 'i' } })
        .populate('members.user', 'name registrationNumber skills')
        .populate('createdBy', 'name');
      if (group) {
        const activities = await ActivityLog.find({ group: group._id })
          .populate('performedBy', 'name').sort({ createdAt: -1 }).limit(10);
        context.data.group = {
          name: group.name, moduleCode: group.moduleCode, status: group.status,
          placement: `${group.year}·${group.semester}·MG${String(group.mainGroup||1).padStart(2,'0')}·SG${group.subGroup||1}`,
          createdAt: group.createdAt, createdBy: group.createdBy?.name,
          members: (group.members || []).map(m => ({
            name: m.user?.name, regNo: m.user?.registrationNumber, role: m.role,
            status: m.status, joinedAt: m.joinedAt, score: m.contributionScore, skills: m.user?.skills || []
          })),
          tags: group.tags, maxMembers: group.maxMembers
        };
        context.data.history = activities.map(a => ({
          action: a.action, details: a.details, by: a.performedBy?.name, time: a.createdAt
        }));
      } else {
        context.data.group = null;
        context.data.searchedName = groupName;
      }
      break;
    }

    case 'admin_stats': {
      const allGroups = await Group.find({ status: 'active' });
      const allStudents = await User.countDocuments({ role: 'student', isActivated: true });
      const pendingInvites = await Invitation.countDocuments({ status: 'pending' });

      // Module breakdown
      const moduleMap = {};
      let totalFilled = 0;
      allGroups.forEach(g => {
        const active = (g.members || []).filter(m => m.status !== 'inactive').length;
        totalFilled += active;
        if (!moduleMap[g.moduleCode]) moduleMap[g.moduleCode] = { groups: 0, filled: 0, total: 0 };
        moduleMap[g.moduleCode].groups++;
        moduleMap[g.moduleCode].filled += active;
        moduleMap[g.moduleCode].total += g.maxMembers;
      });

      context.data = {
        totalStudents: allStudents,
        totalGroups: allGroups.length,
        totalSpots: allGroups.reduce((s, g) => s + g.maxMembers, 0),
        filledSpots: totalFilled,
        pendingInvitations: pendingInvites,
        modules: Object.entries(moduleMap).map(([code, d]) => ({
          moduleCode: code, groups: d.groups, filled: d.filled, total: d.total
        }))
      };
      break;
    }

    case 'admin_student_lookup': {
      const peerName = intent.peerName;
      const peer = await User.findOne({ name: { $regex: peerName, $options: 'i' }, role: 'student' })
        .select('name registrationNumber skills bio year semester mainGroup subGroup');
      if (peer) {
        const peerGroups = await Group.find({ 'members.user': peer._id, status: { $ne: 'archived' } }).select('name moduleCode members maxMembers status');
        const recentActivity = await ActivityLog.find({
          $or: [{ performedBy: peer._id }, { targetUser: peer._id }]
        }).sort({ createdAt: -1 }).limit(5);
        context.data.peerInfo = {
          name: peer.name, registrationNumber: peer.registrationNumber,
          skills: peer.skills || [], bio: peer.bio || '',
          placement: `${peer.year||'?'}·${peer.semester||'?'}·MG${String(peer.mainGroup||'?').toString().padStart(2,'0')}·SG${peer.subGroup||'?'}`,
          groups: peerGroups.map(g => {
            const mem = (g.members || []).find(m => m.user && m.user.toString() === peer._id.toString());
            return { groupName: g.name, moduleCode: g.moduleCode, role: mem?.role, status: g.status };
          }),
          recentActivity: recentActivity.length
        };
      } else {
        context.data.peerInfo = null;
        context.data.searchedName = peerName;
      }
      break;
    }

    default:
      context.data = {};
      break;
  }

  return context;
};

// ==========================================
// MAIN CHAT ENDPOINT
// ==========================================

router.post('/ask', authMiddleware, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });
    if (!checkRateLimit(req.user._id)) {
      return res.status(429).json({ reply: 'You\'re sending messages too fast! Please wait a moment. 😊' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    // 1. Detect intent (role-aware)
    const intent = detectIntent(message, user.role);
    console.log(`[Chatbot] User: ${user.name} (${user.role}) | Intent: ${intent.intent} | Message: "${message.substring(0, 60)}"`);

    // 2. Gather context
    const context = await gatherContext(intent, user);
    context.user = {
      name: user.name, registrationNumber: user.registrationNumber,
      role: user.role, year: user.year, semester: user.semester,
      mainGroup: user.mainGroup, subGroup: user.subGroup
    };

    // 3. Generate response (with conversation history for multi-turn)
    const reply = await generateChatResponse(message, context, history || []);

    // 4. Build response
    const response = {
      success: true, reply,
      suggestions: generateSuggestions(intent, context, user.role),
      intent: intent.intent
    };

    // 5. Add action data if applicable (for confirmation buttons)
    if (intent.intent === 'action_invite' && context.data.action?.validation?.canInvite) {
      response.action = {
        type: 'invite',
        userId: context.data.action.targetUser.id,
        groupId: context.data.action.group.id,
        label: `Send invitation to ${context.data.action.targetUser.name} for ${context.data.action.group.name}`
      };
    }
    if (intent.intent === 'action_accept' && context.data.matchedInvite && !context.data.matchedInvite.isFull && !context.data.matchedInvite.moduleConflict) {
      response.action = {
        type: 'accept',
        invitationId: context.data.matchedInvite.id,
        label: `Accept invitation for ${context.data.matchedInvite.groupName}`
      };
    }
    if (intent.intent === 'action_decline' && context.data.matchedInvite) {
      response.action = {
        type: 'decline',
        invitationId: context.data.matchedInvite.id,
        label: `Decline invitation for ${context.data.matchedInvite.groupName}`
      };
    }
    if (intent.intent === 'action_request_join' && context.data.joinRequest?.validation?.canJoin) {
      response.action = {
        type: 'request_join',
        groupId: context.data.joinRequest.group.id,
        leaderId: context.data.joinRequest.group.leaderId,
        label: `Send join request to ${context.data.joinRequest.group.leader} for ${context.data.joinRequest.group.name}`
      };
    }

    res.json(response);
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ reply: 'Sorry, something went wrong. Please try again! 🔄' });
  }
});

// ==========================================
// EXECUTE ACTION ENDPOINT
// ==========================================

router.post('/execute', authMiddleware, async (req, res) => {
  try {
    const { type, userId, groupId, invitationId } = req.body;
    const user = await User.findById(req.user._id);

    if (type === 'invite') {
      const group = await Group.findById(groupId);
      if (!group) return res.json({ success: false, reply: '❌ Group not found.' });

      const isLeader = (group.members || []).some(m => m.user && m.user.toString() === user._id.toString() && m.role === 'leader');
      if (!isLeader) return res.json({ success: false, reply: '❌ You\'re not the leader of this group.' });

      const invitedUser = await User.findById(userId);
      if (!invitedUser) return res.json({ success: false, reply: '❌ Student not found.' });

      const moduleConflict = await findExistingGroupForModule(userId, group.moduleCode, group._id);
      if (moduleConflict) return res.json({ success: false, reply: `❌ ${invitedUser.name} is already in "${moduleConflict.name}" for ${group.moduleCode}.` });

      const existing = await Invitation.findOne({ group: groupId, invitedUser: userId, status: 'pending' });
      if (existing) return res.json({ success: false, reply: '❌ An invitation is already pending for this student.' });

      await Invitation.create({ group: groupId, invitedBy: user._id, invitedUser: userId, message: 'Invited via Member Finder Assistant chatbot' });
      await ActivityLog.create({ group: groupId, performedBy: user._id, action: 'invitation_sent', targetUser: userId, details: `Invitation sent via Member Finder Assistant to ${invitedUser.name}` });

      return res.json({ success: true, reply: `✅ Invitation sent to ${invitedUser.name} for "${group.name}" (${group.moduleCode})! They'll see it in their pending invitations.` });
    }

    if (type === 'accept') {
      const invitation = await Invitation.findById(invitationId);
      if (!invitation || invitation.invitedUser.toString() !== user._id.toString()) {
        return res.json({ success: false, reply: '❌ Invitation not found.' });
      }
      if (invitation.status !== 'pending') return res.json({ success: false, reply: '❌ This invitation is no longer pending.' });

      const group = await Group.findById(invitation.group);
      if (!group) return res.json({ success: false, reply: '❌ Group no longer exists.' });

      const moduleConflict = await findExistingGroupForModule(user._id, group.moduleCode, group._id);
      if (moduleConflict) return res.json({ success: false, reply: `❌ You're already in "${moduleConflict.name}" for ${group.moduleCode}.` });

      const alreadyMember = (group.members || []).some(m => m.user && m.user.toString() === user._id.toString());
      if (!alreadyMember) {
        group.members.push({ user: user._id, role: 'member', status: 'active' });
        await group.save();
      }
      invitation.status = 'accepted';
      invitation.respondedAt = new Date();
      await invitation.save();
      await ActivityLog.create({ group: group._id, performedBy: user._id, action: 'invitation_accepted', details: `${user.name} accepted invitation via chatbot` });

      return res.json({ success: true, reply: `✅ You joined "${group.name}" for ${group.moduleCode}! Welcome to the team! 🎉` });
    }

    if (type === 'decline') {
      const invitation = await Invitation.findById(invitationId);
      if (!invitation || invitation.invitedUser.toString() !== user._id.toString()) {
        return res.json({ success: false, reply: '❌ Invitation not found.' });
      }
      invitation.status = 'declined';
      invitation.respondedAt = new Date();
      await invitation.save();
      await ActivityLog.create({ group: invitation.group, performedBy: user._id, action: 'invitation_declined', details: `${user.name} declined invitation via chatbot` });

      return res.json({ success: true, reply: '✅ Invitation declined.' });
    }

    if (type === 'request_join') {
      const group = await Group.findById(groupId).populate('members.user', 'name');
      if (!group) return res.json({ success: false, reply: '❌ Group not found.' });

      const activeMembers = (group.members || []).filter(m => m.status !== 'inactive');
      if (activeMembers.length >= group.maxMembers) return res.json({ success: false, reply: '❌ This group is now full.' });

      const alreadyMember = activeMembers.some(m => m.user && m.user._id.toString() === user._id.toString());
      if (alreadyMember) return res.json({ success: false, reply: '❌ You\'re already a member of this group.' });

      const moduleConflict = await findExistingGroupForModule(user._id, group.moduleCode, group._id);
      if (moduleConflict) return res.json({ success: false, reply: `❌ You're already in "${moduleConflict.name}" for ${group.moduleCode}.` });

      const existing = await Invitation.findOne({ group: groupId, invitedBy: user._id, type: 'join_request', status: 'pending' });
      if (existing) return res.json({ success: false, reply: '❌ You already have a pending join request for this group.' });

      const leader = (group.members || []).find(m => m.role === 'leader');
      await Invitation.create({
        group: groupId,
        invitedBy: user._id,
        invitedUser: leader?.user?._id || group.createdBy,
        type: 'join_request',
        message: `${user.name} wants to join your group via Member Finder Assistant`,
        status: 'pending'
      });
      await ActivityLog.create({
        group: groupId, performedBy: user._id,
        action: 'join_request_sent',
        details: `${user.name} sent a join request via Member Finder Assistant`
      });

      const leaderName = leader?.user?.name || 'the leader';
      return res.json({ success: true, reply: `✅ Join request sent to ${leaderName} for "${group.name}" (${group.moduleCode})! They'll be notified and can accept or decline your request.` });
    }

    return res.json({ success: false, reply: '❌ Unknown action type.' });
  } catch (error) {
    console.error('Chatbot execute error:', error);
    res.status(500).json({ success: false, reply: 'Sorry, something went wrong. Please try again!' });
  }
});

// ==========================================
// SUGGESTIONS
// ==========================================

const generateSuggestions = (intent, context, role) => {
  const isAdmin = role === 'admin' || role === 'instructor';

  if (isAdmin) {
    switch (intent.intent) {
      case 'admin_all_groups': return ['Show unassigned students', 'Give me a summary', 'Who left today?'];
      case 'admin_unassigned': return ['Show all groups', 'Give me a summary', 'Show recent activity'];
      case 'admin_activity': return ['Show all groups', 'Give me a summary', 'Show unassigned for SE3040'];
      case 'admin_stats': return ['Show all groups', 'Show recent activity', 'Who doesn\'t have a group?'];
      case 'admin_group_detail': return ['Show all groups', 'Give me a summary', 'Show recent activity'];
      case 'admin_student_lookup': return ['Show all groups', 'Give me a summary', 'Who left today?'];
      default: return ['Show all groups', 'Give me a summary', 'Show recent activity', 'What are the rules?'];
    }
  }

  switch (intent.intent) {
    case 'group_recommendation': return ['Who\'s available in my class?', 'What groups am I in?', 'What are the group rules?'];
    case 'member_search': return ['What groups are available?', 'What groups am I in?', 'Who knows Python?'];
    case 'my_status': return context.data.pendingInvitations?.length ? ['Accept an invitation', 'What groups are available?'] : ['What groups are available?', 'Who\'s in my class?'];
    case 'action_invite': return ['What groups am I in?', 'Who else is available?', 'What groups are available?'];
    case 'action_accept': return ['What groups am I in?', 'What groups are available?'];
    case 'action_request_join': return ['What groups am I in?', 'What groups are available?', 'What are the rules?'];
    case 'redirect_leave': return ['What groups am I in?', 'What are the rules?'];
    case 'redirect_create': return ['What groups are available?', 'Who\'s in my class?'];
    default: return ['What groups are available?', 'Who\'s in my class?', 'What groups am I in?', 'What are the rules?'];
  }
};

module.exports = router;
