const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const BirdWeapon = require('../models/BirdWeapon');
const Transaction = require('../models/Transaction');
const Game = require('../models/Game');
const spinEngine = require('../services/SpinEngine');

const WHEEL_TIERS = {
  BRONZE: { cost: 1, segments: 24, label: 'Bronze' },
  SILVER: { cost: 10, segments: 32, label: 'Silver' },
  GOLD: { cost: 100, segments: 48, label: 'Gold' },
  DIAMOND: { cost: 1000, segments: 64, label: 'Diamond' }
};

// Default prize templates for initial setup
const getPrizesForTier = (tier) => {
    const basePrizes = [
        { id: '1', name: "0.1 TRX", value: 0.1, type: "balance", probability: 25, color: "#4CAF50" },
        { id: '2', name: "1 TRX", value: 1, type: "balance", probability: 15, color: "#8BC34A" },
        { id: '3', name: "Loss", value: 0, type: "crash", probability: 25, color: "#9E9E9E" },
        { id: '4', name: "5 TRX", value: 5, type: "balance", probability: 10, color: "#FF9800" },
        { id: '5', name: "MINI", value: 0, type: "jackpot", jackpotType: 'MINI', probability: 5, color: "#FFEB3B" },
        { id: '6', name: "Free Spin", value: 1, type: "spins", probability: 10, color: "#2196F3" },
        { id: '7', name: "50x Arrows", value: 50, type: "item", itemKey: "arrow", probability: 10, color: "#9C27B0" }
    ];
    
    // Scale values based on tier cost
    const multiplier = WHEEL_TIERS[tier].cost;
    return basePrizes.map(p => ({
        ...p,
        value: p.type === 'balance' ? p.value * multiplier : p.value,
        id: `${tier}_${p.id}`
    }));
};

