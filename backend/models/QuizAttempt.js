const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: false
  },
  selectedAnswer: {
    type: mongoose.Schema.Types.Mixed, // supports index/object answer formats
    required: false
  },
  isCorrect: {
    type: Boolean,
    required: false
  },
  timeTaken: {
    type: Number, // seconds spent on this question
    default: 0
  }
});

const quizAttemptSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false  // Optional for testing without auth
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: false,
  },
  subjectCategory: {
    type: String,
    trim: true,
    default: '',
  },
  subjectSlug: {
    type: String,
    trim: true,
    default: '',
  },
  subjectName: {
    type: String,
    trim: true,
    default: '',
  },
  answers: [answerSchema],
  score: {
    type: Number, // Number of correct answers
    required: true
  },
  total: {
    type: Number,
    required: false,
    min: 0,
  },
  percentage: {
    type: Number, // Percentage score
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  timeTaken: {
    type: Number, // Total time in seconds
    default: 0
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['completed', 'abandoned'],
    default: 'completed'
  }
});

// Index for faster queries
quizAttemptSchema.index({ user: 1, quiz: 1 });
quizAttemptSchema.index({ user: 1, completedAt: -1 });
quizAttemptSchema.index({ studentId: 1, subjectCategory: 1, completedAt: -1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
