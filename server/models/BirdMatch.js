const mongoose = require('mongoose');

const birdMatchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  matchId: { type: String, required: true, unique: true },
  weaponKey: { type: String, default: 'basic_bow' },
  level: { type: Number, default: 1 },
  entryFee: { type: Number, required: true },
  score: { type: Number, default: 0 },
  reward: { type: Number, default: 0 },
  stats: {
    shots: { type: Number, default: 0 },
    hits: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 }
  },
  seed: { type: String, required: true },
  status: { type: String, enum: ['active', 'completed', 'verified', 'suspicious'], default: 'active' },
  metadata: {
    inTime: Number,
    outTime: Number,
    totalCharged: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  endedAt: Date
});

module.exports = mongoose.model('BirdMatch', birdMatchSchema);
