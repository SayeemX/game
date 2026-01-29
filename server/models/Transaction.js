const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: [
      'deposit', 'withdrawal', 'spin_bet', 'spin_win', 
      'game_bet', 'game_win', 'bonus', 'referral', 
      'admin_add', 'admin_deduct', 'recharge', 'purchase', 
      'spin_game', 'PRIZE_WIN', 'REDEEM'
    ],
    required: true 
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'TRX' },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  
  // For payments
  paymentMethod: String,
  transactionId: String,
  providerResponse: mongoose.Schema.Types.Mixed,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

// Indexes for faster queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ transactionId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Transaction', transactionSchema);