const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    invitedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'expired'],
        default: 'pending'
    },
    message: {
        type: String,
        maxlength: 300,
        default: ''
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    },
    respondedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for quick lookups
invitationSchema.index({ invitedUser: 1, status: 1 });
invitationSchema.index({ group: 1 });
invitationSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Invitation', invitationSchema);
