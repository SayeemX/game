const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Game = require('../models/Game');
const spinEngine = require('../services/SpinEngine');

// Blueprint Prize Structure (12 distinct segments)
const DEFAULT_PRIZES = [
  { id: '1', name: "0.1 TRX", value: 0.1, type: "balance", probability: 25, color: "#2d3436", tier: "common" },
  { id: '2', name: "10 Arrows", value: 10, type: "item", itemKey: "arrow", probability: 15, color: "#00b894", tier: "common" },
  { id: '3', name: "CRASH", value: 0, type: "crash", probability: 10, color: "#d63031", tier: "badluck" },
  { id: '4', name: "1 TRX", value: 1, type: "balance", probability: 10, color: "#0984e3", tier: "common" },
  { id: '5', name: "10 Pellets", value: 10, type: "item", itemKey: "pellet", probability: 10, color: "#6c5ce7", tier: "common" },
  { id: '6', name: "Free Spin", value: 1, type: "spins", probability: 8, color: "#fdcb6e", tier: "rare" },
  { id: '7', name: "CRASH", value: 0, type: "crash", probability: 7, color: "#d63031", tier: "badluck" },
  { id: '8', name: "10 TRX", value: 10, type: "balance", probability: 5, color: "#e84393", tier: "rare" },
  { id: '9', name: "Wooden Bow", value: 1, type: "weapon", itemKey: "wooden_bow", probability: 4, color: "#f1c40f", tier: "epic" },
  { id: '10', name: "100 TRX", value: 100, type: "balance", probability: 3, color: "#ff9f43", tier: "epic" },
  { id: '11', name: "Airgun", value: 1, type: "weapon", itemKey: "airgun", probability: 2, color: "#54a0ff", tier: "legendary" },
  { id: '12', name: "JACKPOT", value: 0, type: "jackpot", probability: 1, color: "#fffa65", tier: "legendary" },
];

