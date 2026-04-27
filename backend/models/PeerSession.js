const mongoose = require('mongoose');

const peerSessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: false,
      index: true,
    },
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
    materialsFiles: {
      type: [
        {
          originalName: { type: String, trim: true, default: '' },
          fileName: { type: String, trim: true, default: '' },
          filePath: { type: String, trim: true, default: '' },
          mimeType: { type: String, trim: true, default: '' },
          size: { type: Number, default: 0 },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
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
      enum: ['upcoming', 'completed', 'cancelled', 'pending'],
      default: 'upcoming',
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
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
    leadSharedPrep: {
      title: { type: String, trim: true, default: '' },
      overview: { type: String, trim: true, default: '' },
      revisionGoals: { type: [String], default: [] },
      likelyQuestions: {
        type: [
          {
            question: { type: String, trim: true, default: '' },
            whyItMatters: { type: String, trim: true, default: '' },
          },
        ],
        default: [],
      },
      studyPlan: {
        type: [
          {
            step: { type: String, trim: true, default: '' },
            durationMinutes: { type: Number, default: 0 },
          },
        ],
        default: [],
      },
      quickTips: { type: [String], default: [] },
      source: { type: String, enum: ['ai', 'fallback'], default: 'fallback' },
      publishedByName: { type: String, trim: true, default: '' },
      publishedByEmail: { type: String, trim: true, lowercase: true, default: '' },
      publishedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PeerSession', peerSessionSchema);
