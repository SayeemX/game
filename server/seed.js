const mongoose = require('mongoose');
const RedeemCode = require('./models/RedeemCode');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/khelazone';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected for Seeding');
    
    // Clear existing codes
    await RedeemCode.deleteMany({});

    const codes = [
      { code: 'WELCOME5', rewardType: 'SPIN_CREDIT', rewardValue: 5, maxRedemptions: 100 },
      { code: 'BONUS100', rewardType: 'BALANCE', rewardValue: 100, maxRedemptions: 50 },
      { code: 'VIPSPIN', rewardType: 'SPIN_CREDIT', rewardValue: 20, maxRedemptions: 10 }
    ];

    await RedeemCode.insertMany(codes);
    console.log('Database Seeded with Codes:');
    console.log(codes.map(c => `${c.code} -> ${c.rewardValue} ${c.rewardType}`).join('\n'));

    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

