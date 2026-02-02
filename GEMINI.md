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
    - **Physics-Based Projectiles:** Arrows are discrete `CANNON.Body` objects with mass and ballistic trajectory.
    - **Realistic Archery Experience:**
        - **Dynamic Bowstring:** Visual string deformation following the arrow's nock.
        - **Ballistic Rotation:** Arrows automatically rotate during flight to align with velocity.
        - **Charge Mechanics:** Vertical HUD meter with spring animations and "Max Tension" pulse.
        - **First-Person Immersion:** Hunter "Arms" that realistically draw back when the string is pulled.
    - **Advanced Navigation & Controls:**
        - **360° Field of View:** Unrestricted horizontal rotation for full arena awareness.
        - **Pitch Clamping:** Hard limits on vertical rotation (-80° to +80°) to prevent camera inversion.
        - **Analog Smoothing:** Joystick input controls rotation velocity for buttery-smooth movement.
    - **Hunting Simulation:**
        - **Impact Dynamics:** Arrows stick into targets or environment.
        - **Death Animations:** Birds fall realistically with gravity and spin when hit.
        - **Environmental Fidelity:** 
            - **Dynamic Stage Themes:** Implemented a multi-theme environment system that swaps sky, ground, and fog assets based on game level (Meadows, Hills, Night, Rainbow).
            - **Tiled Ground:** Optimized 2000-unit terrain with 200x repetition and anisotropy.
    - **Session & Economy:**
        - **Session Tracking:** WebSocket-driven duration monitoring.
        - **Usage Fees:** Automated deduction of credits every 3 minutes.
        - **Ammo Persistence:** Unused projectiles are returned to inventory upon match exit.

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
Fix8: Resolved arrow cleanup bug where a typo prevented arrows from being removed from the scene.
Fix9: Fixed keyboard shortcut bug where Space bar could start a draw but not transition to aiming.
Fix10: Implemented persistent ammo return logic to ensure unused arrows are restored to user inventory upon match finalization.
Fix11: Stabilized ground texture rendering by increasing repeat count and enabling anisotropy for better visual depth.
Fix12: Synchronized hit-registration visual feedback by implementing floating text sprites and re-tuned particle lift.
Fix13: Resolved favicon 404 error on GitHub Pages by creating a custom favicon.svg and updating the link in index.html to use a relative path.
Fix14: Fixed camera inversion bug by implementing vertical pitch clamping and centralized rotation velocity logic.
Fix15: Resolved asset loading 404s on Render/GitHub subpaths by implementing a dynamic basename resolver for Three.js loaders.
Fix16: Removed redundant 2D UI crosshairs to prevent duplication; the game now relies solely on 3D crosshairs which toggle correctly between default and scoped modes.
Fix17: Fixed critical hit registration bug where server relied on static coordinates while client used dynamic physics. Implemented ID-based validation for reliable scoring.
Fix18: Synchronized bird health between client and server (set to 1 HP) to ensure consistent "one-shot" kill mechanics and prevent zombie birds.
Fix19: Implemented analog camera smoothing with velocity-based damping for fluid aiming.
Fix20: Split mobile touch controls: Left side for "Pull-to-Charge" (Bow), Right side for "Touch-Look" (Camera).
Fix21: Added React-based 2D static crosshair overlay that auto-hides when scoped.
Fix22: Clamped vertical camera pitch to +/- 80 degrees to prevent inversion.
Fix23: Integrated charge meter with spring animation and dynamic bowstring deformation based on draw power.
Fix24: Replaced image-based environment with a fully procedural Three.js system including dynamic Sky (Rayleigh scattering), instanced grass/flowers for high-performance vegetation, and generated billboard clouds. Removed dependency on external skybox textures.
Fix25: Resolved mobile responsiveness issue on `/bird-shooting` by removing fixed viewport constraints in `App.jsx` and `BirdShooting.jsx`, enabling lobby scrolling and optimizing element scaling for small screens.
Fix40: Successfully deployed all updates to GitHub repository.
Fix41: Re-engineered shooting logic: Drag-to-Draw, Release-to-Hold, and Tap-to-Shoot for enhanced precision.
Fix42: Repositioned Scope and Inventory buttons to the right side for better ergonomics and simplified the Inventory button to icon-only.
Fix43: Moved Zoom controls to the absolute right edge and optimized Scoped UI.
Fix44: Implemented automatic unscope and camera FOV/zoom reset after arrow impact (hit or ground).
Fix45: Added a pro 2D reticle overlay for scoped mode to ensure high visibility and aiming precision on all screens.
Fix46: Optimized scoped UI exit button positioning for better mobile accessibility.
Fix47: Implemented cinematic "Follow Cam" system that tracks arrow trajectory post-shot with dynamic FOV zooming and persistent impact viewing before resetting to player perspective.
Fix48: Optimized server-side hit validation in `BirdShootingEngine.js` by accounting for elapsed time and wrap-around movement, ensuring authoritative synchronization.
Fix49: Standardized wallet transaction logging to include session charges and entry fees in `user.wallet.totalSpent`.
Fix50: Refined cinematic camera resets and improved Follow-Cam viewing angles for a more professional sniper experience.
Fix51: Refined "Skip" logic: Marks the flying arrow as 'skipped' (guaranteed miss) and immediately resets the camera and player state for the next shot, while allowing the arrow to continue its physical trajectory visually.
Fix52: Final audit of game logic and successful deployment of refined mobile ergonomics.
Fix53: Added "Retype Password" field to registration page with matching validation logic to ensure credential integrity.
Fix54: Implemented manual "Reload Session" functionality in BirdShooting game. Added server-side `bird_shoot:extend_session` handler and client-side UI to display a Reload button when the session timer expires or auto-charge fails. The reload action manually triggers the session extension and billing logic.

