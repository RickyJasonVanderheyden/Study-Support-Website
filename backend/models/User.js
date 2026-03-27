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
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
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
    sparse: true
  },
  isActivated: {
    type: Boolean,
    default: false
  },
  groupNumber: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
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
