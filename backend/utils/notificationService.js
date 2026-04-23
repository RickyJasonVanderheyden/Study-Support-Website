const Pusher = require('pusher');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

/**
 * Create a notification and push it in real-time via Pusher.
 * @param {Object} options
 * @param {string} options.recipientId - User ID of the recipient
 * @param {string} options.senderId - User ID of the sender (optional)
 * @param {string} options.type - Notification type
 * @param {string} options.title - Short title
 * @param {string} options.message - Detailed message
 * @param {string} options.relatedGroup - Group ID (optional)
 * @param {string} options.relatedInvitation - Invitation ID (optional)
 * @param {boolean} options.notifyAdmins - Also notify all admins (default: true)
 * @param {string} options.adminTitle - Custom title for admin notifications (optional)
 * @param {string} options.adminMessage - Custom message for admin notifications (optional)
 */
const createNotification = async ({
  recipientId,
  senderId = null,
  type,
  title,
  message,
  relatedGroup = null,
  relatedInvitation = null,
  notifyAdmins = true,
  adminTitle = null,
  adminMessage = null
}) => {
  try {
    // 1. Create notification in DB
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      relatedGroup,
      relatedInvitation
    });

    // 2. Populate sender info for the real-time event
    const populated = await Notification.findById(notification._id)
      .populate('sender', 'name email')
      .populate('relatedGroup', 'name moduleCode');

    // 3. Get unread count for the recipient
    const unreadCount = await Notification.countDocuments({
      recipient: recipientId,
      isRead: false
    });

    // 4. Push real-time event via Pusher
    try {
      await pusher.trigger(`user-${recipientId}`, 'new-notification', {
        notification: populated,
        unreadCount
      });
    } catch (pusherErr) {
      console.error('⚠️ Pusher trigger failed (non-blocking):', pusherErr.message);
    }

    // 5. Optionally notify all admins
    if (notifyAdmins) {
      const admins = await User.find({
        role: { $in: ['admin', 'super_admin'] },
        _id: { $ne: recipientId } // Don't double-notify if recipient IS an admin
      }).select('_id');

      for (const admin of admins) {
        // Skip if admin is the sender
        if (senderId && admin._id.toString() === senderId.toString()) continue;

        const adminNotification = await Notification.create({
          recipient: admin._id,
          sender: senderId,
          type,
          title: adminTitle || `[Admin] ${title}`,
          message: adminMessage || message,
          relatedGroup,
          relatedInvitation
        });

        const adminPopulated = await Notification.findById(adminNotification._id)
          .populate('sender', 'name email')
          .populate('relatedGroup', 'name moduleCode');

        const adminUnread = await Notification.countDocuments({
          recipient: admin._id,
          isRead: false
        });

        try {
          await pusher.trigger(`user-${admin._id}`, 'new-notification', {
            notification: adminPopulated,
            unreadCount: adminUnread
          });
        } catch (pusherErr) {
          // Silently ignore per-admin Pusher failures
        }
      }
    }

    return notification;
  } catch (error) {
    console.error('❌ Notification creation failed:', error.message);
    return null;
  }
};

/**
 * Get the Pusher instance for use in auth endpoints.
 */
const getPusher = () => pusher;

module.exports = {
  createNotification,
  getPusher
};
