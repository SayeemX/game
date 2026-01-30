const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const RedeemCode = require('../models/RedeemCode');
const Transaction = require('../models/Transaction');

// Redeem a code
router.post('/', auth, async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id;

  try {
    // 1. Find the code
    const redeemCode = await RedeemCode.findOne({ code: code.toUpperCase() });
    
    if (!redeemCode) {
      return res.status(404).json({ message: 'Invalid redeem code' });
    }

    // 2. Validations
    if (!redeemCode.isActive) {
      return res.status(400).json({ message: 'This code is no longer active' });
    }

    if (redeemCode.expiresAt && new Date() > redeemCode.expiresAt) {
      redeemCode.isActive = false;
      await redeemCode.save();
      return res.status(400).json({ message: 'This code has expired' });
    }

    if (redeemCode.currentRedemptions >= redeemCode.maxRedemptions) {
      return res.status(400).json({ message: 'This code has reached its maximum redemptions' });
    }

    // Check if user already redeemed this code
    const userAlreadyRedeemed = await Transaction.findOne({
        userId,
        type: 'bonus',
        'metadata.code': redeemCode.code
    });

    if (userAlreadyRedeemed) {
        return res.status(400).json({ message: 'You have already redeemed this code' });
    }

    // 3. Apply reward
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let rewardDescription = '';
    if (redeemCode.rewardType === 'BALANCE') {
        user.wallet.bonusBalance += redeemCode.rewardValue;
        rewardDescription = `${redeemCode.rewardValue} TRX Bonus Balance`;
    } else if (redeemCode.rewardType === 'SPIN_CREDIT') {
        user.wallet.spinCredits.BRONZE += redeemCode.rewardValue;
        rewardDescription = `${redeemCode.rewardValue} BRONZE Spin Credits`;
    }

    // 4. Log Transaction
    const transaction = new Transaction({
        userId,
        type: 'bonus',
        amount: redeemCode.rewardValue,
        status: 'completed',
        description: `Redeemed code: ${redeemCode.code} for ${rewardDescription}`,
        metadata: {
            code: redeemCode.code,
            rewardType: redeemCode.rewardType
        },
        completedAt: new Date()
    });

    // 5. Update counts
    redeemCode.currentRedemptions += 1;
    if (redeemCode.currentRedemptions >= redeemCode.maxRedemptions) {
        redeemCode.isActive = false;
    }

    // Save everything
    await Promise.all([
        user.save(),
        transaction.save(),
        redeemCode.save()
    ]);

    res.json({
        success: true,
        message: `Successfully redeemed! You received ${rewardDescription}`,
        wallet: user.wallet
    });

  } catch (error) {
    console.error('Redeem error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
