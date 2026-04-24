import Pusher from 'pusher-js';

let pusherInstance = null;

/**
 * Get or create a singleton Pusher instance.
 */
export const getPusherClient = () => {
  if (pusherInstance) return pusherInstance;

  const key = process.env.REACT_APP_PUSHER_KEY;
  const cluster = process.env.REACT_APP_PUSHER_CLUSTER;

  if (!key || !cluster) {
    console.warn('⚠️ Pusher not configured (missing REACT_APP_PUSHER_KEY or REACT_APP_PUSHER_CLUSTER)');
    return null;
  }

  pusherInstance = new Pusher(key, {
    cluster,
    // Pusher JS v8+ uses channelAuthorization; older versions used authEndpoint + auth
    channelAuthorization: {
      endpoint: `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/pusher/auth`,
      transport: 'ajax',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    },
    // Fallback for older Pusher JS versions
    authEndpoint: `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/pusher/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    }
  });

  return pusherInstance;
};

/**
 * Subscribe to the current user's notification channel.
 * @param {string} userId - The current user's ID
 * @param {function} onNotification - Callback when a notification arrives
 * @returns {object|null} The channel subscription (for cleanup)
 */
export const subscribeToNotifications = (userId, onNotification) => {
  const pusher = getPusherClient();
  if (!pusher) return null;

  // Update auth token in case it changed (safe for both Pusher JS v7 and v8+)
  const token = localStorage.getItem('token');
  if (pusher.config?.auth?.headers) {
    pusher.config.auth.headers.Authorization = `Bearer ${token}`;
  }
  if (pusher.config?.channelAuthorization?.headers) {
    pusher.config.channelAuthorization.headers.Authorization = `Bearer ${token}`;
  }

  const channelName = `user-${userId}`;
  const channel = pusher.subscribe(channelName);

  channel.bind('new-notification', (data) => {
    if (onNotification) onNotification(data);
  });

  return channel;
};

/**
 * Unsubscribe from the user's notification channel.
 * @param {string} userId
 */
export const unsubscribeFromNotifications = (userId) => {
  const pusher = getPusherClient();
  if (!pusher) return;

  pusher.unsubscribe(`user-${userId}`);
};
