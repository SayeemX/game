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
    const codeString = code.toUpperCase();
    
    // 1. Check if user already redeemed this code
    const userAlreadyRedeemed = await Transaction.findOne({
        userId,
        type: 'bonus',
        status: 'completed',
        'metadata.code': codeString
    });

    if (userAlreadyRedeemed) {
        return res.status(400).json({ message: 'You have already redeemed this code' });
    }

    // 2. Atomic find and update for code
    const redeemCode = await RedeemCode.findOneAndUpdate(
        { 
            code: codeString, 
            isActive: true, 
            currentRedemptions: { $lt: 1000000 }, // Dummy large number for fallback
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: new Date() } }
            ]
        },
        { $inc: { currentRedemptions: 1 } },
        { new: true }
    );
    
    if (!redeemCode || redeemCode.currentRedemptions > redeemCode.maxRedemptions) {
        // Rollback if max reached
        if (redeemCode) await RedeemCode.updateOne({ _id: redeemCode._id }, { $inc: { currentRedemptions: -1 } });
        return res.status(400).json({ message: 'Invalid, expired, or fully redeemed code' });
    }

    // Auto-disable if max reached
    if (redeemCode.currentRedemptions === redeemCode.maxRedemptions) {
        await RedeemCode.updateOne({ _id: redeemCode._id }, { $set: { isActive: false } });
    }

    // 3. Atomic apply reward
    const userUpdate = { $inc: {} };
    let rewardDescription = '';

    if (redeemCode.rewardType === 'BALANCE') {
        userUpdate.$inc["wallet.bonusBalance"] = redeemCode.rewardValue;
        rewardDescription = `${redeemCode.rewardValue} TRX Bonus Balance`;
    } else if (redeemCode.rewardType === 'SPIN_CREDIT') {
        userUpdate.$inc["wallet.spinCredits.BRONZE"] = redeemCode.rewardValue;
        rewardDescription = `${redeemCode.rewardValue} BRONZE Spin Credits`;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, userUpdate, { new: true });

    // 4. Log Transaction
    await Transaction.create({
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

    res.json({
        success: true,
        message: `Successfully redeemed! You received ${rewardDescription}`,
        wallet: updatedUser.wallet
    });

  } catch (error) {
    console.error('Redeem error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
