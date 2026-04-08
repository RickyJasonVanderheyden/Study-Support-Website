const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// ==========================================
// Load knowledge base from .md file
// ==========================================
let KNOWLEDGE_BASE = '';
try {
  const mdPath = path.join(__dirname, '..', 'knowledge', 'platform_rules.md');
  KNOWLEDGE_BASE = fs.readFileSync(mdPath, 'utf-8');
  console.log(`✅ Knowledge base loaded (${KNOWLEDGE_BASE.length} chars)`);
} catch (err) {
  console.warn('⚠️ Could not load knowledge base file:', err.message);
  KNOWLEDGE_BASE = 'You are a SLIIT Member Finder assistant chatbot.';
}

// ==========================================
// Role-specific prompt extensions
// ==========================================
const STUDENT_EXTENSION = `
YOU ARE ACTING AS: Member Finder Assistant
SCOPE: You can ONLY show data from this student's own sub-group.
ACTIONS ALLOWED: Answer questions, send invitations (with confirmation), accept/decline invitations.
ACTIONS BLOCKED: Creating groups, leaving groups, removing members — redirect to UI for these.`;

const ADMIN_EXTENSION = `
YOU ARE ACTING AS: Admin/Instructor Dashboard Assistant  
SCOPE: You can see ALL data across ALL sub-groups — no restrictions.
FOCUS: Provide data-driven insights. Flag issues (unassigned students, low-activity groups).
Be professional and use tables/numbers when helpful.`;

/**
 * Generate a chat response using Groq LLM
 * @param {string} userMessage - The user's question
 * @param {object} context - Database context (groups, members, user info)
 * @param {Array} history - Conversation history [{role, content}]
 * @returns {Promise<string>} - The bot's response
 */
const generateChatResponse = async (userMessage, context, history = []) => {
  if (!groq) return generateFallbackResponse(userMessage, context);

  try {
    const isAdmin = context.user.role === 'admin' || context.user.role === 'instructor';
    const roleExtension = isAdmin ? ADMIN_EXTENSION : STUDENT_EXTENSION;

    // Build system prompt from .md knowledge + role + live context
    const systemPrompt = `${KNOWLEDGE_BASE}

${roleExtension}

---
CURRENT USER:
- Name: ${context.user.name}
- Role: ${context.user.role}
- Registration: ${context.user.registrationNumber || 'N/A'}
- Placement: ${context.user.year || '?'} · ${context.user.semester || '?'} · MG${String(context.user.mainGroup || '?').toString().padStart(2, '0')} · SG${context.user.subGroup || '?'}

DETECTED INTENT: ${context.intent}

LIVE DATABASE CONTEXT (from MongoDB — this is real, accurate data):
${JSON.stringify(context.data, null, 2)}
---
Use ONLY the data above to answer. Do NOT fabricate any information.`;

    // Build messages array with conversation history
    const messages = [{ role: 'system', content: systemPrompt }];

    // Add conversation history (last 5 pairs max)
    if (history && history.length > 0) {
      const recentHistory = history.slice(-10);
      recentHistory.forEach(h => {
        if (h.role === 'user' || h.role === 'assistant') {
          messages.push({ role: h.role, content: h.content });
        }
      });
    }

    messages.push({ role: 'user', content: userMessage });

    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.6,
      max_tokens: 600,
      top_p: 0.9,
    });

    return completion.choices[0]?.message?.content || generateFallbackResponse(userMessage, context);
  } catch (error) {
    console.error('Groq API error:', error.message);
    return generateFallbackResponse(userMessage, context);
  }
};

