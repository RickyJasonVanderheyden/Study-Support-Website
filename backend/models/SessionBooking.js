const mongoose = require('mongoose');

const sessionBookingSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PeerSession',
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
      maxlength: 80,
    },
    studentEmail: {
      type: String,
      required: [true, 'Student email is required'],
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    studentMobile: {
      type: String,
      required: [true, 'Student mobile number is required'],
      match: [/^\+\d{7,15}$/, 'Please provide a valid mobile number in international format (e.g., +94712345678)']
    },
    status: {
      type: String,
      enum: ['joined', 'cancelled'],
      default: 'joined',
    },
  },
  { timestamps: true }
);

sessionBookingSchema.index({ sessionId: 1, studentEmail: 1 }, { unique: true });

module.exports = mongoose.model('SessionBooking', sessionBookingSchema);
