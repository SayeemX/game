const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Auth
  username: { type: String, unique: true, required: true, trim: true },
  email: { type: String, unique: true, required: true, lowercase: true },
  password: { type: String, required: true },
  phone: String,
  
  // Wallet
  wallet: {
    mainBalance: { type: Number, default: 0, min: 0 },
    bonusBalance: { type: Number, default: 0, min: 0 },
    spinCredits: { type: Number, default: 0, min: 0 },
    totalWon: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 }
  },
  
  // Game Stats
  stats: {
    totalSpins: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    biggestWin: { type: Number, default: 0 },
    favoriteGame: String,
    lastPlayed: Date
  },
  
  // Security
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  twoFactorEnabled: { type: Boolean, default: false },
  lastLogin: Date,
  loginHistory: [{
    ip: String,
    device: String,
    timestamp: Date
  }],
  
  // Profile
  avatar: String,
  country: String,
  language: { type: String, default: 'en' },
  referralCode: { type: String, unique: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Admin
  role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Password hashing
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate referral code
userSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);