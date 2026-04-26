const mongoose = require('mongoose');

const module2SourceDocSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    extractedText: {
      type: String,
      required: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module2SourceDocSchema.index({ user: 1, fileName: 1 }, { unique: true });

module.exports = mongoose.model('Module2SourceDoc', module2SourceDocSchema);
