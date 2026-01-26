const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const RedeemCode = require('../models/RedeemCode');
const Transaction = require('../models/Transaction');
const RNGService = require('../services/rngService');
const crypto = require('crypto');

// Advanced Prize Tiers from Blueprint
const PRIZES = [
  { id: 0, label: '10 Coins', weight: 60, type: 'BALANCE', value: 10, color: '#94a3b8' },
  { id: 1, label: '50 Coins', weight: 25, type: 'BALANCE', value: 50, color: '#38bdf8' },
  { id: 2, label: 'Rare Card', weight: 10, type: 'CARD', value: 100, color: '#a855f7' },
  { id: 3, label: '500 Coins', weight: 4, type: 'BALANCE', value: 500, color: '#fbbf24' },
  { id: 4, label: 'JACKPOT', weight: 1, type: 'TRX', value: 1000, color: '#ef4444' }
];

// @route   POST api/game/spin
// @desc    Advanced Provably Fair Spin
router.post('/spin', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.user.id);

    if (user.wallet.spinCredits < 1) {
      return res.status(400).json({ msg: 'Insufficient Spin Credits' });
    }

    // 1. Setup Provably Fair Seeds
    const clientSeed = req.body.clientSeed || crypto.randomBytes(8).toString('hex');
    const nonce = Date.now();
    
    // 2. Generate Result via RNG Service
    const { decimal, hash, serverSeedHash } = RNGService.generateProvablyFairResult(clientSeed, nonce);
    const prize = RNGService.selectPrize(PRIZES, decimal);

    // 3. Atomically update User and Record Transaction
    user.wallet.spinCredits -= 1;
    
    if (prize.type === 'BALANCE') {
      user.wallet.mainBalance += prize.value;
      
      await Transaction.create({
        userId: user._id,
        type: 'PRIZE_WIN',
        amount: prize.value,
        description: `Won ${prize.label} from Fortune Spin`
      });
    } else {
      user.inventory.push({
        itemName: prize.label,
        itemType: prize.type,
        value: prize.value
      });
    }

    await user.save();

    res.json({
      success: true,
      prize,
      verification: {
        hash,
        serverSeedHash,
        clientSeed,
        nonce
      },
      user: {
        wallet: user.wallet,
        inventory: user.inventory
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/game/redeem
router.post('/redeem', auth, async (req, res) => {
  const { code } = req.body;
  try {
    const redeemCode = await RedeemCode.findOne({ code });
    if (!redeemCode || !redeemCode.isActive) {
      return res.status(404).json({ msg: 'Invalid or Expired Code' });
    }

    const user = await User.findById(req.user.user.id);
    
    if (redeemCode.rewardType === 'SPIN_CREDIT') {
      user.wallet.spinCredits += redeemCode.rewardValue;
    } else {
      user.wallet.mainBalance += redeemCode.rewardValue;
    }

    redeemCode.currentRedemptions += 1;
    if (redeemCode.currentRedemptions >= redeemCode.maxRedemptions) {
      redeemCode.isActive = false;
    }

    await user.save();
    await redeemCode.save();

    await Transaction.create({
      userId: user._id,
      type: 'REDEEM',
      amount: redeemCode.rewardValue,
      description: `Redeemed code: ${code}`
    });

    res.json({ msg: 'Success', user: { wallet: user.wallet } });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;