const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'group_created',
            'group_updated',
            'group_deleted',
            'member_added',
            'member_removed',
            'member_left',
            'member_role_changed',
            'member_status_changed',
            'contribution_updated',
            'invitation_sent',
            'invitation_accepted',
            'invitation_declined',
            'join_request_sent',
            'join_request_accepted',
            'join_request_declined',
            'leadership_transferred'
        ]
    },
    targetUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    details: {
        type: String,
        default: ''
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Index for fetching group activity
activityLogSchema.index({ group: 1, createdAt: -1 });
activityLogSchema.index({ performedBy: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
