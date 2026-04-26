import mongoose from 'mongoose'

const quizAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    quiz: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    subjectSlug: {
      type: String,
      required: false,
      trim: true,
    },
    subjectName: {
      type: String,
      required: false,
      trim: true,
    },
    answers: {
      type: [Number],
      default: [],
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: false,
      min: 1,
    },
    totalQuestions: {
      type: Number,
      required: false,
      min: 1,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      default: 'completed',
      trim: true,
    },
    timeTaken: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
)

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema)

export default QuizAttempt
