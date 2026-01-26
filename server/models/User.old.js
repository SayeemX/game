const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  spinCredits: { type: Number, default: 0 },
  inventory: [{
    itemName: String,
    type: String, // 'CARD', 'SKIN', 'TRX'
    value: Number,
    dateWon: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
