const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const BirdWeapon = require('../models/BirdWeapon');
const Transaction = require('../models/Transaction');

// @route   GET api/shop/items
// @desc    Get all available items in the shop
router.get('/items', auth, async (req, res) => {
    try {
        const items = await BirdWeapon.find();
        const user = await User.findById(req.user.id);
        
        // Mark items already owned by the user
        const ownedKeys = user.inventory.weapons.map(w => w.weaponId.toString());
        
        const itemsWithStatus = items.map(item => ({
            ...item.toObject(),
            isOwned: ownedKeys.includes(item._id.toString()),
            isEquipped: user.inventory.equippedWeapon === item.key
        }));

        res.json(itemsWithStatus);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/shop/buy
// @desc    Purchase an item
router.post('/buy', auth, async (req, res) => {
    const { itemId } = req.body;
    try {
        const item = await BirdWeapon.findById(itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        const user = await User.findById(req.user.id);
        
        // Check if already owned
        const isOwned = user.inventory.weapons.some(w => w.weaponId.toString() === itemId);
        if (isOwned) return res.status(400).json({ error: 'You already own this item' });

        // Check balance
        if (user.wallet.mainBalance < item.price) {
            return res.status(400).json({ error: 'Insufficient TRX balance' });
        }

        // Deduct balance
        user.wallet.mainBalance -= item.price;
        user.wallet.totalSpent += item.price;
        
        // Add to inventory
        user.inventory.weapons.push({ weaponId: item._id });
        
        // Create transaction record
        await Transaction.create({
            userId: user._id,
            type: 'admin_deduct', // Or add a new type like 'purchase'
            amount: item.price,
            currency: 'TRX',
            description: `Purchased item: ${item.name}`,
            status: 'completed'
        });

        await user.save();
        res.json({ success: true, message: 'Purchase successful!', wallet: user.wallet, inventory: user.inventory });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/shop/equip
// @desc    Equip an owned item
router.post('/equip', auth, async (req, res) => {
    const { itemKey } = req.body;
    try {
        const user = await User.findById(req.user.id).populate('inventory.weapons.weaponId');
        
        // Verify user owns this weapon
        const ownsItem = user.inventory.weapons.some(w => w.weaponId.key === itemKey);
        if (!ownsItem && itemKey !== 'basic_bow') {
            return res.status(400).json({ error: 'Item not owned' });
        }

        user.inventory.equippedWeapon = itemKey;
        await user.save();

        res.json({ success: true, message: 'Item equipped!', equippedWeapon: itemKey });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
