const mongoose = require('mongoose');

const studyActivitySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      default: 'subject_quiz',
    },
    minutes: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    subjectCategory: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StudyActivity', studyActivitySchema);
