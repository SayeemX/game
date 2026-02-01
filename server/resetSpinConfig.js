require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('./models/Game');

const WHEEL_TIERS = {
  BRONZE: { cost: 1, segments: 24, label: 'Bronze' },
  SILVER: { cost: 10, segments: 32, label: 'Silver' },
  GOLD: { cost: 100, segments: 48, label: 'Gold' },
  DIAMOND: { cost: 1000, segments: 64, label: 'Diamond' }
};

const getPrizesForTier = (tier) => {
    const basePrizes = [
        { id: '1', name: "0.1 TRX", value: 0.1, type: "balance", probability: 25, color: "#4CAF50" },
        { id: '2', name: "1 TRX", value: 1, type: "balance", probability: 15, color: "#8BC34A" },
        { id: '3', name: "Loss", value: 0, type: "crash", probability: 25, color: "#9E9E9E" },
        { id: '4', name: "5 TRX", value: 5, type: "balance", probability: 10, color: "#FF9800" },
        { id: '5', name: "MINI", value: 0, type: "jackpot", jackpotType: 'MINI', probability: 5, color: "#FFEB3B" },
        { id: '6', name: "Free Spin", value: 1, type: "spins", probability: 10, color: "#2196F3" },
        { id: '7', name: "50x Arrows", value: 50, type: "item", itemKey: "arrow", probability: 10, color: "#9C27B0" }
    ];
    
    const multiplier = WHEEL_TIERS[tier].cost;
    return basePrizes.map(p => ({
        ...p,
        value: p.type === 'balance' ? p.value * multiplier : p.value,
        id: `${tier}_${p.id}`
    }));
};

async function resetConfig() {
    try {
        const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/game';
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
        
        const tiers = {};
        Object.keys(WHEEL_TIERS).forEach(tier => {
            tiers[tier] = {
                ...WHEEL_TIERS[tier],
                prizes: getPrizesForTier(tier)
            };
        });
        
        const jackpots = {
            MINI: { current: 100, base: 100 },
            MINOR: { current: 1000, base: 1000 },
            MAJOR: { current: 10000, base: 10000 },
            GRAND: { current: 100000, base: 100000 },
            MEGA: { current: 1000000, base: 1000000 }
        };

        await Game.deleteMany({});
        await Game.create({
            spinGame: { tiers, jackpots }
        });
        console.log('Tiered Spin Config reset successfully');
        
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

resetConfig();
