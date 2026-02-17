const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  parentId: {
    type: String,
    default: null
  },
  level: {
    type: Number,
    default: 0
  },
  color: {
    type: String,
    default: '#3B82F6'
  }
});

const mindMapSchema = new mongoose.Schema({
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
  nodes: [nodeSchema],
  centralTopic: {
    type: String,
    required: true
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

module.exports = mongoose.model('MindMap', mindMapSchema);
