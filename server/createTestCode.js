require('dotenv').config();
const mongoose = require('mongoose');
const RedeemCode = require('./models/RedeemCode');

const createCode = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const code = new RedeemCode({
      code: 'SAYEEMX2026',
      rewardType: 'BALANCE',
      rewardValue: 50,
      maxRedemptions: 100,
      isActive: true,
      expiresAt: new Date('2026-12-31')
    });

    await RedeemCode.deleteMany({ code: 'SAYEEMX2026' }); // Clear old one if exists
    await code.save();
    
    console.log('✅ Test code created: SAYEEMX2026 ($50 Bonus)');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createCode();