// Initialize all wheels and user seeds
router.post('/initialize', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    let needsSave = false;
    if (!user.provablyFair) user.provablyFair = {};
    if (!user.provablyFair.serverSeed) {
        user.provablyFair.serverSeed = spinEngine.generateSeed(64);
        user.provablyFair.nonce = 0;
        needsSave = true;
    }
    if (!user.provablyFair.clientSeed) {
        user.provablyFair.clientSeed = spinEngine.generateSeed(10);
        needsSave = true;
    }
    if (needsSave) await user.save();

    let gameConfig = await Game.findOne();
    const hasTiers = gameConfig?.spinGame?.tiers && 
                     Object.keys(WHEEL_TIERS).every(t => gameConfig.spinGame.tiers[t] && gameConfig.spinGame.tiers[t].prizes?.length > 0);

    if (!gameConfig || !gameConfig.spinGame || !hasTiers) {
        const tiers = {};
        Object.keys(WHEEL_TIERS).forEach(tier => {
            tiers[tier] = {
                ...WHEEL_TIERS[tier],
                prizes: getPrizesForTier(tier)
            };
        });
        
        const jackpots = {
            MINI: { current: 100, base: 100 },
            MINOR: { current: 1000, base: 1000 },
            MAJOR: { current: 10000, base: 10000 },
            GRAND: { current: 100000, base: 100000 },
            MEGA: { current: 1000000, base: 1000000 }
        };

        gameConfig = await Game.findOneAndUpdate({}, { $set: { "spinGame.tiers": tiers, "spinGame.jackpots": jackpots } }, { upsert: true, new: true });
    }

    res.json({
      success: true,
      clientSeed: user.provablyFair.clientSeed,
      nonce: user.provablyFair.nonce,
      serverSeedHash: spinEngine.sha256(user.provablyFair.serverSeed),
      tiers: gameConfig.spinGame.tiers,
      jackpots: gameConfig.spinGame.jackpots,
      wallet: user.wallet,
      inventory: user.inventory
    });

  } catch (error) {
    console.error('Spin init error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Play a specific wheel tier
router.post('/play', auth, async (req, res) => {
  try {
    const { tier = 'BRONZE', clientSeed } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const wheelConfig = WHEEL_TIERS[tier];
    if (!wheelConfig) return res.status(400).json({ error: 'Invalid wheel tier' });

    // Cost logic: Must have specific tier's spinCredits
    const availableCredits = user.wallet.spinCredits[tier] || 0;
    
    if (availableCredits < 1) {
      return res.status(400).json({ error: `Insufficient ${tier} credits. Please refill.` });
    }

    // Ensure provablyFair is initialized
    if (!user.provablyFair || !user.provablyFair.serverSeed) {
        user.provablyFair = {
            serverSeed: spinEngine.generateSeed(64),
            clientSeed: spinEngine.generateSeed(10),
            nonce: 0
        };
        await user.save();
    }

    // Update Seed if provided
    if (clientSeed && clientSeed !== user.provablyFair.clientSeed) {
        user.provablyFair.clientSeed = clientSeed;
        user.provablyFair.nonce = 0;
    }

    let gameConfig = await Game.findOne();
    if (!gameConfig || !gameConfig.spinGame.jackpots) {
        // Force re-init if config is broken
        return res.status(500).json({ error: 'Game configuration not initialized. Please refresh.' });
    }

    const tierData = gameConfig.spinGame.tiers[tier];
    if (!tierData || !tierData.prizes || tierData.prizes.length === 0) {
        return res.status(500).json({ error: 'Tier configuration missing or empty. Please contact support.' });
    }
    const prizes = tierData.prizes;

    // Spin Calculation
    const serverSeed = user.provablyFair.serverSeed;
    const currentClientSeed = user.provablyFair.clientSeed;
    const nonce = user.provablyFair.nonce;
    
    const rawHash = spinEngine.generateHash(serverSeed, currentClientSeed, nonce);
    let winningPrize = spinEngine.calculateWinningPrize(prizes, rawHash);

    if (!winningPrize) {
        return res.status(500).json({ error: 'No prize found for this spin. Please contact support.' });
    }

    const cost = wheelConfig.cost;
    // Jackpot Contributions (1% of bet)
    const contribution = cost * 0.01;
    ['MINI', 'MINOR', 'MAJOR', 'GRAND', 'MEGA'].forEach(l => {
        gameConfig.spinGame.jackpots[l].current += contribution / 5;
    });

    // Handle Jackpot Win
    if (winningPrize.type === 'jackpot') {
        const jType = winningPrize.jackpotType || 'MINI';
        winningPrize.value = gameConfig.spinGame.jackpots[jType].current;
        winningPrize.name = `${jType} JACKPOT ${winningPrize.value.toFixed(2)} TRX`;
        gameConfig.spinGame.jackpots[jType].current = gameConfig.spinGame.jackpots[jType].base;
    }
    await gameConfig.save();

    // Deduct credit
    user.wallet.spinCredits[tier] -= 1;
    user.markModified('wallet.spinCredits');
    
    user.provablyFair.nonce += 1;

    // Reward Logic
    if (winningPrize.value > 0 || winningPrize.type === 'weapon' || winningPrize.type === 'item' || winningPrize.type === 'spins') {
        switch(winningPrize.type) {
            case 'jackpot':
            case 'balance':
                user.wallet.mainBalance += winningPrize.value;
                break;
            case 'spins':
                // Prize spins are currently awarded to the playing tier
                user.wallet.spinCredits[tier] += winningPrize.value;
                user.markModified('wallet.spinCredits');
                break;
            case 'weapon':
                const weapon = await BirdWeapon.findOne({ key: winningPrize.itemKey });
                if (weapon && !user.inventory.weapons.some(w => w.weaponId.toString() === weapon._id.toString())) {
                    user.inventory.weapons.push({ weaponId: weapon._id });
                }
                break;
            case 'item':
                const idx = user.inventory.items.findIndex(i => i.itemKey === winningPrize.itemKey);
                if (idx > -1) user.inventory.items[idx].amount += winningPrize.value;
                else user.inventory.items.push({ itemKey: winningPrize.itemKey, amount: winningPrize.value });
                break;
        }
        if (winningPrize.type === 'balance' || winningPrize.type === 'jackpot') {
            user.wallet.totalWon += winningPrize.value;
        }
    }

    await user.save();

    await Transaction.create({
      userId: user._id,
      type: 'spin_game',
      amount: (winningPrize.type === 'balance' || winningPrize.type === 'jackpot') ? winningPrize.value : 0,
      description: `Spin Tier: ${tier} - Result: ${winningPrize.name}`,
      metadata: { tier, prizeId: winningPrize.id, nonce, hash: rawHash }
    });

    res.json({
      success: true,
      prize: winningPrize,
      result: { hash: rawHash, nonce, clientSeed: currentClientSeed },
      wallet: user.wallet,
      inventory: user.inventory,
      jackpots: gameConfig.spinGame.jackpots
    });

  } catch (error) {
    console.error('Spin play error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Seed Rotation
router.post('/rotate-seed', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const oldSeed = user.provablyFair.serverSeed;
        user.provablyFair.serverSeed = spinEngine.generateSeed(64);
        user.provablyFair.nonce = 0;
        await user.save();
        res.json({ success: true, previousServerSeed: oldSeed, newServerSeedHash: spinEngine.sha256(user.provablyFair.serverSeed) });
    } catch (error) {
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Update Client Seed
router.post('/update-client-seed', auth, async (req, res) => {
    try {
        const { clientSeed } = req.body;
        if (!clientSeed) return res.status(400).json({ error: 'Client seed is required' });
        
        const user = await User.findById(req.user.id);
        user.provablyFair.clientSeed = clientSeed;
        user.provablyFair.nonce = 0;
        await user.save();
        
        res.json({ success: true, clientSeed: user.provablyFair.clientSeed });
    } catch (error) {
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Verify Result
router.post('/verify', async (req, res) => {
    try {
        const { serverSeed, clientSeed, nonce, tier = 'BRONZE' } = req.body;
        if (!serverSeed || !clientSeed || nonce === undefined) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        const gameConfig = await Game.findOne();
        const tierData = gameConfig.spinGame.tiers[tier];
        if (!tierData) return res.status(400).json({ error: 'Invalid tier' });

        const hash = spinEngine.generateHash(serverSeed, clientSeed, nonce);
        const decimal = parseInt(hash.substring(0, 8), 16) / 0xffffffff;
        const prize = spinEngine.calculateWinningPrize(tierData.prizes, hash);

        res.json({ success: true, hash, decimal, prize });
    } catch (error) {
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

module.exports = router;
