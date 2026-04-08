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
      match: [/^\+94\d{9}$/, 'Please provide a valid Sri Lankan mobile number (+94XXXXXXXXX)']
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
