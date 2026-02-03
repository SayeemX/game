const mongoose = require('mongoose');

const currencyConfigSchema = new mongoose.Schema({
  currency: { type: String, unique: true, required: true },
  minDeposit: { type: Number, default: 0 },
  maxDeposit: { type: Number, default: 100000 },
  minWithdrawal: { type: Number, default: 0 },
  maxWithdrawal: { type: Number, default: 100000 },
  allowDeposit: { type: Boolean, default: true },
  allowWithdrawal: { type: Boolean, default: true },
});

module.exports = mongoose.model('CurrencyConfig', currencyConfigSchema);