// Initialize spin
router.post('/initialize', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Ensure provably fair seeds exist
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
    if (!gameConfig || !gameConfig.spinGame || !gameConfig.spinGame.prizes || gameConfig.spinGame.prizes.length === 0) {
        gameConfig = await Game.findOneAndUpdate(
            {}, 
            { 
                $set: { 
                    "spinGame.prizes": DEFAULT_PRIZES,
                    "spinGame.minBet": 1,
                    "spinGame.maxBet": 100,
                    "spinGame.progressiveJackpot": gameConfig?.spinGame?.progressiveJackpot || 1000
                } 
            }, 
            { upsert: true, new: true }
        );
    }

    res.json({
      success: true,
      clientSeed: user.provablyFair.clientSeed,
      nonce: user.provablyFair.nonce,
      serverSeedHash: spinEngine.sha256(user.provablyFair.serverSeed),
      prizes: gameConfig.spinGame.prizes,
      progressiveJackpot: gameConfig.spinGame.progressiveJackpot
    });

  } catch (error) {
    console.error('Spin init error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Play spin
router.post('/play', auth, async (req, res) => {
  try {
    const { bet = 1, clientSeed } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Validate bet
    if (user.wallet.spinCredits < bet) {
      return res.status(400).json({ error: 'Insufficient spins' });
    }

    // Update Client Seed if provided
    if (clientSeed && clientSeed !== user.provablyFair.clientSeed) {
        user.provablyFair.clientSeed = clientSeed;
        user.provablyFair.nonce = 0; // Reset nonce on seed change
    }

    // Get Game Config
    let gameConfig = await Game.findOne();
    if (!gameConfig) {
        gameConfig = await Game.create({
            spinGame: {
                prizes: DEFAULT_PRIZES,
                minBet: 1,
                maxBet: 100,
                progressiveJackpot: 1000
            }
        });
    }
    const prizes = gameConfig.spinGame.prizes;

    // Calculate Result (Provably Fair via SpinEngine)
    const serverSeed = user.provablyFair.serverSeed;
    const currentClientSeed = user.provablyFair.clientSeed;
    const nonce = user.provablyFair.nonce;
    
    const rawHash = spinEngine.generateHash(serverSeed, currentClientSeed, nonce);
    let winningPrize = spinEngine.calculateWinningPrize(prizes, rawHash);

    // Progressive Jackpot Increment (0.1 TRX per spin)
    gameConfig.spinGame.progressiveJackpot += 0.1;

    // Handle Jackpot Win
    if (winningPrize.type === 'jackpot') {
        winningPrize.value = gameConfig.spinGame.progressiveJackpot;
        winningPrize.name = `JACKPOT ${winningPrize.value.toFixed(2)} TRX`;
        gameConfig.spinGame.progressiveJackpot = 1000; // Reset
    }
    await gameConfig.save();

    // Update User State
    user.wallet.spinCredits -= bet;
    user.provablyFair.nonce += 1;

    // Award Prize logic
    if (winningPrize.value > 0 || winningPrize.type === 'weapon' || winningPrize.type === 'item') {
        switch(winningPrize.type) {
            case 'jackpot':
            case 'balance':
                user.wallet.mainBalance += winningPrize.value;
                break;
            case 'spins':
                user.wallet.spinCredits += winningPrize.value;
                break;
            case 'weapon':
                const weapon = await BirdWeapon.findOne({ key: winningPrize.itemKey });
                if (weapon) {
                    const alreadyOwned = user.inventory.weapons.some(w => w.weaponId.toString() === weapon._id.toString());
                    if (!alreadyOwned) {
                        user.inventory.weapons.push({ weaponId: weapon._id });
                    }
                }
                break;
            case 'item':
                const itemIndex = user.inventory.items.findIndex(i => i.itemKey === winningPrize.itemKey);
                if (itemIndex > -1) {
                    user.inventory.items[itemIndex].amount += winningPrize.value;
                } else {
                    user.inventory.items.push({ itemKey: winningPrize.itemKey, amount: winningPrize.value });
                }
                break;
        }
        user.wallet.totalWon += (winningPrize.type === 'balance' || winningPrize.type === 'jackpot') ? winningPrize.value : 0;
    }

    await user.save();

    // Record Transaction
    await Transaction.create({
      userId: user._id,
      type: 'spin_game',
      amount: (winningPrize.type === 'balance' || winningPrize.type === 'jackpot') ? winningPrize.value : 0,
      description: `Spin Result: ${winningPrize.name}`,
      metadata: { prizeId: winningPrize.id, nonce, hash: rawHash }
    });

    res.json({
      success: true,
      prize: winningPrize,
      result: { hash: rawHash, nonce, clientSeed: currentClientSeed },
      wallet: {
        balance: user.wallet.mainBalance,
        spins: user.wallet.spinCredits
      },
      progressiveJackpot: gameConfig.spinGame.progressiveJackpot
    });

  } catch (error) {
    console.error('Spin play error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Rotate Seed (Verify previous games)
router.post('/rotate-seed', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const oldServerSeed = user.provablyFair.serverSeed;
        const newServerSeed = spinEngine.generateSeed(64);
        
        user.provablyFair.serverSeed = newServerSeed;
        user.provablyFair.nonce = 0;
        await user.save();

        res.json({
            success: true,
            previousServerSeed: oldServerSeed,
            newServerSeedHash: spinEngine.sha256(newServerSeed)
        });

    } catch (error) {
        console.error('Rotate seed error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Update Client Seed
router.post('/update-client-seed', auth, async (req, res) => {
    const { clientSeed } = req.body;
    if (!clientSeed || clientSeed.length < 1) return res.status(400).json({ error: 'Invalid client seed' });

    try {
        const user = await User.findById(req.user.id);
        user.provablyFair.clientSeed = clientSeed;
        user.provablyFair.nonce = 0; // Reset nonce on seed change
        await user.save();

        res.json({ success: true, message: 'Client seed updated and nonce reset.', clientSeed: user.provablyFair.clientSeed });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Verify a result
router.post('/verify', async (req, res) => {
    const { serverSeed, clientSeed, nonce } = req.body;
    
    if (!serverSeed || !clientSeed || nonce === undefined) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const gameConfig = await Game.findOne();
        const prizes = gameConfig ? gameConfig.spinGame.prizes : DEFAULT_PRIZES;

        // Re-calculate HMAC-SHA256
        const hash = spinEngine.generateHash(serverSeed, clientSeed, nonce);
        const prize = spinEngine.calculateWinningPrize(prizes, hash);

        res.json({
            hash,
            prize,
            decimal: parseInt(hash.substring(0, 8), 16) / 0xffffffff
        });
    } catch (err) {
        res.status(500).json({ error: 'Verification failed' });
    }
});

module.exports = router;