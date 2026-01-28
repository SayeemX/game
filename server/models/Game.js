const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  // Spin Game Configuration
  spinGame: {
    prizes: [{
      id: String,
      name: String,
      type: { 
        type: String, 
        enum: ['balance', 'bonus', 'spins', 'weapon', 'item', 'crash', 'jackpot'] 
      },
      value: Number,
      probability: Number, // 0-100
      itemKey: String, // For weapons/items
      tier: { type: String, enum: ['common', 'rare', 'epic', 'legendary', 'badluck'] },
      color: String,
      icon: String
    }],
    minBet: { type: Number, default: 1 },
    maxBet: { type: Number, default: 100 },
    active: { type: Boolean, default: true },
    progressiveJackpot: { type: Number, default: 1000 }
  },
  
  // Bird Shooting Configuration
  birdShooting: {
    levels: [{
      level: Number,
      birds: Number,
      timeLimit: Number,
      rewardMultiplier: Number,
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'] }
    }],
    entryFee: { type: Number, default: 10 },
    maxPlayers: { type: Number, default: 1 },
    active: { type: Boolean, default: true }
  },
  
  // General
  maintenance: { type: Boolean, default: false },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', gameSchema);