Fix55: Resolved "TypeError: can't access property onShoot, this.game is undefined" in `BirdShooting.jsx` by correcting the scope reference in `HuntingGame3D.animate` from `this.game.onShoot` to `this.onShoot`, and ensuring correct power reporting using `arrow.charge`.

Fix56: Implemented "Auto-Recharge" logic for Bird Shooting sessions. Added a server-side permission-based deduction system that automatically extends the session every interval (increasing by 1 minute each time) if enabled by the user. Implemented a "One-Time Permission" modal in the frontend that appears when the timer first expires, allowing users to enable auto-recharge or perform a manual extension.
Fix57: Implemented mouse wheel zoom functionality in Bird Shooting game, allowing players to cycle through zoom levels using the scroll wheel while scoped or tracking.Fix59: Optimized the `animate` loop by delegating bird state management to the `BirdSystem3D` class, improving performance and code maintainability.
Fix60: Implemented frame-based sprite sheet animation for birds. Replaced the simple scaling "flap" with actual texture offset scrolling to support multiple flight states provided in the bird PNGs. Added configurable frame counts per bird type.
Fix61: Normalized Eagle animation logic to handle its unique vertical 6-frame sprite sheet (64x192). Implemented aspect-ratio-corrected geometry (2:1) for the Eagle to prevent texture stretching while maintaining consistent 64px-normalized frame indexing.
Fix62: Implemented ammo/item rewards in Spin Game. Added "50x Arrows" to default prizes and updated backend to sync full inventory state after each spin. Updated frontend to dispatch `updateInventory` and `updateWallet` correctly upon spin completion.
Fix63: Enhanced Bird Shooting camera to allow full sky targeting with clamped vertical pitch (+/- 80°) and increased draw distance. Validated dynamic stage themes and projectile spawning accuracy.
Fix64: Added three new bird types (Falcon, Owl, Parrot) with distinct flight behaviors (Linear, Hover, Erratic), custom tinting, and refined rarity distribution. Updated both server-side spawn logic and client-side visualization.
Fix65: Implemented "Smart Sprite System" in BirdShooting.jsx. Removed hardcoded frame counts/directions from config. The system now automatically detects animation type (horizontal vs vertical strip) and frame count based on the loaded image's aspect ratio at runtime, enabling seamless support for diverse assets.
Fix66: Implemented "Auto-Discovery Asset System". Moved bird assets to `src/assets/birds` and utilized `import.meta.glob` to dynamically load all available variants (x.png, y.png, z.png) for each bird type. The system now randomly selects a variant upon spawn, allowing for easy addition of new skins without code changes.
Fix67: Architected the "Finance Control System". Added dynamic Payment Gateway management to Admin Dashboard, allowing real-time updates to bKash/Nagad numbers and TRX addresses. Implemented an authoritative Transaction Processing queue for manual approval/rejection of deposits and withdrawals with automated user balance synchronization. Added atomic `$inc` security to all financial routes to prevent concurrency exploits.
Fix68: Hardened system-wide logic synchronization. Implemented authoritative server-side ammo validation, atomic reward distribution in Bird Shooting, and synchronized 150-unit world coordinates (-70 to 80). Refactored Shop and Redeem routes to utilize atomic Mongoose operations, ensuring 100% data integrity under high concurrent load.
Fix69: Refactored API and Socket.io services to utilize environment variables (VITE_API_URL, CLIENT_URL) for enhanced deployment flexibility. Created .env.example templates and updated root .gitignore to pro-actively exclude sensitive and local-only files.
Fix70: Resolved "Backward Flying" bug and upgraded the "Smart Sprite System" to support grid-based sprite sheets (2x3, 3x2). Implemented dynamic geometry aspect-ratio adjustment to prevent texture squashing and synchronized 6-frame animation cycles across all bird assets.

### **Recent Features Added:**
- **Cancel Shot**: Added UI button and ESC key support to abort arrow draws without wasting ammo.
- **Desktop Controls**: Full keyboard support (Space to Draw/Shoot, ESC to Cancel).
- **Physics V2**: Improved ballistic rotation and bird impact dynamics.
- **Session Billing**: Real-time websocket-based credit deduction every 3 minutes of play.
- **Inventory Persistence**: Automated projectile recovery for unused ammo across game sessions.
- **Hunter Arms**: Visual first-person arms that draw back realistically during the charging phase.
- **HD Environment**: Implemented high-resolution sky and tiled grass ground for real-time gaming look.
- **Reward Animations**: Dynamic 3D floating point indicators and enhanced feather particles on every successful hunt.
- **Pro Navigation**: Full 360° horizontal rotation with mandatory vertical pitch clamping and analog-style joystick smoothing.
- **Dynamic Stage Themes**: Level-based environmental swapping (Meadows, Hills, Night, Rainbow) using localized asset mapping.
