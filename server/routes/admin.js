const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const RedeemCode = require('../models/RedeemCode');
const Transaction = require('../models/Transaction');
const Game = require('../models/Game');
const BirdWeapon = require('../models/BirdWeapon');
const mongoose = require('mongoose');
const CurrencyConfig = require('../models/CurrencyConfig');

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

// --- Currency Config ---
router.get('/currency-config', auth, admin, async (req, res) => {
    try {
        const configs = await CurrencyConfig.find();
        res.json(configs);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/currency-config', auth, admin, async (req, res) => {
    try {
        const { currency, minDeposit, maxDeposit, minWithdrawal, maxWithdrawal, allowDeposit, allowWithdrawal } = req.body;
        const config = await CurrencyConfig.findOneAndUpdate(
            { currency },
            { minDeposit, maxDeposit, minWithdrawal, maxWithdrawal, allowDeposit, allowWithdrawal },
            { new: true, upsert: true }
        );
        res.json(config);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Transaction Management ---
router.get('/transactions/pending', auth, admin, async (req, res) => {
    try {
        const txs = await Transaction.find({
            $or: [
                { status: 'pending' }, // Pending withdrawals
                { type: 'deposit', status: 'completed', 'metadata.autoApproved': true, 'metadata.adminReviewed': { $ne: true } } // Auto-approved, unreviewed deposits
            ]
        })
            .populate('userId', 'username email')
            .sort({ createdAt: -1 });
        res.json(txs);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/transactions/process', auth, admin, async (req, res) => {
    const { txId, action, reason } = req.body; // action: 'approve' or 'reject'
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const tx = await Transaction.findById(txId).session(session);
        if (!tx) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (tx.status !== 'pending' && tx.type === 'withdrawal') {
             return res.status(400).json({ message: 'Withdrawal has already been processed.' });
        }
        
        if (tx.status !== 'completed' && tx.type === 'deposit') {
             return res.status(400).json({ message: 'Deposit has already been processed.' });
        }

        let userUpdate = {};
        
        if (tx.type === 'withdrawal') {
            if (action === 'approve') {
                tx.status = 'completed';
                tx.completedAt = new Date();
                userUpdate = { $inc: { 'wallet.heldBalance': -tx.amount } };
            } else { // reject
                tx.status = 'failed';
                tx.description = `${tx.description} (Rejected: ${reason || 'N/A'})`;
                userUpdate = { $inc: { 'wallet.mainBalance': tx.amount, 'wallet.heldBalance': -tx.amount } };
            }
        } else if (tx.type === 'deposit') {
            if (action === 'reject') {
                tx.status = 'failed';
                tx.description = `${tx.description} (Rejected: ${reason || 'N/A'})`;
                userUpdate = { $inc: { 'wallet.mainBalance': -tx.amount } };
            } else { // approve (already auto-approved)
                tx.metadata.adminReviewed = true;
            }
        }

        await User.findByIdAndUpdate(tx.userId, userUpdate, { session });
        await tx.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.json({ success: true, transaction: tx });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Transaction processing error:', err);
        res.status(500).json({ error: 'Server error during transaction processing' });
    }
});

module.exports = router;