# 🎮 Game/GameX - The Ultimate Gaming & Reward Arena

## 🚀 Vision & Identity
**Game/GameX** is a next-generation, high-performance gaming platform inspired by the sleek, high-stakes aesthetic of **BC.GAME**. Our flagship theme, **GameX GIFT**, focuses on transparency, player rewards, and an elite gaming experience.

- **Platform Name:** Game/GameX
- **Core Theme:** GameX GIFT (Exclusivity & Rewards)
- **Deployment URL:** [https://game.github.io/GameX](https://game.github.io/GameX)
- **Target Aesthetic:** Professional dark mode, neon accents, ultra-smooth animations, and a mobile-first "BC.GAME" interface.

---

## 🏗️ Technical Architecture

### 🛡️ Provably Fair System (The Core of Trust)
Like the world's leading gaming platforms, GameX utilizes a cryptographically secure **Provably Fair** algorithm. This ensures every spin and shot is pre-determined and verifiable.
- **Algorithm:** HMAC-SHA256
- **Components:** `Server Seed` (Secret), `Client Seed` (Adjustable by User), and `Nonce` (Sequential Counter).
- **Verification:** Users can verify any result post-game by hashing the provided seeds.

### 💻 Technology Stack
- **Frontend:** React.js (Vite) + Tailwind CSS + Framer Motion.
- **Physics Engine:** Cannon-es (Real-time ballistic and collision simulation).
- **3D Rendering:** Three.js (Hardware-accelerated WebGL).
- **State Management:** Redux Toolkit (User profiles, Wallet, Game states).
- **Backend:** Node.js + Express.js (High-concurrency API).
- **Database:** MongoDB Atlas (Persistent storage for accounts, logs, and seeds).
- **Real-Time:** Socket.io (Live win feeds, leaderboard updates, and multiplayer mechanics).

---

## 🛠️ Step-by-Step Implementation Guide

### **Phase 1: Brand & Aesthetic Overhaul**
1.  **Identity Swap:** Replace all legacy branding (e.g., KhelaZone) with **Game/GameX**.
2.  **Theme Implementation:** Apply the "GameX GIFT" design language across the homepage (`Home.jsx`).
3.  **Visual Language:** Utilize `#0f212e` (Deep Blue/Grey) and `#3bc117` (Vibrant Green) for that signature premium look.

### **Phase 2: Core Game Engineering**
1.  **Fortune Spin (Base Game):**
    - Implement a physics-accurate wheel with 8+ segments.
    - Connect to the `SpinEngine.js` for server-side HMAC calculation.
    - Add "GameX GIFT" bonus segments for legendary rewards.
2. **Bird Shooting (GameX Sniper):**
    - **Physics-Based Projectiles:** Arrows are now discrete `CANNON.Body` objects with mass, gravity, and ballistic trajectory logic.
    - **Realistic Archery Experience:**
        - **Dynamic Bowstring:** Visual string deformation that follows the arrow's nock during pull-back.
        - **Ballistic Rotation:** Arrows automatically rotate during flight to align with their velocity vector (pointing where they fly).
        - **Charge Mechanics:** Vertical HUD meter with spring animations and "Max Tension" glow effects.
    - **Hunting Simulation:**
        - **Impact Dynamics:** Arrows stick into birds or ground upon collision.
        - **Death Animations:** Birds no longer disappear; they enter a "dying" state, falling realistically with gravity and rotation.
        - **Feather Explosions:** Sprite-based particle systems triggered on successful hits.

### **Phase 3: Wallet & Reward Ecosystem**
1.  **Unified Wallet:** Create a central state for Main Balance, Bonus Balance, and GameX Credits.
2.  **Redeem System:** Secure endpoint for validating "GameX GIFT" codes.
3.  **Transaction History:** Immutable logs of every bet, win, and withdrawal.

---

## 📂 Project Structure
```text
GameX/
├── client/                     # React Frontend
│   ├── src/entities/           # 3D Game Objects (Arrow, etc.)
│   ├── src/components/         # Atomic UI Components
│   │   ├── games/              # Game Engines (Spin, BirdShoot)
│   │   └── layout/             # Navigation & GameX GIFT UI
│   ├── src/pages/              # Page Views (Home, Wallet, Admin)
│   └── src/redux/              # Global State (userSlice, gameSlice)
├── server/                     # Express Backend
│   ├── models/                 # Mongoose Schemas (User, Game, Code)
│   ├── routes/                 # API Endpoints (Auth, Spin, Games)
│   ├── services/               # Business Logic (RNG, Fairness)
│   └── index.js                # Server Entry Point
└── GEMINI.md                   # Technical Blueprint
```

---

## 🔒 Security & Performance
- **DDoS Protection:** Rate limiting on all high-frequency endpoints.
- **JWT Security:** Standardized JSON Web Tokens for authenticated sessions.
- **Data Integrity:** Strict Mongoose schemas to prevent malicious data injection.

---
**Maintained by:** GameX Dev
**Last Updated:** January 2026
**Current Status:** Finalizing Game/GameX Live Implementation.

Spescial Instruction: Everytime after fixing a bug note down it in this section:
Fix1: Resolved "Cast to Number" validation error in `User.js` by replacing `Mixed` type with an explicit nested schema for `spinCredits`.
Fix2: Corrected property name mismatch in `SpinWheel.jsx` where Redux was looking for `balance/spins` instead of `mainBalance/spinCredits` from the backend response.
Fix3: Implemented strict credit validation in `spin.js` backend to prevent "ghost spins" when available spin counts are zero.
Fix4: Fixed `AdminDashboard.jsx` crash (TypeError on .map) by adding support for the tiered wheel data structure and implementing optional chaining.
Fix5: Resolved `TypeError: next is not a function` in `User.js` by removing the redundant `next` callback from the `async` pre-save hook.
Fix6: Fixed arrow rotation logic in `Arrow.js` to ensure the tip always points in the direction of travel during parabolic flight.
Fix7: Corrected bird death logic to prevent hit-registration on birds that are already in the "dying" falling state.