const mongoose = require('mongoose');

const studyBuddyPrepSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PeerSession',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    focusTopics: {
      type: [String],
      default: [],
    },
    learningGoal: {
      type: String,
      default: '',
      maxlength: 500,
    },
    currentLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
    },
    upcomingExam: {
      type: String,
      default: '',
      maxlength: 200,
    },
    prep: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    source: {
      type: String,
      enum: ['ai', 'fallback'],
      default: 'fallback',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudyBuddyPrep', studyBuddyPrepSchema);
