const mongoose = require('mongoose');

const redeemCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  rewardType: { type: String, enum: ['SPIN_CREDIT', 'BALANCE'], required: true },
  rewardValue: { type: Number, required: true },
  maxRedemptions: { type: Number, default: 1 },
  currentRedemptions: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date }
});

module.exports = mongoose.model('RedeemCode', redeemCodeSchema);
