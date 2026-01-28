const mongoose = require('mongoose');

const weaponSchema = new mongoose.Schema({
  name: { type: String, required: true },
  key: { type: String, required: true, unique: true }, // 'basic_bow', 'pro_airgun', etc.
  type: { type: String, enum: ['bow', 'airgun'], default: 'bow' },
  damage: { type: Number, default: 1 },
  fireRate: { type: Number, default: 500 }, // ms between shots
  accuracy: { type: Number, default: 1.0 },
  price: { type: Number, default: 0 }, // in TRX
  perks: {
    headshotMultiplier: { type: Number, default: 1.5 },
    windResistance: { type: Number, default: 0 } // 0 to 1
  }
});

module.exports = mongoose.model('BirdWeapon', weaponSchema);
