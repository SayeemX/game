const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Game = require('../models/Game');

// @route   GET api/payment/methods
// @desc    Get public deposit details (bKash/TRX)
router.get('/methods', auth, async (req, res) => {
    try {
        const config = await Game.findOne();
        res.json({
            success: true,
            payment: config?.payment || {
                bkash: { number: "017XXXXXXXX", active: true },
                nagad: { number: "018XXXXXXXX", active: true },
                trx: { address: "TY123...456", active: true },
                conversionRate: 15
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/payment/deposit
// @desc    Handle deposit requests (Manual bKash/Nagad or TRX)
router.post('/deposit', auth, async (req, res) => {
    const { amount, method, transactionId, senderNumber } = req.body;
    
    try {
        const config = await Game.findOne();
        const conversionRate = config?.payment?.conversionRate || 15;

        const trxAmount = parseFloat(amount);
        if (isNaN(trxAmount) || trxAmount <= 0) {
            return res.status(400).json({ message: 'Invalid amount. Must be greater than 0.' });
        }
        let bdtAmount = 0;

        if (method === 'bkash' || method === 'nagad') {
            bdtAmount = trxAmount * conversionRate;
        }

        const transaction = new Transaction({
            userId: req.user.id,
            type: 'deposit',
            amount: trxAmount,
            currency: 'TRX',
            status: 'pending',
            paymentMethod: method,
            transactionId: transactionId,
            metadata: {
                senderNumber: senderNumber,
                timestamp: new Date(),
                bdtAmount: bdtAmount > 0 ? bdtAmount : null,
                conversionRate: bdtAmount > 0 ? conversionRate : null
            },
            description: `Deposit via ${method.toUpperCase()}${bdtAmount > 0 ? ` (${bdtAmount} BDT)` : ''}`
        });

        await transaction.save();
        res.json({ success: true, message: 'Deposit request submitted. Waiting for verification.', transaction });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/payment/withdraw
// @desc    Handle withdrawal requests
router.post('/withdraw', auth, async (req, res) => {
    const { amount, method, accountDetails } = req.body;
    
    try {
        const config = await Game.findOne();
        const conversionRate = config?.payment?.conversionRate || 15;

        const trxAmount = parseFloat(amount);
        if (isNaN(trxAmount) || trxAmount <= 0) {
            return res.status(400).json({ message: 'Invalid amount. Must be greater than 0.' });
        }

        const user = await User.findById(req.user.id);
        if (user.wallet.mainBalance < trxAmount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Deduct balance immediately for withdrawal request
        user.wallet.mainBalance -= trxAmount;
        
        let bdtAmount = 0;
        if (method === 'bkash' || method === 'nagad') {
            bdtAmount = trxAmount * conversionRate;
        }

        const transaction = new Transaction({
            userId: req.user.id,
            type: 'withdrawal',
            amount: trxAmount,
            currency: 'TRX',
            status: 'pending',
            paymentMethod: method,
            metadata: {
                accountDetails: accountDetails,
                conversionRate: method !== 'trx' ? conversionRate : null,
                bdtAmount: bdtAmount > 0 ? bdtAmount : null
            },
            description: `Withdrawal to ${method.toUpperCase()}: ${accountDetails}${bdtAmount > 0 ? ` (${bdtAmount} BDT)` : ''}`
        });

        await user.save();
        await transaction.save();
        
        res.json({ success: true, message: 'Withdrawal request submitted.', wallet: user.wallet });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/payment/recharge
// @desc    Mobile Recharge system
router.post('/recharge', auth, async (req, res) => {
    const { phoneNumber, operator, amount } = req.body;

    try {
        const trxAmount = parseFloat(amount);
        if (isNaN(trxAmount) || trxAmount <= 0) {
            return res.status(400).json({ message: 'Invalid amount. Must be greater than 0.' });
        }

        const user = await User.findById(req.user.id);
        if (user.wallet.mainBalance < trxAmount) {
            return res.status(400).json({ message: 'Insufficient balance for recharge' });
        }

        // Deduct balance
        user.wallet.mainBalance -= trxAmount;

        const transaction = new Transaction({
            userId: req.user.id,
            type: 'bonus', // Using bonus type or we could add 'recharge' to enum
            amount: parseFloat(amount),
            status: 'completed', // Realistically this would call a Recharge API
            description: `Mobile Recharge (${operator}): ${phoneNumber}`,
            metadata: {
                phoneNumber,
                operator,
                service: 'mobile_recharge'
            },
            completedAt: new Date()
        });

        // Add 'recharge' to Transaction enum if possible, or just use description
        transaction.type = 'admin_deduct'; // Temporary mapping to valid enum

        await user.save();
        await transaction.save();

        res.json({ success: true, message: 'Recharge successful!', wallet: user.wallet });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET api/payment/history
// @desc    Get user transaction history
router.get('/history', auth, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;