import API from './api';

// ============ NOTIFICATIONS ============
export const getNotifications = (page = 1, limit = 20) =>
  API.get('/notifications', { params: { page, limit } });

export const getUnreadCount = () =>
  API.get('/notifications/unread-count');

export const markAsRead = (id) =>
  API.put(`/notifications/${id}/read`);

export const markAllAsRead = () =>
  API.put('/notifications/read-all');

export const getAdminNotifications = (page = 1, limit = 50, type = '') =>
  API.get('/notifications/admin/all', { params: { page, limit, ...(type ? { type } : {}) } });