// ==========================================
// Fallback responses when Groq is unavailable
// ==========================================
const generateFallbackResponse = (userMessage, context) => {
  const { intent, data } = context;

  switch (intent) {
    case 'redirect_leave': {
      const groups = data.myGroups?.map(g => `• ${g.name} (${g.moduleCode})`).join('\n') || 'No active groups';
      return `⚠️ To leave a group, please use the group Settings page:\n\n1. Go to Member Finder → My Groups\n2. Click on the group\n3. Go to Settings tab\n4. Click "Leave Group"\n\nYour current groups:\n${groups}\n\nThis ensures you see the full impact before leaving.`;
    }

    case 'redirect_create': {
      const conflict = data.alreadyInGroup;
      const mod = data.moduleCode;
      if (conflict) {
        return `⚠️ You're already in "${conflict}" for ${mod}. You can only be in ONE group per module.\n\nTo create a new group for ${mod}, leave "${conflict}" first via Settings tab.`;
      }
      return `🎯 To create a group:\n\n1. Go to Member Finder page\n2. Click "+ Create Group" (top right)\n3. Fill in group name, module code${mod ? ` (${mod})` : ''}, description\n4. Click Create\n\n${mod ? `✅ You're not in any ${mod} group yet — you're good to go!` : ''}`;
    }

    case 'action_invite': {
      const a = data.action;
      if (!a) return 'I couldn\'t process that invite. Try: "Invite [name] to [group name]"';
      if (a.targetNotFound) return `❌ I couldn't find anyone named "${a.searchedName}" in your sub-group.`;
      if (a.groupNotFound) return `❌ I couldn't find a group named "${a.searchedGroup}" that you're in. Your leader groups: ${a.leaderGroups?.map(g => g.name).join(', ') || 'none'}`;
      if (!a.validation.isLeader) return `❌ You're not the leader of "${a.group.name}". Only the leader can invite.`;
      if (a.validation.alreadyMember) return `❌ ${a.targetUser.name} is already a member of "${a.group.name}".`;
      if (a.validation.isFull) return `❌ "${a.group.name}" is full (${a.group.activeMembers}/${a.group.maxMembers}).`;
      if (a.validation.moduleConflict) return `❌ ${a.targetUser.name} is already in "${a.validation.moduleConflict}" for ${a.group.moduleCode}. One group per module only.`;
      if (a.validation.hasExistingInvite) return `❌ ${a.targetUser.name} already has a pending invitation for "${a.group.name}".`;
      if (a.validation.canInvite) {
        return `📨 I'll send an invitation to:\n• Student: ${a.targetUser.name} (${a.targetUser.regNo || 'N/A'})\n• Group: ${a.group.name} (${a.group.moduleCode})\n• Spots: ${a.group.activeMembers}/${a.group.maxMembers}\n\nClick "Confirm" below to send it.`;
      }
      return 'Something went wrong validating the invitation.';
    }

    case 'action_accept': {
      if (!data.matchedInvite) {
        const list = data.invitations?.map(i => `• ${i.groupName} (${i.moduleCode})`).join('\n') || 'No pending invitations';
        return `I couldn't find that invitation. Your pending invitations:\n${list}\n\nSay "Accept [group name]" to accept one.`;
      }
      if (data.matchedInvite.isFull) return `❌ "${data.matchedInvite.groupName}" is now full.`;
      if (data.matchedInvite.moduleConflict) return `❌ You're already in "${data.matchedInvite.moduleConflict}" for ${data.matchedInvite.moduleCode}.`;
      return `✅ Ready to accept invitation for "${data.matchedInvite.groupName}" (${data.matchedInvite.moduleCode}).\n\nClick "Confirm" below to join!`;
    }

    case 'action_decline': {
      if (!data.matchedInvite) return 'I couldn\'t find that invitation. Check your pending invitations first.';
      return `Are you sure you want to decline the invitation for "${data.matchedInvite.groupName}" (${data.matchedInvite.moduleCode})?\n\nClick "Confirm" below to decline.`;
    }

    case 'action_request_join': {
      const jr = data.joinRequest;
      if (!jr || !jr.group) return `I couldn't find a group named "${jr?.searchedName || 'that'}". Check the group name and try again.`;
      if (jr.validation.alreadyMember) return `You're already a member of "${jr.group.name}"! 😊`;
      if (jr.validation.isFull) return `❌ "${jr.group.name}" is full (${jr.group.activeMembers}/${jr.group.maxMembers}). No spots available.`;
      if (jr.validation.moduleConflict) return `❌ You're already in "${jr.validation.moduleConflict}" for ${jr.group.moduleCode}. One group per module only.\n\nLeave that group first via Settings tab if you want to switch.`;
      if (jr.validation.hasExistingRequest) return `You already have a pending join request for "${jr.group.name}". Wait for the leader to respond! ⏳`;
      if (jr.validation.canJoin) {
        return `📨 Join request details:\n• Group: ${jr.group.name} (${jr.group.moduleCode})\n• Leader: ${jr.group.leader}\n• Spots: ${jr.group.activeMembers}/${jr.group.maxMembers} (${jr.group.spotsLeft} left)\n• Tags: ${jr.group.tags.join(', ') || 'none'}\n\nClick "Confirm" below to send a join request to ${jr.group.leader}.`;
      }
      return 'Something went wrong validating the join request.';
    }

    case 'group_recommendation': {
      if (!data.groups || data.groups.length === 0) {
        return `No active groups found for ${data.moduleCode || 'that module'} in your sub-group. You could create one using the "+ Create Group" button! 🚀`;
      }
      const list = data.groups.map(g =>
        `• ${g.name} (${g.moduleCode}) — ${g.activeMembers}/${g.maxMembers} members (${g.spotsLeft} left) | Leader: ${g.leader}`
      ).join('\n');
      const warning = data.userAlreadyInModule ? `\n\n⚠️ You're already in "${data.userAlreadyInModule}" for ${data.moduleCode}.` : '';
      return `Available groups${data.moduleCode ? ` for ${data.moduleCode}` : ''}:\n\n${list}${warning}`;
    }

    case 'member_search': {
      if (!data.members || data.members.length === 0) return `No classmates found with "${data.searchQuery}" skills.`;
      const list = data.members.map(m => `• ${m.name} (${m.registrationNumber || 'N/A'}) — ${m.skills.join(', ')} ${m.groupStatus}`).join('\n');
      return `Found ${data.members.length} classmate(s):\n\n${list}\n\n💡 Say "Invite [name] to [group]" to send an invitation.`;
    }

    case 'my_status': {
      const groups = data.myGroups?.length > 0
        ? data.myGroups.map(g => `• ${g.name} (${g.moduleCode}) — ${g.role} | ${g.memberCount}/${g.maxMembers}`).join('\n')
        : 'You\'re not in any groups yet.';
      const invites = data.pendingInvitations?.length > 0
        ? `\n\n📨 Pending invitations (${data.pendingInvitations.length}):\n${data.pendingInvitations.map(i => `• ${i.groupName} (${i.moduleCode})`).join('\n')}\nSay "Accept [name]" to join.`
        : '';
      return `Your groups:\n\n${groups}${invites}`;
    }

    case 'peer_check': {
      if (!data.peerInfo) return `I couldn't find "${data.searchedName}" in your sub-group.`;
      if (data.peerInfo.groups.length === 0) return `${data.peerInfo.name} is not in any groups — available! 🟢`;
      const list = data.peerInfo.groups.map(g => `• ${g.groupName} (${g.moduleCode}) — ${g.spotsLeft} spots left`).join('\n');
      return `${data.peerInfo.name}'s groups:\n\n${list}`;
    }

    case 'rules':
      return `📋 Study Group Rules:\n\n• ONE group per module code only\n• Groups capped at 4 members\n• Join groups in your own sub-group only\n• Only the leader can send invitations\n• Leave a group → can join another for same module\n• Multiple groups for DIFFERENT modules allowed`;

    // ---- Admin Fallbacks ----
    case 'admin_all_groups': {
      if (!data.groups?.length) return 'No active groups found.';
      const list = data.groups.map(g => `• ${g.name} (${g.moduleCode}) — ${g.placement} — ${g.activeMembers}/${g.maxMembers}${g.isFull ? ' ✅ Full' : ''}`).join('\n');
      return `📋 ${data.totalGroups} active groups${data.moduleCode !== 'all' ? ` for ${data.moduleCode}` : ''}:\n\n${list}\n\nSpots: ${data.filledSpots}/${data.totalSpots} filled`;
    }

    case 'admin_unassigned': {
      if (data.error) return data.error;
      if (!data.unassigned?.length) return `✅ All students have a group for ${data.moduleCode}!`;
      const list = data.unassigned.slice(0, 15).map(s => `• ${s.name} (${s.registrationNumber || 'N/A'}) — ${s.placement}`).join('\n');
      return `⚠️ ${data.unassigned.length} students without a group for ${data.moduleCode}:\n\n${list}${data.unassigned.length > 15 ? `\n...and ${data.unassigned.length - 15} more` : ''}`;
    }

    case 'admin_activity': {
      if (!data.activities?.length) return 'No activity recorded recently.';
      const list = data.activities.slice(0, 10).map(a => `• ${a.performedBy}: ${a.action} — ${a.groupName} (${a.moduleCode})`).join('\n');
      return `📋 Recent Activity (${data.period}):\n\n${list}`;
    }

    case 'admin_stats': {
      const mods = data.modules?.map(m => `• ${m.moduleCode}: ${m.groups} groups (${m.filled}/${m.total} spots)`).join('\n') || 'No data';
      return `📊 Platform Overview:\n\n👥 Students: ${data.totalStudents}\n📋 Groups: ${data.totalGroups}\n✅ Spots filled: ${data.filledSpots}/${data.totalSpots}\n📨 Pending invites: ${data.pendingInvitations}\n\nModule breakdown:\n${mods}`;
    }

    case 'admin_group_detail': {
      if (!data.group) return `Group "${data.searchedName}" not found.`;
      const g = data.group;
      const members = g.members.map(m => `• ${m.name} (${m.regNo || 'N/A'}) — ${m.role} — Score: ${m.score}`).join('\n');
      return `📊 ${g.name} (${g.moduleCode})\nStatus: ${g.status} | ${g.placement}\n\n👥 Members:\n${members}\n\nCreated: ${new Date(g.createdAt).toLocaleDateString()} by ${g.createdBy}`;
    }

    case 'admin_student_lookup': {
      if (!data.peerInfo) return `Student "${data.searchedName}" not found.`;
      const p = data.peerInfo;
      const groups = p.groups.length > 0 ? p.groups.map(g => `• ${g.groupName} (${g.moduleCode}) — ${g.role}`).join('\n') : 'No groups';
      return `👤 ${p.name} (${p.registrationNumber || 'N/A'})\nPlacement: ${p.placement}\nSkills: ${p.skills.join(', ') || 'None'}\n\nGroups:\n${groups}\n\nRecent activity: ${p.recentActivity} actions`;
    }

    default:
      return `I'm your SLIIT Member Finder Assistant! Try:\n\n• "What groups for SE3040?"\n• "Who knows React?"\n• "What groups am I in?"\n• "Invite Janu to Earth"\n• "Accept Phoenix invitation"\n• "What are the rules?"${context.user.role === 'admin' ? '\n\nAdmin commands:\n• "Show all groups"\n• "Give me a summary"\n• "Who doesn\'t have a group for SE3040?"\n• "Show recent activity"' : ''}`;
  }
};

module.exports = { generateChatResponse };
