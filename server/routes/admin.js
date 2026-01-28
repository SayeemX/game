const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const RedeemCode = require('../models/RedeemCode');
const Transaction = require('../models/Transaction');

// @route   GET api/admin/stats
// @desc    Get site statistics
router.get('/stats', auth, admin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const users = await User.find();
        const totalBalance = users.reduce((acc, user) => acc + (user.wallet.mainBalance || 0), 0);
        const totalBonus = users.reduce((acc, user) => acc + (user.wallet.bonusBalance || 0), 0);
        
        const totalTransactions = await Transaction.countDocuments();
        
        res.json({
            totalUsers,
            totalBalance,
            totalBonus,
            totalTransactions
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET api/admin/users
// @desc    Get all users
router.get('/users', auth, admin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/admin/users/update-balance
// @desc    Update user balance
router.post('/users/update-balance', auth, admin, async (req, res) => {
    const { userId, amount, type, description } = req.body;
    try {
        const updateAmount = parseFloat(amount);
        if (isNaN(updateAmount)) return res.status(400).json({ message: 'Invalid amount' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (type === 'main') {
            if (user.wallet.mainBalance + updateAmount < 0) {
                return res.status(400).json({ message: 'Resulting main balance cannot be negative' });
            }
            user.wallet.mainBalance += updateAmount;
        } else {
            if (user.wallet.bonusBalance + updateAmount < 0) {
                return res.status(400).json({ message: 'Resulting bonus balance cannot be negative' });
            }
            user.wallet.bonusBalance += updateAmount;
        }

        const transaction = new Transaction({
            userId,
            type: updateAmount >= 0 ? 'admin_add' : 'admin_deduct',
            amount: Math.abs(updateAmount),
            status: 'completed',
            description: description || `Admin balance update: ${updateAmount}`,
            completedAt: new Date()
        });

        await user.save();
        await transaction.save();

        res.json({ success: true, wallet: user.wallet });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/admin/redeem-codes
// @desc    Create a new redeem code
router.post('/redeem-codes', auth, admin, async (req, res) => {
    const { code, rewardType, rewardValue, maxRedemptions, expiresAt } = req.body;
    try {
        let existing = await RedeemCode.findOne({ code: code.toUpperCase() });
        if (existing) return res.status(400).json({ message: 'Code already exists' });

        const newCode = new RedeemCode({
            code: code.toUpperCase(),
            rewardType,
            rewardValue,
            maxRedemptions: maxRedemptions || 1,
            expiresAt: expiresAt || null
        });

        await newCode.save();
        res.json(newCode);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET api/admin/redeem-codes
// @desc    Get all redeem codes
router.get('/redeem-codes', auth, admin, async (req, res) => {
    try {
        const codes = await RedeemCode.find().sort({ createdAt: -1 });
        res.json(codes);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

const Game = require('../models/Game');

// @route   GET api/admin/spin-config
// @desc    Get spin game config
router.get('/spin-config', auth, admin, async (req, res) => {
    try {
        let config = await Game.findOne();
        res.json(config ? config.spinGame : { prizes: [] });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/admin/spin-config
// @desc    Update spin game config
router.post('/spin-config', auth, admin, async (req, res) => {
    try {
        const { prizes, minBet, maxBet, progressiveJackpot } = req.body;
        
        if (!prizes || !Array.isArray(prizes)) {
            return res.status(400).json({ error: 'Prizes must be an array' });
        }

        // Validate Total Probability
        const totalProb = prizes.reduce((acc, p) => acc + (parseFloat(p.probability) || 0), 0);
        if (Math.abs(totalProb - 100) > 0.01) {
            return res.status(400).json({ error: `Total probability must be 100%. Current: ${totalProb}%` });
        }

        let config = await Game.findOne();
        if (!config) {
            config = new Game({ 
                spinGame: { prizes, minBet, maxBet, progressiveJackpot } 
            });
        } else {
            config.spinGame = { 
                ...config.spinGame, 
                prizes, 
                minBet: minBet || config.spinGame.minBet, 
                maxBet: maxBet || config.spinGame.maxBet,
                progressiveJackpot: progressiveJackpot !== undefined ? progressiveJackpot : config.spinGame.progressiveJackpot
            };
        }
        
        await config.save();
        res.json(config.spinGame);
    } catch (err) {
        console.error('Update spin config error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET api/admin/bird-config
// @desc    Get bird shooting game config
router.get('/bird-config', auth, admin, async (req, res) => {
    try {
        let config = await Game.findOne();
        res.json(config ? config.birdShooting : { entryFee: 10 });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/admin/bird-config
// @desc    Update bird shooting game config
router.post('/bird-config', auth, admin, async (req, res) => {
    try {
        const { entryFee, active } = req.body;
        let config = await Game.findOne();
        if (!config) {
            config = new Game({ birdShooting: { entryFee, active } });
        } else {
            config.birdShooting = { 
                ...config.birdShooting, 
                entryFee: entryFee !== undefined ? entryFee : config.birdShooting.entryFee,
                active: active !== undefined ? active : config.birdShooting.active
            };
        }
        await config.save();
        res.json(config.birdShooting);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
