const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const BirdShootingEngine = require('../services/BirdShootingEngine');
const User = require('../models/User');
const BirdWeapon = require('../models/BirdWeapon');
const Transaction = require('../models/Transaction');
const BirdMatch = require('../models/BirdMatch');

// Start Game
router.post('/bird/start', auth, async (req, res) => {
  try {
    const { level = 1 } = req.body;
    const user = await User.findById(req.user.id);

    // Fetch Entry Fee from Admin Config
    const gameConfig = await Game.findOne();
    const baseFee = gameConfig?.birdShooting?.entryFee || 10;
    const entryFee = baseFee * level;

    if (user.wallet.mainBalance < entryFee) {
      return res.status(400).json({ error: 'Insufficient TRX balance' });
    }

    // Atomic Transaction: Entry Fee
    user.wallet.mainBalance -= entryFee;
    user.wallet.totalSpent += entryFee;
    await user.save();

    await Transaction.create({
      userId: user._id,
      type: 'game_bet',
      amount: -entryFee,
      currency: 'TRX',
      description: `GameX Sniper Entry - Level ${level}`,
      status: 'completed'
    });

    const weaponKey = user.inventory.equippedWeapon || 'basic_bow';
    const weapon = await BirdWeapon.findOne({ key: weaponKey });
    
    // Fallback to basic stats if weapon not found (shouldn't happen if seeded correctly)
    const weaponStats = weapon ? weapon.toObject() : { 
        key: 'basic_bow', 
        damage: 1, 
        accuracy: 0.8, 
        perks: { windResistance: 0.1 } 
    };

    const game = BirdShootingEngine.createGame(user._id, level, weaponStats);

    // Create Match Record
    await BirdMatch.create({
      userId: user._id,
      matchId: game.id,
      level,
      entryFee,
      seed: game.seed,
      status: 'active'
    });

    res.json({
      success: true,
      gameId: game.id,
      wind: game.wind,
      birds: game.birds,
      weapon: weaponStats,
      ammo: 20
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to start hunting session' });
  }
});

// Process Shot
router.post('/bird/shoot', auth, async (req, res) => {
  try {
    const { gameId, x, y, angle, power } = req.body;
    const result = BirdShootingEngine.validateShot(gameId, { x, y, angle, power });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Shot processing failed' });
  }
});

// End Game & Reward
router.post('/bird/end', auth, async (req, res) => {
  try {
    const { gameId } = req.body;
    const game = BirdShootingEngine.endGame(gameId);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const user = await User.findById(req.user.id);
    
    // Reward Logic: 2 TRX per 10 points
    const reward = Math.floor(game.score / 5); 

    if (reward > 0) {
      user.wallet.mainBalance += reward;
      user.wallet.totalWon += reward;
      await user.save();

      await Transaction.create({
        userId: user._id,
        type: 'game_win',
        amount: reward,
        currency: 'TRX',
        description: `GameX Sniper Reward - Score: ${game.score}`,
        status: 'completed'
      });
    }

    await BirdMatch.findOneAndUpdate(
        { matchId: gameId },
        { 
            score: game.score, 
            reward, 
            status: 'completed', 
            endedAt: new Date(),
            stats: { shots: game.shots, hits: game.hits, accuracy: (game.hits/game.shots)*100 }
        }
    );

    res.json({
      success: true,
      score: game.score,
      reward,
      newBalance: user.wallet.mainBalance
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to finalize game' });
  }
});

module.exports = router;
