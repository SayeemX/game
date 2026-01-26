const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const BirdShootingEngine = require('../services/BirdShootingEngine');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Start bird shooting game
router.post('/bird/start', auth, async (req, res) => {
  try {
    const { level = 1 } = req.body;
    const user = await User.findById(req.user.id);

    // Check balance for entry fee
    const entryFee = 10; // $10 entry fee
    if (user.wallet.mainBalance < entryFee) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct entry fee
    user.wallet.mainBalance -= entryFee;
    user.wallet.totalSpent += entryFee;
    await user.save();

    // Record transaction
    await Transaction.create({
      userId: user._id,
      type: 'game_bet',
      amount: -entryFee,
      description: `Bird shooting game entry - Level ${level}`
    });

    // Create game
    const game = BirdShootingEngine.createGame(user._id, level);

    res.json({
      success: true,
      gameId: game.id,
      level: game.level,
      birdsTotal: game.birdsTotal,
      timeLimit: game.timeRemaining
    });

  } catch (error) {
    console.error('Game start error:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// Process shot
router.post('/bird/shoot', auth, async (req, res) => {
  try {
    const { gameId, x, y } = req.body;
    
    const result = BirdShootingEngine.processShot(gameId, { x, y, timestamp: Date.now() });
    
    if (!result) {
      return res.status(400).json({ error: 'Invalid game or shot' });
    }

    res.json({
      success: true,
      hit: result.hit,
      points: result.points,
      totalScore: result.totalScore,
      birdsRemaining: result.birdsRemaining,
      gameComplete: result.gameComplete
    });

  } catch (error) {
    console.error('Shot error:', error);
    res.status(500).json({ error: 'Shot failed' });
  }
});

// End game
router.post('/bird/end', auth, async (req, res) => {
  try {
    const { gameId } = req.body;
    const user = await User.findById(req.user.id);
    
    const game = BirdShootingEngine.endGame(gameId);
    
    if (!game) {
      return res.status(400).json({ error: 'Game not found' });
    }

    // Calculate reward
    const baseReward = Math.floor(game.finalScore / 10);
    const multiplier = game.level;
    const totalReward = baseReward * multiplier;

    // Award winnings
    if (totalReward > 0) {
      user.wallet.mainBalance += totalReward;
      user.wallet.totalWon += totalReward;
      await user.save();

      // Record win transaction
      await Transaction.create({
        userId: user._id,
        type: 'game_win',
        amount: totalReward,
        description: `Bird shooting win - Level ${game.level}`
      });
    }

    res.json({
      success: true,
      finalScore: game.finalScore,
      birdsHit: game.birdsHit,
      timeTaken: game.timeTaken,
      reward: totalReward,
      newBalance: user.wallet.mainBalance
    });

  } catch (error) {
    console.error('Game end error:', error);
    res.status(500).json({ error: 'Failed to end game' });
  }
});

module.exports = router;
