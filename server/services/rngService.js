const crypto = require('crypto');

class RNGService {
  constructor() {
    // In a real prod env, this would be rotated or stored in a vault
    this.serverSeed = crypto.randomBytes(32).toString('hex');
  }

  // Provably fair random number generation
  // This allows users to verify that the result wasn't tampered with
  generateProvablyFairResult(clientSeed, nonce) {
    const hmac = crypto.createHmac('sha256', this.serverSeed);
    hmac.update(`${clientSeed}:${nonce}`);
    const hash = hmac.digest('hex');
    
    // Use first 8 chars for a decimal number between 0 and 1
    const decimal = parseInt(hash.substring(0, 8), 16) / Math.pow(2, 32);
    
    return {
      decimal,
      hash,
      serverSeedHash: crypto.createHash('sha256').update(this.serverSeed).digest('hex')
    };
  }

  // Select prize based on weighted probabilities
  selectPrize(prizes, decimal) {
    const totalWeight = prizes.reduce((acc, p) => acc + p.weight, 0);
    let cumulative = 0;
    const threshold = decimal * totalWeight;

    for (const prize of prizes) {
      cumulative += prize.weight;
      if (threshold <= cumulative) return prize;
    }
    return prizes[0];
  }
}

module.exports = new RNGService();
