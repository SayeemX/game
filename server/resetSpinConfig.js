require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('./models/Game');

const DEFAULT_PRIZES = [
  { id: '1', name: "2 TRX", value: 2, type: "balance", probability: 25, color: "#2d3436", tier: "common" },
  { id: '2', name: "5 TRX", value: 5, type: "balance", probability: 15, color: "#00b894", tier: "common" },
  { id: '3', name: "Crash", value: 0, type: "badluck", probability: 30, color: "#d63031", tier: "common" },
  { id: '4', name: "7 TRX", value: 7, type: "balance", probability: 10, color: "#0984e3", tier: "common" },
  { id: '5', name: "10 TRX", value: 10, type: "balance", probability: 8, color: "#6c5ce7", tier: "rare" },
  { id: '6', name: "Free Spin", value: 1, type: "spins", probability: 7, color: "#fdcb6e", tier: "rare" },
  { id: '7', name: "100 TRX", value: 100, type: "balance", probability: 4, color: "#e84393", tier: "rare" },
  { id: '8', name: "JACKPOT", value: 0, type: "jackpot", probability: 1, color: "#f1c40f", tier: "legendary" },
];

async function resetConfig() {
    try {
        const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/game';
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
        
        await Game.deleteMany({});
        console.log('Old config deleted');
        
        await Game.create({
            spinGame: {
                prizes: DEFAULT_PRIZES,
                minBet: 1,
                maxBet: 100,
                progressiveJackpot: 1000
            }
        });
        console.log('New config with Jackpot created successfully');
        
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

resetConfig();
