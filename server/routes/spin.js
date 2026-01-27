const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Game = require('../models/Game');

// Helper: Generate random seed
const generateSeed = (length = 64) => {
    return crypto.randomBytes(length / 2).toString('hex');
};

// Helper: Generate SHA256 hash
const sha256 = (data) => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

// Helper: HMAC-SHA256
const hmacSha256 = (key, data) => {
    return crypto.createHmac('sha256', key).update(data).digest('hex');
};

// Helper: Calculate winning prize based on hash
const calculateWinningPrize = (prizes, hash) => {
    // Use first 8 chars (32 bits) of hash for precision
    const decimal = parseInt(hash.substring(0, 8), 16) / 0xffffffff;
    
    let cumulative = 0;
    for (const prize of prizes) {
        cumulative += prize.probability; // probability is 0-100
        if (decimal * 100 <= cumulative) {
            return prize;
        }
    }
    return prizes[0]; // Fallback
};

// Blueprint Prize Structure
const DEFAULT_PRIZES = [
  { id: '1', name: "10 Bonus", value: 10, type: "bonus", probability: 15, color: "#FF6B6B", tier: "common" },
  { id: '2', name: "5 Bonus", value: 5, type: "bonus", probability: 10, color: "#4ECDC4", tier: "common" },
  { id: '3', name: "3 Spins", value: 3, type: "spins", probability: 20, color: "#FFD166", tier: "common" },
  { id: '4', name: "2 Balance", value: 2, type: "balance", probability: 18.5, color: "#06D6A0", tier: "common" },
  { id: '5', name: "25 Balance", value: 25, type: "balance", probability: 8, color: "#118AB2", tier: "rare" },
  { id: '6', name: "50 Bonus", value: 50, type: "bonus", probability: 7, color: "#EF476F", tier: "rare" },
  { id: '7', name: "100 Balance", value: 100, type: "balance", probability: 5, color: "#9D4EDD", tier: "rare" },
  { id: '8', name: "10 Spins", value: 10, type: "spins", probability: 10, color: "#FF9A76", tier: "rare" },
  { id: '9', name: "500 Balance", value: 500, type: "balance", probability: 3, color: "#FFD700", tier: "legendary" },
  { id: '10', name: "10 Crypto", value: 10, type: "crypto", probability: 2, color: "#00D4AA", tier: "legendary" },
  { id: '11', name: "1000 Balance", value: 1000, type: "balance", probability: 1, color: "#FF4081", tier: "legendary" },
  { id: '12', name: "JACKPOT", value: 5000, type: "jackpot", probability: 0.5, color: "#9C27B0", tier: "legendary" },
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
        user.provablyFair.serverSeed = generateSeed(64);
        user.provablyFair.nonce = 0;
        needsSave = true;
    }
    if (!user.provablyFair.clientSeed) {
        user.provablyFair.clientSeed = generateSeed(10);
        needsSave = true;
    }
    
    if (needsSave) await user.save();

    // Get or Create Game Config
    let gameConfig = await Game.findOne();
    if (!gameConfig) {
        gameConfig = await Game.create({
            spinGame: {
                prizes: DEFAULT_PRIZES,
                minBet: 1,
                maxBet: 100
            }
        });
    } else if (!gameConfig.spinGame || gameConfig.spinGame.prizes.length < 12) {
        // Update if existing config is outdated
        gameConfig.spinGame = { ...gameConfig.spinGame, prizes: DEFAULT_PRIZES };
        await gameConfig.save();
    }

    res.json({
      success: true,
      clientSeed: user.provablyFair.clientSeed,
      nonce: user.provablyFair.nonce,
      serverSeedHash: sha256(user.provablyFair.serverSeed),
      prizes: gameConfig.spinGame.prizes
    });

  } catch (error) {
    console.error('Spin init error:', error);
    res.status(500).json({ error: 'Server error' });
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

    // Ensure Server Seed Exists
    if (!user.provablyFair || !user.provablyFair.serverSeed) {
        user.provablyFair = {
            serverSeed: generateSeed(64),
            clientSeed: clientSeed || generateSeed(10),
            nonce: 0
        };
    }

    // Get Game Config
    const gameConfig = await Game.findOne();
    const prizes = gameConfig ? gameConfig.spinGame.prizes : DEFAULT_PRIZES;

    // Calculate Result (Provably Fair)
    const serverSeed = user.provablyFair.serverSeed;
    const currentClientSeed = user.provablyFair.clientSeed;
    const nonce = user.provablyFair.nonce;
    
    // HMAC-SHA256(serverSeed, clientSeed:nonce)
    const rawHash = hmacSha256(serverSeed, `${currentClientSeed}:${nonce}`);
    const winningPrize = calculateWinningPrize(prizes, rawHash);

    // Update User State
    user.wallet.spinCredits -= bet;
    user.stats.totalSpins += 1;
    user.provablyFair.nonce += 1; // Increment nonce for next game

    // Award Prize
    if (winningPrize.value > 0) {
      switch(winningPrize.type) {
        case 'balance':
        case 'jackpot':
          user.wallet.mainBalance += winningPrize.value;
          break;
        case 'bonus':
          user.wallet.bonusBalance += winningPrize.value;
          break;
        case 'spins':
          user.wallet.spinCredits += winningPrize.value;
          break;
        case 'crypto':
           // Assuming we might have a crypto wallet field later, for now add to main or track separately
           // For prototype, adding to mainBalance * exchange rate? Or just logging.
           // Blueprint says "Wallets: bdt, usd, trx..." - schema has "wallets" object but simple version has "mainBalance".
           // Let's add to mainBalance for now to avoid crashes, assuming 1 Crypto unit = 100 Main Balance units for simplicity or just add as is?
           // "10 Crypto" -> let's assume it adds to a distinct balance if available, else ignored or added to main.
           // Schema has `wallet` with `mainBalance`.
           // Let's just treat it as mainBalance for this iteration or add to `totalWon`.
           user.wallet.mainBalance += winningPrize.value * 10; // Dummy conversion
           break;
      }
      user.wallet.totalWon += winningPrize.value;
      user.stats.totalWins += 1;
      if (winningPrize.value > user.stats.biggestWin) {
        user.stats.biggestWin = winningPrize.value;
      }
    }

    await user.save();

    // Record Transaction
    await Transaction.create({
      userId: user._id,
      type: winningPrize.value > 0 ? 'spin_win' : 'spin_bet',
      amount: winningPrize.value > 0 ? winningPrize.value : -bet,
      description: `Spin game: ${winningPrize.name}`,
      metadata: {
        game: 'spin',
        prize: winningPrize.name,
        tier: winningPrize.tier,
        clientSeed: currentClientSeed,
        nonce: nonce, // The nonce used for THIS game
        hash: rawHash
      }
    });

    res.json({
      success: true,
      prize: winningPrize,
      result: {
          hash: rawHash,
          nonce: nonce,
          clientSeed: currentClientSeed
      },
      wallet: {
        balance: user.wallet.mainBalance,
        bonus: user.wallet.bonusBalance,
        spins: user.wallet.spinCredits
      }
    });

  } catch (error) {
    console.error('Spin play error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Rotate Seed (Verify previous games)
router.post('/rotate-seed', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const oldServerSeed = user.provablyFair.serverSeed;
        const newServerSeed = generateSeed(64);
        
        user.provablyFair.serverSeed = newServerSeed;
        user.provablyFair.nonce = 0;
        await user.save();

        res.json({
            success: true,
            previousServerSeed: oldServerSeed,
            newServerSeedHash: sha256(newServerSeed)
        });

    } catch (error) {
        console.error('Rotate seed error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
