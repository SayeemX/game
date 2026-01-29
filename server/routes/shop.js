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
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/shop/buy
// @desc    Purchase an item (Weapon or Consumable)
router.post('/buy', auth, async (req, res) => {
    const { itemId, itemKey, type = 'weapon' } = req.body;
    try {
        const user = await User.findById(req.user.id);
        
        if (type === 'weapon') {
            const item = await BirdWeapon.findById(itemId);
            if (!item) return res.status(404).json({ error: 'Weapon not found' });

            // Check if already owned
            const isOwned = user.inventory.weapons.some(w => w.weaponId.toString() === itemId);
            if (isOwned) return res.status(400).json({ error: 'You already own this weapon' });

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
                type: 'purchase',
                amount: item.price,
                currency: 'TRX',
                description: `Purchased weapon: ${item.name}`,
                status: 'completed'
            });

            await user.save();
            return res.json({ success: true, message: 'Weapon purchased!', wallet: user.wallet, inventory: user.inventory });
        } else if (type === 'ammo') {
            const gameConfig = await Game.findOne();
            const ammoItem = gameConfig?.shop?.consumables?.find(i => i.itemKey === itemKey && i.active);
            
            if (!ammoItem) {
                // Fallback for safety if not configured in DB yet
                const AMMO_CONFIG = {
                    'arrow': { name: 'Arrows (50x)', amount: 50, price: 5 },
                    'pellet': { name: 'Pellets (100x)', amount: 100, price: 5 }
                };
                const config = AMMO_CONFIG[itemKey];
                if (!config) return res.status(400).json({ error: 'Invalid ammo type' });
                
                if (user.wallet.mainBalance < config.price) {
                    return res.status(400).json({ error: 'Insufficient TRX balance' });
                }

                user.wallet.mainBalance -= config.price;
                user.wallet.totalSpent += config.price;

                const itemIndex = user.inventory.items.findIndex(i => i.itemKey === itemKey);
                if (itemIndex > -1) {
                    user.inventory.items[itemIndex].amount += config.amount;
                } else {
                    user.inventory.items.push({ itemKey, amount: config.amount });
                }

                await Transaction.create({
                    userId: user._id,
                    type: 'purchase',
                    amount: config.price,
                    currency: 'TRX',
                    description: `Purchased ${config.name}`,
                    status: 'completed'
                });
            } else {
                if (user.wallet.mainBalance < ammoItem.price) {
                    return res.status(400).json({ error: 'Insufficient TRX balance' });
                }

                user.wallet.mainBalance -= ammoItem.price;
                user.wallet.totalSpent += ammoItem.price;

                const itemIndex = user.inventory.items.findIndex(i => i.itemKey === itemKey);
                if (itemIndex > -1) {
                    user.inventory.items[itemIndex].amount += ammoItem.amount;
                } else {
                    user.inventory.items.push({ itemKey, amount: ammoItem.amount });
                }

                await Transaction.create({
                    userId: user._id,
                    type: 'purchase',
                    amount: ammoItem.price,
                    currency: 'TRX',
                    description: `Purchased ${ammoItem.name}`,
                    status: 'completed'
                });
            }

            await user.save();
            return res.json({ success: true, message: 'Ammo purchased!', wallet: user.wallet, inventory: user.inventory });
        }

        res.status(400).json({ error: 'Invalid purchase type' });
    } catch (err) {
        console.error('Purchase Error:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
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

// @route   POST api/shop/buy-spins
// @desc    Purchase spin credits
router.post('/buy-spins', auth, async (req, res) => {
    const { amount } = req.body; // Amount of spins to buy
    const SPIN_PRICE = 1; // 1 TRX per spin (example price)
    
    try {
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const cost = amount * SPIN_PRICE;
        const user = await User.findById(req.user.id);

        if (user.wallet.mainBalance < cost) {
            return res.status(400).json({ error: 'Insufficient TRX balance' });
        }

        user.wallet.mainBalance -= cost;
        user.wallet.spinCredits += amount;
        user.wallet.totalSpent += cost;

        await Transaction.create({
            userId: user._id,
            type: 'purchase',
            amount: cost,
            currency: 'TRX',
            description: `Purchased ${amount} spin credits`,
            status: 'completed'
        });

        await user.save();
        res.json({ 
            success: true, 
            message: `Successfully purchased ${amount} spins!`, 
            wallet: user.wallet 
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
