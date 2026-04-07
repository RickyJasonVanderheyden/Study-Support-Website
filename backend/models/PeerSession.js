const mongoose = require('mongoose');

const peerSessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
      maxlength: 120,
    },
    moduleCode: {
      type: String,
      required: [true, 'Module code is required'],
      trim: true,
      uppercase: true,
      maxlength: 20,
    },
    moduleName: {
      type: String,
      required: [true, 'Module name is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 800,
    },
    hostName: {
      type: String,
      required: [true, 'Host name is required'],
      trim: true,
      maxlength: 80,
    },
    hostEmail: {
      type: String,
      required: [true, 'Host email is required'],
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    meetingLink: {
      type: String,
      required: [true, 'Meeting link is required'],
      trim: true,
    },
    materialsLink: {
      type: String,
      trim: true,
      default: '',
    },
    dateTime: {
      type: Date,
      required: [true, 'Session date/time is required'],
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      min: 15,
      max: 600,
    },
    maxParticipants: {
      type: Number,
      required: [true, 'Max participants is required'],
      min: 1,
      max: 500,
      default: 30,
    },
    status: {
      type: String,
      enum: ['upcoming', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'All Levels',
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PeerSession', peerSessionSchema);
