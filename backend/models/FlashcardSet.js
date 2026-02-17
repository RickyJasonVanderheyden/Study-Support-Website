const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  front: {
    type: String,
    required: true
  },
  back: {
    type: String,
    required: true
  },
  hint: {
    type: String,
    default: ''
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  timesReviewed: {
    type: Number,
    default: 0
  },
  timesCorrect: {
    type: Number,
    default: 0
  },
  lastReviewed: {
    type: Date,
    default: null
  }
});

const flashcardSetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  sourceFileName: {
    type: String,
    default: ''
  },
  cards: [cardSchema],
  subject: {
    type: String,
    default: 'General'
  },
  totalCards: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

flashcardSetSchema.pre('save', function(next) {
  this.totalCards = this.cards.length;
  next();
});

module.exports = mongoose.model('FlashcardSet', flashcardSetSchema);
