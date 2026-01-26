class BirdShootingEngine {
  constructor() {
    this.games = new Map();
  }

  createGame(userId, level = 1) {
    const gameId = `bird_${Date.now()}_${userId}`;
    const gameConfig = this.getLevelConfig(level);
    
    const game = {
      id: gameId,
      userId,
      level,
      score: 0,
      birdsHit: 0,
      birdsTotal: gameConfig.birds,
      timeRemaining: gameConfig.timeLimit,
      status: 'active',
      startTime: Date.now(),
      birds: this.generateBirds(gameConfig.birds, level),
      shots: []
    };
    
    this.games.set(gameId, game);
    return game;
  }

  getLevelConfig(level) {
    const configs = {
      1: { birds: 10, timeLimit: 60000, rewardMultiplier: 1, difficulty: 'easy' },
      2: { birds: 15, timeLimit: 45000, rewardMultiplier: 1.5, difficulty: 'medium' },
      3: { birds: 20, timeLimit: 30000, rewardMultiplier: 2, difficulty: 'hard' },
      4: { birds: 25, timeLimit: 25000, rewardMultiplier: 3, difficulty: 'expert' },
      5: { birds: 30, timeLimit: 20000, rewardMultiplier: 5, difficulty: 'legendary' }
    };
    return configs[level] || configs[1];
  }

  generateBirds(count, level) {
    const birds = [];
    for (let i = 0; i < count; i++) {
      birds.push({
        id: i,
        x: Math.random() * 80 + 10, // 10-90%
        y: Math.random() * 60 + 20, // 20-80%
        size: 30 + Math.random() * 20,
        speed: 0.5 + (level * 0.2) + Math.random() * 0.5,
        direction: Math.random() * 360,
        points: 10 + Math.floor(Math.random() * level * 5),
        isHit: false
      });
    }
    return birds;
  }

  processShot(gameId, shotData) {
    const game = this.games.get(gameId);
    if (!game || game.status !== 'active') return null;

    const { x, y, timestamp } = shotData;
    const hit = this.checkHit(game.birds, x, y);
    
    if (hit) {
      game.birdsHit++;
      game.score += hit.points;
      hit.isHit = true;
      
      // Check if game is complete
      if (game.birdsHit >= game.birdsTotal) {
        game.status = 'completed';
        game.endTime = Date.now();
        game.timeTaken = game.endTime - game.startTime;
        game.finalScore = this.calculateFinalScore(game);
      }
    }

    game.shots.push({
      x, y, timestamp, hit: !!hit, points: hit ? hit.points : 0
    });

    return {
      hit: !!hit,
      points: hit ? hit.points : 0,
      totalScore: game.score,
      birdsRemaining: game.birdsTotal - game.birdsHit,
      gameComplete: game.status === 'completed'
    };
  }

  checkHit(birds, x, y) {
    for (const bird of birds) {
      if (bird.isHit) continue;
      
      const distance = Math.sqrt(
        Math.pow(x - bird.x, 2) + Math.pow(y - bird.y, 2)
      );
      
      if (distance <= (bird.size / 2)) {
        return bird;
      }
    }
    return null;
  }

  calculateFinalScore(game) {
    const timeBonus = Math.max(0, game.timeRemaining - (Date.now() - game.startTime));
    const accuracy = (game.birdsHit / (game.birdsTotal || 1)) * 100;
    const timeMultiplier = 1 + (timeBonus / (game.timeRemaining || 1));
    const accuracyMultiplier = accuracy / 100;
    
    return Math.floor(game.score * timeMultiplier * accuracyMultiplier);
  }

  getGame(gameId) {
    return this.games.get(gameId);
  }

  endGame(gameId) {
    const game = this.games.get(gameId);
    if (game && game.status === 'active') {
      game.status = 'completed';
      game.endTime = Date.now();
      game.finalScore = game.score;
    }
    return game;
  }
}

module.exports = new BirdShootingEngine();
