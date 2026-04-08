const mongoose = require('mongoose');

const groupMemberSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['leader', 'member'],
        default: 'member'
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'inactive'],
        default: 'active'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    contributionScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    }
});

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a group name'],
        trim: true,
        minlength: 3,
        maxlength: 100
    },
    description: {
        type: String,
        maxlength: 500,
        default: ''
    },
    moduleCode: {
        type: String,
        required: [true, 'Please provide a module code'],
        uppercase: true,
        trim: true
    },
    year: {
        type: String,
        default: 'Y1'
    },
    semester: {
        type: String,
        default: 'S1'
    },
    mainGroup: {
        type: Number,
        min: 1,
        max: 12,
        default: 1
    },
    subGroup: {
        type: Number,
        min: 1,
        max: 2,
        default: 1
    },
    academicYear: {
        type: String,
        default: () => {
            const now = new Date();
            return `${now.getFullYear()}/${now.getFullYear() + 1}`;
        }
    },
    maxMembers: {
        type: Number,
        min: 2,
        max: 4,
        default: 4
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [groupMemberSchema],
    status: {
        type: String,
        enum: ['active', 'completed', 'archived'],
        default: 'active'
    },
    tags: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
});

// Index for searching
groupSchema.index({ moduleCode: 1, year: 1, semester: 1, mainGroup: 1, subGroup: 1 });
groupSchema.index({ status: 1 });
groupSchema.index({ 'members.user': 1 });

// Virtual for current member count
groupSchema.virtual('memberCount').get(function () {
    return (this.members || []).filter(m => m.status !== 'inactive').length;
});

// Ensure virtuals are included in JSON
groupSchema.set('toJSON', { virtuals: true });
groupSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Group', groupSchema);
