const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const BirdWeapon = require('../models/BirdWeapon');
const Transaction = require('../models/Transaction');
const Game = require('../models/Game');

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
        console.error('Shop Items Error:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// @route   POST api/shop/buy
// @desc    Purchase an item (Weapon or Consumable)
router.post('/buy', auth, async (req, res) => {
    const { itemId, itemKey, type = 'weapon' } = req.body;
    try {
        if (type === 'weapon') {
            const item = await BirdWeapon.findById(itemId);
            if (!item) return res.status(404).json({ error: 'Weapon not found' });

            // Atomic Check and Deduction
            const updatedUser = await User.findOneAndUpdate(
                { _id: req.user.id, "wallet.mainBalance": { $gte: item.price }, "inventory.weapons.weaponId": { $ne: item._id } },
                { 
                    $inc: { "wallet.mainBalance": -item.price, "wallet.totalSpent": item.price },
                    $push: { "inventory.weapons": { weaponId: item._id } }
                },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(400).json({ error: 'Insufficient balance or weapon already owned' });
            }

            await Transaction.create({
                userId: req.user.id,
                type: 'purchase',
                amount: item.price,
                currency: 'TRX',
                description: `Purchased weapon: ${item.name}`,
                status: 'completed'
            });

            return res.json({ success: true, message: 'Weapon purchased!', wallet: updatedUser.wallet, inventory: updatedUser.inventory });
        } else if (type === 'ammo') {
            const gameConfig = await Game.findOne();
            const ammoItem = gameConfig?.shop?.consumables?.find(i => i.itemKey === itemKey && i.active) || {
                itemKey,
                amount: itemKey === 'arrow' ? 50 : 100,
                price: 5
            };

            // Atomic Balance Check and Deduction
            const updatedUser = await User.findOneAndUpdate(
                { _id: req.user.id, "wallet.mainBalance": { $gte: ammoItem.price } },
                { $inc: { "wallet.mainBalance": -ammoItem.price, "wallet.totalSpent": ammoItem.price } },
                { new: true }
            );

            if (!updatedUser) return res.status(400).json({ error: 'Insufficient TRX balance' });

            // Atomic Ammo Addition
            const ammoUpdate = await User.updateOne(
                { _id: req.user.id, "inventory.items.itemKey": itemKey },
                { $inc: { "inventory.items.$.amount": ammoItem.amount } }
            );

            // If not existing, push new item
            if (ammoUpdate.matchedCount === 0) {
                await User.updateOne(
                    { _id: req.user.id },
                    { $push: { "inventory.items": { itemKey, amount: ammoItem.amount } } }
                );
            }

            await Transaction.create({
                userId: req.user.id,
                type: 'purchase',
                amount: ammoItem.price,
                currency: 'TRX',
                description: `Purchased ${ammoItem.amount} ${itemKey}s`,
                status: 'completed'
            });

            const finalUser = await User.findById(req.user.id);
            return res.json({ success: true, message: 'Ammo purchased!', wallet: finalUser.wallet, inventory: finalUser.inventory });
        }

        res.status(400).json({ error: 'Invalid purchase type' });
    } catch (err) {
        console.error('Purchase Error:', err);
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
        const ownsItem = user.inventory.weapons.some(w => w.weaponId && w.weaponId.key === itemKey);
        
        if (!ownsItem && itemKey !== 'basic_bow') {
            return res.status(400).json({ error: 'Item not owned' });
        }

        user.inventory.equippedWeapon = itemKey;
        await user.save();

        res.json({ success: true, message: 'Item equipped!', equippedWeapon: itemKey });
    } catch (err) {
        console.error('Purchase Error:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

const WHEEL_TIERS = {
    BRONZE: { cost: 1, label: 'Bronze' },
    SILVER: { cost: 10, label: 'Silver' },
    GOLD: { cost: 100, label: 'Gold' },
    DIAMOND: { cost: 1000, label: 'Diamond' }
};

// @route   POST api/shop/buy-spins
// @desc    Purchase spin credits for a specific tier
router.post('/buy-spins', auth, async (req, res) => {
    const { amount, tier = 'BRONZE' } = req.body; 
    
    try {
        const numAmount = parseInt(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            return res.status(400).json({ error: 'Invalid amount. Must be a positive number.' });
        }

        const tierKey = tier.toUpperCase();
        if (!WHEEL_TIERS[tierKey]) {
            return res.status(400).json({ error: 'Invalid wheel tier. Choose BRONZE, SILVER, GOLD, or DIAMOND.' });
        }

        const tierConfig = WHEEL_TIERS[tierKey];
        const cost = numAmount * tierConfig.cost;
        
        // Atomic balance check and deduction
        const updatedUser = await User.findOneAndUpdate(
            { _id: req.user.id, "wallet.mainBalance": { $gte: cost } },
            { 
                $inc: { 
                    "wallet.mainBalance": -cost, 
                    "wallet.totalSpent": cost,
                    [`wallet.spinCredits.${tierKey}`]: numAmount
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(400).json({ error: `Insufficient TRX balance for ${numAmount} ${tierConfig.label} spins.` });
        }

        await Transaction.create({
            userId: req.user.id,
            type: 'purchase',
            amount: cost,
            currency: 'TRX',
            description: `Purchased ${numAmount} ${tierConfig.label} spin credits`,
            status: 'completed'
        });

        res.json({ 
            success: true, 
            message: `Successfully purchased ${numAmount} ${tierConfig.label} spins!`, 
            wallet: updatedUser.wallet 
        });
    } catch (err) {
        console.error('Buy Spins Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
