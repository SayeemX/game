const crypto = require('crypto');

class BirdShootingEngine {
  constructor() {
    this.activeGames = new Map();
    this.birdTypes = {
      sparrow: { speed: 1.5, size: 20, points: 10, rarity: 1, health: 1 },
      pigeon: { speed: 1.2, size: 25, points: 15, rarity: 2, health: 1 },
      crow: { speed: 2.0, size: 30, points: 25, rarity: 3, health: 1 },
      eagle: { speed: 3.0, size: 40, points: 50, rarity: 4, health: 1 },
      phoenix: { speed: 4.0, size: 50, points: 150, rarity: 5, health: 1 }
    };

    this.PHYSICS = {
      GRAVITY: 0.15,
      AIR_RESISTANCE: 0.02,
      WIND_MAX: 0.8,
      FLAP_FORCE: 0.2
    };
  }

  // Initialize match with deterministic state generation
  createGame(userId, level, weaponStats) {
    const gameId = `match_${crypto.randomBytes(8).toString('hex')}`;
    const seed = crypto.randomBytes(32).toString('hex');
    
    // Deterministic wind derived from seed
    const windHash = crypto.createHmac('sha256', seed).update('wind').digest('hex');
    let rawWind = (parseInt(windHash.substring(0, 8), 16) % 1000 / 1000) * this.PHYSICS.WIND_MAX * 2 - this.PHYSICS.WIND_MAX;
    
    // Apply Weapon Wind Resistance Perk
    const windResistance = weaponStats.perks?.windResistance || 0;
    const windX = rawWind * (1 - windResistance); // Higher resistance = lower wind effect

    const game = {
      id: gameId,
      userId,
      level,
      weapon: weaponStats,
      seed,
      wind: { x: windX },
      score: 0,
      combo: 0,
      maxCombo: 0,
      shots: 0,
      hits: 0,
      ammo: 0, 
      ammoType: '', // Store ammo type
      birds: this.generateBirds(level, seed),
      status: 'active',
      startTime: Date.now(),
      verificationHash: ''
    };

    // Calculate initial hash for Provably Fair auditing
    game.verificationHash = this.calculateMatchHash(game);
    
    this.activeGames.set(gameId, game);
    return game;
  }

  generateBirds(level, seed) {
    const birds = [];
    const count = 10 + (level * 3);
    const hash = crypto.createHmac('sha256', seed).update('birds').digest('hex');

    for (let i = 0; i < count; i++) {
      const segment = hash.substring((i % 8) * 4, (i % 8) * 4 + 4);
      const val = parseInt(segment, 16);
      
      // Determine type based on rarity roll (0-100)
      const roll = val % 100;
      let type = 'sparrow';
      if (roll < 5) type = 'phoenix';
      else if (roll < 15) type = 'eagle';
      else if (roll < 35) type = 'crow';
      else if (roll < 65) type = 'pigeon';

      const config = this.birdTypes[type];
      
      birds.push({
        id: i,
        type: type,
        x: (val % 80) + 10,
        y: (val % 40) + 10,
        speed: config.speed * (1 + (level * 0.1)),
        health: config.health,
        points: config.points,
        alive: true,
        isLeader: i % 5 === 0 // Every 5th bird is a flock leader
      });
    }
    return birds;
  }

  calculateMatchHash(game) {
    const data = `${game.seed}_${game.score}_${game.shots}_${game.hits}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  validateShot(gameId, shotData) {
    const game = this.activeGames.get(gameId);
    if (!game || game.status !== 'active') return { valid: false };

    game.shots++;
    const { x, y, angle, power, birdId } = shotData;

    let hitBird = null;

    // 1. Direct ID Match (Trusted Mode for Sync)
    if (birdId !== undefined && birdId !== null) {
        const bird = game.birds.find(b => b.id === birdId);
        // Only register if bird is alive and hasn't been killed yet
        if (bird && bird.alive) {
            hitBird = bird;
        }
    } 
    
    // 2. Fallback: Hitbox Validation (if no ID provided or ID mismatch)
    if (!hitBird) {
        for (const bird of game.birds) {
            if (!bird.alive) continue;
            
            const dx = bird.x - x;
            const dy = bird.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const hitRadius = (this.birdTypes[bird.type].size / 10);
            
            if (distance <= hitRadius) {
                hitBird = bird;
                break;
            }
        }
    }

    if (hitBird) {
      game.hits++;
      game.combo++;
      game.maxCombo = Math.max(game.maxCombo, game.combo);
      
      const damage = game.weapon.damage || 1;
      hitBird.health -= damage; // Apply weapon damage

      if (hitBird.health <= 0) {
        hitBird.alive = false;
        // Reward = Points * Level * Combo Bonus (0.1x per hit)
        const points = hitBird.points * (1 + (game.combo * 0.1));
        game.score += Math.round(points);
      }
      
      return { 
        valid: true, 
        hit: true, 
        birdId: hitBird.id, 
        score: game.score, 
        combo: game.combo,
        alive: hitBird.alive,
        damageDealt: damage
      };
    } else {
      game.combo = 0; // Reset combo on miss
      return { valid: true, hit: false, score: game.score, combo: 0 };
    }
  }

  endGame(gameId) {
    const game = this.activeGames.get(gameId);
    if (!game) return null;
    
    game.status = 'completed';
    game.endTime = Date.now();
    game.verificationHash = this.calculateMatchHash(game);
    return game;
  }
}

module.exports = new BirdShootingEngine();
