const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SpinEngine = require('../services/SpinEngine');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Game = require('../models/Game');

// Initialize spin
router.post('/initialize', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Check spins
    if (user.wallet.spinCredits < 1) {
      return res.status(400).json({ error: 'Insufficient spin credits' });
    }

    // Get game config
    let gameConfig = await Game.findOne();
    if (!gameConfig) {
        // Create default config if not exists
        gameConfig = await Game.create({
            spinGame: {
                prizes: [
                    { id: '1', name: "10 Bonus", value: 10, type: "bonus", probability: 25, color: "#FF6B6B", tier: "common" },
                    { id: '2', name: "5 Spins", value: 5, type: "spins", probability: 20, color: "#4ECDC4", tier: "common" },
                    { id: '3', name: "25 Balance", value: 25, type: "balance", probability: 15, color: "#FFD166", tier: "rare" },
                    { id: '4', name: "50 Balance", value: 50, type: "balance", probability: 10, color: "#06D6A0", tier: "rare" },
                    { id: '5', name: "100 Bonus", value: 100, type: "bonus", probability: 8, color: "#118AB2", tier: "rare" },
                    { id: '6', name: "TRX 10", value: 10, type: "crypto", probability: 5, color: "#EF476F", tier: "legendary" },
                    { id: '7', name: "iPhone 15", value: 1500, type: "asset", probability: 1, color: "#9D4EDD", tier: "legendary" },
                    { id: '8', name: "Try Again", value: 0, type: "none", probability: 16, color: "#6C757D", tier: "common" }
                ]
            }
        });
    }
    const prizes = gameConfig.spinGame.prizes;

    // Generate client seed
    const clientSeed = Math.random().toString(36).substring(2);
    const nonce = Date.now();

    // Create hash
    const hash = SpinEngine.generateHash(SpinEngine.serverSeed, clientSeed, nonce);

    res.json({
      success: true,
      clientSeed,
      nonce,
      serverSeedHash: SpinEngine.getServerSeedHash(),
      prizes: prizes.map(p => ({ 
        id: p.id, 
        name: p.name, 
        tier: p.tier,
        color: p.color 
      }))
    });

  } catch (error) {
    console.error('Spin init error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Play spin
router.post('/play', auth, async (req, res) => {
  try {
    const { bet = 1 } = req.body;
    const user = await User.findById(req.user.id);

    // Validate bet
    if (user.wallet.spinCredits < bet) {
      return res.status(400).json({ error: 'Insufficient spins' });
    }

    // Get game config
    let gameConfig = await Game.findOne();
    if (!gameConfig) {
        return res.status(404).json({ error: 'Game configuration not found' });
    }
    const prizes = gameConfig.spinGame.prizes;

    // Generate result
    const clientSeed = Math.random().toString(36).substring(2);
    const nonce = Date.now();
    const hash = SpinEngine.generateHash(SpinEngine.serverSeed, clientSeed, nonce);
    const winningPrize = SpinEngine.calculateWinningSegment(prizes, hash);
    const visualResult = SpinEngine.generateVisualResult(winningPrize);

    // Deduct spins
    user.wallet.spinCredits -= bet;
    user.stats.totalSpins += 1;

    // Award prize
    if (winningPrize.value > 0) {
      switch(winningPrize.type) {
        case 'balance':
          user.wallet.mainBalance += winningPrize.value;
          break;
        case 'bonus':
          user.wallet.bonusBalance += winningPrize.value;
          break;
        case 'spins':
          user.wallet.spinCredits += winningPrize.value;
          break;
      }
      user.wallet.totalWon += winningPrize.value;
      user.stats.totalWins += 1;
      if (winningPrize.value > user.stats.biggestWin) {
        user.stats.biggestWin = winningPrize.value;
      }
    }

    await user.save();

    // Record transaction
    await Transaction.create({
      userId: user._id,
      type: winningPrize.value > 0 ? 'spin_win' : 'spin_bet',
      amount: winningPrize.value > 0 ? winningPrize.value : -bet,
      description: `Spin game: ${winningPrize.name}`,
      metadata: {
        game: 'spin',
        prize: winningPrize.name,
        tier: winningPrize.tier,
        clientSeed,
        nonce,
        hash
      }
    });

    res.json({
      success: true,
      prize: winningPrize,
      visual: visualResult,
      verification: {
        clientSeed,
        nonce,
        hash,
        serverSeedHash: SpinEngine.getServerSeedHash()
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

module.exports = router;
