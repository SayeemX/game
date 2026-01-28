const crypto = require('crypto');

class SpinEngine {
  // HMAC-SHA256 for Provably Fair
  generateHash(serverSeed, clientSeed, nonce) {
    return crypto.createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex');
  }

  // Calculate winning prize based on hash and database configuration
  calculateWinningPrize(prizes, hash) {
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
  }

  // Helper for hash to SHA256
  sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Helper for generating seeds
  generateSeed(length = 64) {
    return crypto.randomBytes(length / 2).toString('hex');
  }
}

module.exports = new SpinEngine();
