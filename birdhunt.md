# 🦅 GameX Sniper: Ultimate Hunting Arena Blueprint

## 🎯 Vision
**GameX Sniper** is a high-performance, precision-based hunting simulation. It combines **Phaser.js** for elite client-side rendering with a **Node.js/MongoDB** server-side authority. The game is built to be **provably fair**, **non-manipulable**, and **economy-integrated** using TRX.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────┐
│               Game Server (Node.js + MongoDB)    │
├─────────────────────────────────────────────────┤
│  • Bird AI & Flocking (Authority)              │
│  • Server-side Trajectory Validation           │
│  • Weapon & Inventory Ledger                   │
│  • Anti-Cheat & HMAC Verification              │
│  • TRX Wallet & Reward Processor               │
└─────────────────┬───────────────────────────────┘
                  │ WebSocket (Real-time State)
┌─────────────────▼───────────────────────────────┐
│               Client (React + Phaser.js)        │
├─────────────────────────────────────────────────┤
│  • 60 FPS WebGL Rendering                      │
│  • Interpolated Entity Movement                │
│  • Advanced FX (Tracers, Recoil, Muzzle)       │
│  • Encrypted Event Batching                    │
└─────────────────────────────────────────────────┘
```

---

## 🌪️ Physics & AI Constants

### 1. Physics Engine (Server-side)
| Constant | Value | Description |
| :--- | :--- | :--- |
| `GRAVITY` | 9.8 | Downward force on projectiles (bow/arrow) |
| `AIR_RESISTANCE` | 0.01 | Velocity decay per frame |
| `WIND_VARIATION` | 2.0 | Max lateral force applied to shots |
| `ARROW_DRAG` | 0.001 | Specific drag coefficient for bow weapons |

### 2. Bird AI (The Flocking System)
Birds use three-steering behaviors to move realistically:
*   **Separation:** Avoiding crowding local flockmates.
*   **Alignment:** Steering towards the average heading of local flockmates.
*   **Cohesion:** Steering toward the average position (center of mass) of local flockmates.
*   **Panic Mode:** Triggered by nearby shots; birds increase speed by 1.5x and steer away from the shot origin for 3 seconds.

---

## 🕊️ The Aviary (Entity Profiles)

| Type | Speed | Health | Points | Rarity | Special Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sparrow** | 1.5 | 1 | 10 | Common | Erratic jitter |
| **Pigeon** | 1.2 | 2 | 15 | Common | Low-altitude cruise |
| **Crow** | 2.0 | 3 | 25 | Rare | Dives when shot at |
| **Eagle** | 3.0 | 5 | 50 | Epic | High altitude, high speed |
| **Phoenix** | 4.0 | 10 | 150 | Legendary | Emits light, leave trails |

---

## 🔫 Weapon & Inventory System

Users purchase and equip weapons from the shop using TRX.

| Stat | Description |
| :--- | :--- |
| **Damage** | Health reduction per hit (0.5 - 3.0) |
| **Fire Rate** | Min ms between shots (Anti-cheat enforced) |
| **Accuracy** | Projectile spread reduction |
| **Reload Time** | Delay when ammo/magazine is depleted |

### Weapon Perks:
*   `headshotMultiplier`: Bonus for precision hits.
*   `windResistance`: Negates a % of environment wind force.
*   `criticalChance`: Probability of 1.5x damage.

---

## 🛡️ Provably Fair & Anti-Cheat

### 1. Deterministic Generation
Every match is generated from a **Server Seed** and a **Client Seed**.
*   Bird spawn locations, wind patterns, and bird types are calculated using `HMAC-SHA256(seed, nonce)`.
*   Users can verify the entire "flight path" of the birds after the game ends.

### 2. Validation Engine
The server validates every shot using:
*   **Rate Limiting:** Rejecting shots faster than the weapon's `fireRate`.
*   **Trajectory Simulation:** Server re-calculates the arc; if the client's reported hit doesn't match the server's simulation, the hit is discarded.
*   **Cheat Flags:** 
    *   `impossible_accuracy`: Flagged if hits > shots.
    *   `shot_timing`: Flagged if input intervals are perfectly robotic.

---

## 🎮 Match Initialization Lifecycle

Before a match begins, the server executes the following atomic sequence:

1.  **Balance Audit:** The system verifies the user has sufficient TRX/Balance for the selected level's `entryFee`.
2.  **Financial Commitment:** 
    *   Deducts the `entryFee` from the user's `mainBalance`.
    *   Creates a `Transaction` record (Type: `game_bet`, Amount: `-entryFee`).
3.  **Session Genesis:** 
    *   Initializes a `Match` record in the database with status `active`.
    *   Registers the user in the `GameEntry` participant list for that specific match instance.
    *   Allocates a portion of the entry fee to the dynamic Prize Pool if applicable.

---

## 📊 Database Schema (MongoDB)

### `User`
*   `level / xp / TRX Balance`
*   `inventory`: Array of `weaponId` (unlocked/equipped)
*   `stats`: Total matches, headshots, highest score.

### `Match` (GameEntry)
*   `userId`, `matchId`, `weaponUsed`.
*   `participants`: Array of User IDs (for multiplayer sessions).
*   `prizePool`: The total TRX amount available for rewards in this session.
*   `score`, `combo`, `accuracy`.
*   `seed`: The cryptographic seed for verification.
*   `status`: `active`, `verified`, `suspicious`, or `completed`.

### `Weapon`
*   `name`, `type`, `price`
*   `damage`, `fireRate`, `accuracy`
*   `perks`: Multipliers for headshots, wind, and crits.

---

## 🚀 Execution Roadmap

1.  **Phase 1 (Engine):** Port the `BirdHuntingEngine.js` to handle Phaser-compatible relative coordinates (0-1).
2.  **Phase 2 (Sockets):** Implement the `/game` namespace with JWT authentication.
3.  **Phase 3 (Client):** Build the Phaser `MainScene` with asset preloading and interpolated bird movement.
4.  **Phase 4 (Economy):** Integrate `purchase.js` routes with the existing TRX wallet system.
5.  **Phase 5 (Verification):** Build the "Fairness Auditor" UI for match history.