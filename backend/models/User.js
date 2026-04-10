const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false, // Optional until activation
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: false, // Optional until activation
    select: false
  },
  registrationNumber: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    match: [/^(IT\d{8}|ADMIN\d+|INS\d+)$/i, 'Student IT number must be exactly 10 characters (e.g. IT21208876). Admin/Instructor IDs: ADMINXXXX or INSXXXX']
  },
  isActivated: {
    type: Boolean,
    default: false
  },
  mobileNumber: {
    type: String,
    required: false, // Make it optional to not break user's activation flow which might not have it initially
    match: [/^\+\d{7,15}$/, 'Please provide a valid mobile number in international format (e.g., +94712345678)']
  },
  groupNumber: {
    type: String,
    default: null
  },
  roleRequest: {
    type: String,
    enum: ['none', 'pending_session_lead', 'rejected'],
    default: 'none'
  },
  role: {
    type: String,
    enum: ['student', 'session_lead', 'admin', 'instructor', 'super_admin'],
    default: 'student'
  },
  year: {
    type: String,
    enum: ['Y1', 'Y2', 'Y3', 'Y4'],
    default: null
  },
  semester: {
    type: String,
    enum: ['S1', 'S2'],
    default: null
  },
  mainGroup: {
    type: Number,
    min: 1,
    max: 12,
    default: null
  },
  subGroup: {
    type: Number,
    min: 1,
    max: 2,
    default: null
  },
  skills: {
    type: [String],
    default: []
  },
  bio: {
    type: String,
    maxlength: 300,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
