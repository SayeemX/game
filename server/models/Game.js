const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  // Advanced Spin Game Configuration
  spinGame: {
    tiers: {
      BRONZE: {
        cost: { type: Number, default: 1 },
        segments: { type: Number, default: 24 },
        prizes: [mongoose.Schema.Types.Mixed]
      },
      SILVER: {
        cost: { type: Number, default: 10 },
        segments: { type: Number, default: 32 },
        prizes: [mongoose.Schema.Types.Mixed]
      },
      GOLD: {
        cost: { type: Number, default: 100 },
        segments: { type: Number, default: 48 },
        prizes: [mongoose.Schema.Types.Mixed]
      },
      DIAMOND: {
        cost: { type: Number, default: 1000 },
        segments: { type: Number, default: 64 },
        prizes: [mongoose.Schema.Types.Mixed]
      }
    },
    jackpots: {
      MINI: { current: { type: Number, default: 100 }, base: { type: Number, default: 100 } },
      MINOR: { current: { type: Number, default: 1000 }, base: { type: Number, default: 1000 } },
      MAJOR: { current: { type: Number, default: 10000 }, base: { type: Number, default: 10000 } },
      GRAND: { current: { type: Number, default: 100000 }, base: { type: Number, default: 100000 } },
      MEGA: { current: { type: Number, default: 1000000 }, base: { type: Number, default: 1000000 } }
    },
    active: { type: Boolean, default: true }
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
  
  // Shop Configuration (Consumables)
  shop: {
    consumables: [{
      itemKey: String,
      name: String,
      amount: Number,
      price: Number,
      active: { type: Boolean, default: true }
    }]
  },
  
  // General
  maintenance: { type: Boolean, default: false },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', gameSchema);