const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @route   POST api/payment/deposit
// @desc    Handle deposit requests (Manual bKash/Nagad or TRX)
router.post('/deposit', auth, async (req, res) => {
    const { amount, method, transactionId, senderNumber } = req.body;
    
    try {
        if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

        const transaction = new Transaction({
            userId: req.user.id,
            type: 'deposit',
            amount: parseFloat(amount),
            status: 'pending', // Deposits usually need admin approval in manual systems
            paymentMethod: method, // 'bkash', 'nagad', 'trx'
            transactionId: transactionId,
            metadata: {
                senderNumber: senderNumber,
                timestamp: new Date()
            },
            description: `Deposit via ${method.toUpperCase()}`
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
        const user = await User.findById(req.user.id);
        if (user.wallet.mainBalance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Deduct balance immediately for withdrawal request
        user.wallet.mainBalance -= parseFloat(amount);
        
        const transaction = new Transaction({
            userId: req.user.id,
            type: 'withdrawal',
            amount: parseFloat(amount),
            status: 'pending',
            paymentMethod: method,
            metadata: {
                accountDetails: accountDetails
            },
            description: `Withdrawal to ${method.toUpperCase()}: ${accountDetails}`
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
        const user = await User.findById(req.user.id);
        if (user.wallet.mainBalance < amount) {
            return res.status(400).json({ message: 'Insufficient balance for recharge' });
        }

        // Deduct balance
        user.wallet.mainBalance -= parseFloat(amount);

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