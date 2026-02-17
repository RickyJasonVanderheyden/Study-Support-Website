const mongoose = require('mongoose');

const audioNotesSchema = new mongoose.Schema({
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
  summary: {
    type: String,
    required: true
  },
  keyPoints: [{
    type: String
  }],
  script: {
    type: String,
    required: true
  },
  style: {
    type: String,
    default: 'educational'
  },
  estimatedDuration: {
    type: Number, // in seconds
    default: 0
  },
  audioUrl: {
    type: String,
    default: ''
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  subject: {
    type: String,
    default: 'General'
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

module.exports = mongoose.model('AudioNotes', audioNotesSchema);
