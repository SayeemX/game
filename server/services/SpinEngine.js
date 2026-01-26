const crypto = require('crypto');

class SpinEngine {
  constructor() {
    this.serverSeed = this.generateSeed();
    this.clientSeed = null;
    this.nonce = 0;
  }

  generateSeed() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Provably Fair System
  generateHash(serverSeed, clientSeed, nonce) {
    const hmac = crypto.createHmac('sha256', serverSeed);
    hmac.update(`${clientSeed}:${nonce}`);
    return hmac.digest('hex');
  }

  // Calculate winning segment
  calculateWinningSegment(prizes, hash) {
    // Use first 5 bytes of hash for random number
    const randomValue = parseInt(hash.substring(0, 10), 16);
    const randomNumber = randomValue % 10000;
    
    let cumulative = 0;
    for (const prize of prizes) {
      cumulative += (prize.probability || 0) * 100; // Convert to basis points
      if (randomNumber < cumulative) {
        return prize;
      }
    }
    return prizes[0]; // Fallback
  }

  // Get server seed hash (for verification)
  getServerSeedHash() {
    return crypto.createHash('sha256').update(this.serverSeed).digest('hex');
  }

  // Verify fairness
  verifyFairness(clientSeed, nonce, resultHash) {
    const calculatedHash = this.generateHash(this.serverSeed, clientSeed, nonce);
    return calculatedHash === resultHash;
  }

  // Generate visual spin results
  generateVisualResult(winningPrize, totalSegments = 8) {
    const segmentAngle = 360 / totalSegments;
    const extraRotations = 5; // 5 full rotations before stopping
    const winningSegment = 0; // This should ideally map to the prize index, but for now we'll rely on the frontend to calculate based on prize ID
    
    return {
      degrees: extraRotations * 360, 
      duration: 4000, // 4 seconds
      easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)'
    };
  }
}

module.exports = new SpinEngine();
