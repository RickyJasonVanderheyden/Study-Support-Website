import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, X, Users, UserPlus, UserMinus, Mail, MailOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../../services/notificationApi';
import { subscribeToNotifications, unsubscribeFromNotifications } from '../../services/pusher';

const NOTIFICATION_ICONS = {
  invitation_received: { icon: <Mail size={16} />, color: 'text-blue-500', bg: 'bg-blue-50' },
  invitation_accepted: { icon: <UserPlus size={16} />, color: 'text-green-500', bg: 'bg-green-50' },
  invitation_declined: { icon: <UserMinus size={16} />, color: 'text-red-500', bg: 'bg-red-50' },
  join_request_received: { icon: <Mail size={16} />, color: 'text-purple-500', bg: 'bg-purple-50' },
  join_request_accepted: { icon: <UserPlus size={16} />, color: 'text-green-500', bg: 'bg-green-50' },
  join_request_declined: { icon: <UserMinus size={16} />, color: 'text-red-500', bg: 'bg-red-50' },
  member_added: { icon: <UserPlus size={16} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  member_removed: { icon: <UserMinus size={16} />, color: 'text-orange-500', bg: 'bg-orange-50' },
  member_left: { icon: <UserMinus size={16} />, color: 'text-amber-500', bg: 'bg-amber-50' },
  group_created: { icon: <Users size={16} />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  system: { icon: <Bell size={16} />, color: 'text-gray-500', bg: 'bg-gray-50' },
};

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      // Silently fail
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications(1, 20);
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + polling fallback (every 30 seconds)
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Pusher real-time subscription
  useEffect(() => {
    if (!user?._id) return;

    const channel = subscribeToNotifications(user._id, (data) => {
      // Update unread count
      if (data.unreadCount !== undefined) {
        setUnreadCount(data.unreadCount);
      }

      // Add new notification to the list if dropdown is open
      if (data.notification) {
        setNotifications((prev) => [data.notification, ...prev.slice(0, 19)]);

        // Show toast notification
        toast(data.notification.message, {
          icon: '🔔',
          duration: 5000,
          style: {
            borderRadius: '12px',
            background: '#1e293b',
            color: '#fff',
            fontSize: '13px',
            maxWidth: '400px',
          },
        });
      }
    });

    return () => {
      if (user?._id) unsubscribeFromNotifications(user._id);
    };
    // eslint-disable-next-line
  }, [user?._id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle dropdown
  const handleToggle = () => {
    if (!isOpen) fetchNotifications();
    setIsOpen(!isOpen);
  };

  // Mark single as read
  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(res.data.unreadCount ?? Math.max(0, unreadCount - 1));
    } catch (err) {
      // ignore
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      // ignore
    }
  };

  // Click notification → navigate
  const handleClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    if (notification.relatedGroup?._id) {
      navigate(`/module4/group/${notification.relatedGroup._id}`);
    } else {
      navigate('/module4');
    }
    setIsOpen(false);
  };

  const getIcon = (type) => {
    return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.system;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse shadow-lg">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50" style={{ maxHeight: '480px' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-indigo-600" />
              <h3 className="font-bold text-sm text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                  Read all
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                <p className="text-xs text-gray-400">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <MailOpen size={20} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">No notifications yet</p>
                <p className="text-xs text-gray-300 mt-1">You'll see updates here when someone invites you or responds to your invitations.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const iconInfo = getIcon(n.type);
                return (
                  <div
                    key={n._id}
                    onClick={() => handleClick(n)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${!n.isRead ? 'bg-indigo-50/40' : ''}`}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${iconInfo.bg}`}>
                      <span className={iconInfo.color}>{iconInfo.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 text-left">
                      <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">{timeAgo(n.createdAt)}</span>
                        {n.relatedGroup && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                            {n.relatedGroup.moduleCode || n.relatedGroup.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unread indicator / Mark read */}
                    {!n.isRead ? (
                      <button
                        onClick={(e) => handleMarkRead(n._id, e)}
                        className="shrink-0 mt-1 w-2.5 h-2.5 bg-indigo-500 rounded-full hover:bg-indigo-700 transition-colors"
                        title="Mark as read"
                      />
                    ) : (
                      <Check size={12} className="shrink-0 mt-2 text-gray-300" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
