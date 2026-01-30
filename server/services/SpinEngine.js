const crypto = require('crypto');

class SpinEngine {
  // Enhanced Provably Fair: Multi-Algorithm Verification
  // Generates a hash based on serverSeed, clientSeed and nonce
  generateHash(serverSeed, clientSeed, nonce) {
    return crypto.createHmac('sha256', serverSeed)
                 .update(`${clientSeed}:${nonce}`)
                 .digest('hex');
  }

  // Multi-verification for transparency (BC.Game style)
  verifyResult(serverSeed, clientSeed, nonce) {
    const sha256 = crypto.createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex');
    const sha512 = crypto.createHmac('sha512', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex');
    const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
    
    return {
      sha256,
      sha512,
      serverSeedHash
    };
  }

  // Calculate winning prize based on weighted probability
  calculateWinningPrize(prizes, hash) {
    if (!prizes || !Array.isArray(prizes) || prizes.length === 0) return null;

    // Filter out any null/undefined entries just in case
    const validPrizes = prizes.filter(p => p && typeof p === 'object');
    if (validPrizes.length === 0) return null;

    // Use first 8 chars (32 bits) of hash for precision
    const decimal = parseInt(hash.substring(0, 8), 16) / 0xffffffff;
    
    let cumulative = 0;
    const totalProb = validPrizes.reduce((acc, p) => acc + (p.probability || p.weight || 0), 0);
    
    if (totalProb <= 0) return validPrizes[0];

    const target = decimal * totalProb;

    for (const prize of validPrizes) {
        cumulative += (prize.probability || prize.weight || 0);
        if (target <= cumulative) {
            return prize;
        }
    }
    
    // Safety Fallback: Return the first non-jackpot prize or just the first prize
    return validPrizes.find(p => p.type !== 'jackpot') || validPrizes[0];
  }

  sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  generateSeed(length = 64) {
    return crypto.randomBytes(length / 2).toString('hex');
  }
}

module.exports = new SpinEngine();