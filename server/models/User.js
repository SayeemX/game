const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Force clear the model if it exists to ensure schema updates are applied
if (mongoose.models.User) {
  delete mongoose.models.User;
}

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, trim: true },
  email: { type: String, unique: true, required: true, lowercase: true },
  password: { type: String, required: true },
  phone: String,
  
  wallet: {
    mainBalance: { type: Number, default: 0, min: 0 },
    bonusBalance: { type: Number, default: 0, min: 0 },
    spinCredits: {
      BRONZE: { type: Number, default: 0 },
      SILVER: { type: Number, default: 0 },
      GOLD: { type: Number, default: 0 },
      DIAMOND: { type: Number, default: 0 }
    },
    totalWon: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 }
  },
  
  inventory: {
    weapons: [{
      weaponId: { type: mongoose.Schema.Types.ObjectId, ref: 'BirdWeapon' },
      purchasedAt: { type: Date, default: Date.now }
    }],
    items: [{
      itemKey: String,
      amount: { type: Number, default: 0 },
      purchasedAt: { type: Date, default: Date.now }
    }],
    equippedWeapon: { type: String, default: 'basic_bow' }
  },
  
  stats: {
    totalSpins: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    biggestWin: { type: Number, default: 0 },
    favoriteGame: { type: String, default: 'spin' },
    lastPlayed: Date
  },

  provablyFair: {
    serverSeed: { type: String },
    clientSeed: { type: String },
    nonce: { type: Number, default: 0 }
  },
  
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  twoFactorEnabled: { type: Boolean, default: false },
  lastLogin: Date,
  loginHistory: [{
    ip: String,
    device: String,
    timestamp: Date
  }],
  
  avatar: String,
  country: String,
  language: { type: String, default: 'en' },
  referralCode: { type: String, unique: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
  roleHistory: [{
    oldRole: String,
    newRole: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  try {
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }
    
    if (!this.referralCode) {
      this.referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    }
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
