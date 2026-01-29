const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Auth
  username: { type: String, unique: true, required: true, trim: true },
  email: { type: String, unique: true, required: true, lowercase: true },
  password: { type: String, required: true },
  phone: String,
  
  // Wallet (TRX focused)
  wallet: {
    mainBalance: { type: Number, default: 0, min: 0 }, // Values in TRX
    bonusBalance: { type: Number, default: 0, min: 0 }, // Values in TRX
    spinCredits: { type: Number, default: 0, min: 0 },
    totalWon: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 }
  },
  
  // Shop & Inventory
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
    equippedWeapon: { type: String, default: 'basic_bow' } // Stores the weapon key
  },
  
  // Game Stats
  stats: {
    totalSpins: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    biggestWin: { type: Number, default: 0 },
    favoriteGame: String,
    lastPlayed: Date
  },

  // Provably Fair (Per User)
  provablyFair: {
    serverSeed: { type: String }, // Secret until rotated
    clientSeed: { type: String }, // User controlled
    nonce: { type: Number, default: 0 }
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
  roleHistory: [{
    oldRole: String,
    newRole: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save actions

userSchema.pre('save', async function() {

  try {

    // Hash password if modified

    if (this.isModified('password')) {

      const salt = await bcrypt.genSalt(12);

      this.password = await bcrypt.hash(this.password, salt);

    }

    

    // Generate referral code if missing

    if (!this.referralCode) {

      this.referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    }

  } catch (error) {

    throw error;

  }

});





// Method to compare password

userSchema.methods.comparePassword = async function(candidatePassword) {

  return await bcrypt.compare(candidatePassword, this.password);

};



module.exports = mongoose.model('User', userSchema);
