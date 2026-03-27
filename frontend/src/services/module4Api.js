import API from './api';

// ============ GROUPS ============
export const createGroup = (data) => API.post('/module4/groups', data);
export const getMyGroups = () => API.get('/module4/groups');
export const searchGroups = (params) => API.get('/module4/groups/search', { params });
export const getGroupById = (id) => API.get(`/module4/groups/${id}`);
export const updateGroup = (id, data) => API.put(`/module4/groups/${id}`, data);
export const deleteGroup = (id) => API.delete(`/module4/groups/${id}`);

// ============ MEMBERS ============
export const browseMembers = (query, filters = {}) =>
    API.get('/module4/members/browse', { params: { q: query, ...filters } });
export const getGroupMembers = (groupId, status) =>
    API.get(`/module4/members/${groupId}`, { params: status ? { status } : {} });
export const searchUsersToAdd = (groupId, query) =>
    API.get(`/module4/members/${groupId}/search`, { params: { q: query } });
export const addMember = (groupId, userId) =>
    API.post(`/module4/members/${groupId}/add`, { userId });
export const updateMember = (groupId, userId, data) =>
    API.put(`/module4/members/${groupId}/update/${userId}`, data);
export const removeMember = (groupId, userId) =>
    API.delete(`/module4/members/${groupId}/remove/${userId}`);
export const leaveGroup = (groupId) =>
    API.put(`/module4/members/${groupId}/leave`);
export const transferLeadership = (groupId, userId) =>
    API.put(`/module4/members/${groupId}/transfer/${userId}`);
export const getMemberProfile = (userId) =>
    API.get(`/module4/members/profile/${userId}`);

// ============ INVITATIONS ============
export const sendInvitation = (data) => API.post('/module4/invitations/send', data);
export const getReceivedInvitations = () => API.get('/module4/invitations/received');
export const getSentInvitations = (groupId) => API.get(`/module4/invitations/sent/${groupId}`);
export const acceptInvitation = (id) => API.put(`/module4/invitations/${id}/accept`);
export const declineInvitation = (id) => API.put(`/module4/invitations/${id}/decline`);

// ============ ACTIVITY ============
export const getActivityTimeline = (groupId, page = 1) =>
    API.get(`/module4/activity/${groupId}`, { params: { page } });
export const getActivityStats = (groupId) =>
    API.get(`/module4/activity/${groupId}/stats`);
export const getContributions = (groupId) =>
    API.get(`/module4/activity/${groupId}/contributions`);

// ============ USER PROFILE ============
export const updateUserProfile = (data) => API.put('/auth/profile', data);
