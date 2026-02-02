const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const RedeemCode = require('../models/RedeemCode');
const Transaction = require('../models/Transaction');
const Game = require('../models/Game');
const BirdWeapon = require('../models/BirdWeapon');

// @route   GET api/admin/stats
router.get('/stats', auth, admin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const users = await User.find();
        const totalBalance = users.reduce((acc, user) => acc + (user.wallet.mainBalance || 0), 0);
        const totalBonus = users.reduce((acc, user) => acc + (user.wallet.bonusBalance || 0), 0);
        
        const gameConfig = await Game.findOne();
        const trxPool = gameConfig?.trxPool || 0;
        
        const totalTransactions = await Transaction.countDocuments();
        const pendingTransactions = await Transaction.countDocuments({ status: 'pending' });
        
        res.json({ 
            totalUsers, 
            totalBalance, 
            totalBonus, 
            totalTransactions, 
            pendingTransactions,
            trxPool 
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET api/admin/users
router.get('/users', auth, admin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/admin/users/update-balance
router.post('/users/update-balance', auth, admin, async (req, res) => {
    const { userId, amount, type, description } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        const updateAmount = parseFloat(amount);
        if (type === 'main') user.wallet.mainBalance += updateAmount;
        else user.wallet.bonusBalance += updateAmount;
        await user.save();
        await Transaction.create({
            userId,
            type: updateAmount >= 0 ? 'admin_add' : 'admin_deduct',
            amount: Math.abs(updateAmount),
            status: 'completed',
            description: description || `Admin update`,
            completedAt: new Date()
        });
        res.json({ success: true, wallet: user.wallet });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET api/admin/spin-config
router.get('/spin-config', auth, admin, async (req, res) => {
    try {
        const config = await Game.findOne();
        res.json(config ? config.spinGame : { tiers: {}, jackpots: {} });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/admin/spin-config
router.post('/spin-config', auth, admin, async (req, res) => {
    try {
        const { tiers, jackpots } = req.body;
        let config = await Game.findOne();
        if (!config) config = new Game({ spinGame: { tiers, jackpots } });
        else {
            if (tiers) config.spinGame.tiers = tiers;
            if (jackpots) config.spinGame.jackpots = jackpots;
        }
        await config.save();
        res.json(config.spinGame);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Shop Management ---
router.get('/shop-items', auth, admin, async (req, res) => {
    try {
        const items = await BirdWeapon.find().sort({ price: 1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/shop-items', auth, admin, async (req, res) => {
    try {
        const newItem = new BirdWeapon(req.body);
        await newItem.save();
        res.json(newItem);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/shop-items/:id', auth, admin, async (req, res) => {
    try {
        const item = await BirdWeapon.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/shop-items/:id', auth, admin, async (req, res) => {
    try {
        await BirdWeapon.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Redeem Codes ---
router.get('/redeem-codes', auth, admin, async (req, res) => {
    try {
        const codes = await RedeemCode.find().sort({ createdAt: -1 });
        res.json(codes);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/redeem-codes', auth, admin, async (req, res) => {
    try {
        const newCode = new RedeemCode(req.body);
        await newCode.save();
        res.json(newCode);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Bird Config ---
router.get('/bird-config', auth, admin, async (req, res) => {
    try {
        const config = await Game.findOne();
        res.json(config ? config.birdShooting : { entryFee: 10 });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/bird-config', auth, admin, async (req, res) => {
    try {
        let config = await Game.findOne();
        if (!config) config = new Game({ birdShooting: req.body });
        else config.birdShooting = { ...config.birdShooting, ...req.body };
        await config.save();
        res.json(config.birdShooting);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Payment Config ---
router.get('/payment-config', auth, admin, async (req, res) => {
    try {
        const config = await Game.findOne();
        res.json(config ? config.payment : {});
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/payment-config', auth, admin, async (req, res) => {
    try {
        let config = await Game.findOne();
        if (!config) config = new Game({ payment: req.body });
        else config.payment = { ...config.payment, ...req.body };
        await config.save();
        res.json(config.payment);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Transaction Management ---
router.get('/transactions/pending', auth, admin, async (req, res) => {
    try {
        const txs = await Transaction.find({ status: 'pending' })
            .populate('userId', 'username email')
            .sort({ createdAt: -1 });
        res.json(txs);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/transactions/process', auth, admin, async (req, res) => {
    const { txId, action, reason } = req.body; // action: 'approve' or 'reject'
    try {
        const tx = await Transaction.findById(txId);
        if (!tx || tx.status !== 'pending') {
            return res.status(404).json({ message: 'Transaction not found or already processed' });
        }

        const user = await User.findById(tx.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (action === 'approve') {
            tx.status = 'completed';
            tx.completedAt = new Date();
            
            // If it's a deposit, add the funds now
            if (tx.type === 'deposit') {
                user.wallet.mainBalance += tx.amount;
                await user.save();
            }
            // For withdrawal, funds were already deducted upon request. 
            // So we just mark it as completed.
        } else {
            tx.status = 'failed';
            tx.description = (tx.description || '') + ` (Rejected: ${reason || 'No reason provided'})`;
            
            // If it was a withdrawal, refund the user
            if (tx.type === 'withdrawal') {
                user.wallet.mainBalance += tx.amount;
                await user.save();
            }
        }

        await tx.save();
        res.json({ success: true, transaction: tx });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;