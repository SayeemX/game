# 🎮 GEMINI - GameX Technical Specification & Implementation Guide

**Complete technical blueprint for GameX gaming platform with detailed architecture, API specifications, and working implementations.**

**Version:** 2.0 | **Status:** Production Ready | **Last Updated:** February 4, 2026

---

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Backend Structure](#backend-structure)
4. [Frontend Structure](#frontend-structure)
5. [Game Engines](#game-engines)
6. [API Specifications](#api-specifications)
7. [Socket.IO Events](#socketio-events)
8. [Authentication & Security](#authentication--security)
9. [Implementation Guides](#implementation-guides)
10. [Deployment & DevOps](#deployment--devops)
11. [Performance Optimization](#performance-optimization)
12. [Known Issues & Fixes](#known-issues--fixes)

---

## 🏗️ System Architecture

### High-Level Overview
```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│                 (React + Three.js)                      │
├────────────────┬──────────────────┬────────────────────┤
│  Bird Shooting │  Fortune Spin    │  Wallet & Admin    │
│  Game          │  Game            │  Dashboard         │
└────────────────┼──────────────────┼────────────────────┘
                 │                  │
          REST API + WebSocket      │
                 │                  │
┌────────────────▼──────────────────▼────────────────────┐
│                  SERVER LAYER                          │
│            (Express.js + Socket.IO)                    │
├──────────────────────────────────────────────────────┤
│  • Route Handlers (Auth, Game, Admin)                │
│  • Game Engines (BirdShootingEngine, SpinEngine)     │
│  • Real-time Event Handlers (Socket.IO)              │
│  • Middleware (Auth, Admin, Validation)              │
│  • Business Logic Services (RNG, Fairness)           │
└────────────────┬──────────────────┬────────────────────┘
                 │                  │
           MongoDB Queries      Real-time Events
                 │                  │
┌────────────────▼──────────────────▼────────────────────┐
│            PERSISTENCE LAYER                           │
│          (MongoDB + Mongoose)                          │
├──────────────────────────────────────────────────────┤
│  User | Game | BirdMatch | Transaction | Seed Data  │
└─────────────────────────────────────────────────────┘
```

### Core Systems

#### 1. **Authentication System**
- JWT-based token authentication
- Password hashing with bcryptjs (10 salt rounds)
- Role-based access control (User, Admin)
- Token expiration and refresh logic

**Flow:**
```
Registration → Password Hash → User Created
     ↓
Login → Verify Hash → JWT Issued
     ↓
Request → Verify JWT → Access Granted/Denied
```

#### 2. **Game Engine System**
- **Bird Shooting**: Server-authoritative ballistics validation
- **Fortune Spin**: Cryptographically fair RNG with HMAC-SHA256
- **Session Management**: Real-time credit deduction and billing

#### 3. **Provably Fair System**
- Server Seed (random, stored securely)
- Client Seed (user-adjustable)
- Nonce Counter (incremental)
- HMAC-SHA256 Verification: `HMAC(serverSeed, clientSeed + nonce)`

#### 4. **Financial System**
- Main Balance (primary currency)
- Bonus Balance (promotional)
- GameX Credits (per-session currency)
- Transaction Ledger (immutable records)
- Atomic operations for concurrency safety

---

## 📊 Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  username: String (unique, lowercase),
  email: String (unique),
  password: String (hashed with bcryptjs),
  
  // Wallet
  wallet: {
    mainBalance: Number (default: 0),
    bonusBalance: Number (default: 0),
    totalSpent: Number (accumulated),
    totalWon: Number (accumulated)
  },
  
  // Game Credits (per-session)
  gameCredits: {
    birdShootingCredits: Number,
    spinCredits: Number
  },
  
  // Inventory
  inventory: {
    arrows: Number,
    weaponId: ObjectId (ref: BirdWeapon)
  },
  
  // Statistics
  stats: {
    totalMatches: Number,
    totalScore: Number,
    totalHeadshots: Number,
    accuracy: Number (percentage)
  },
  
  // Settings
  settings: {
    clientSeed: String,
    autoRechargeEnabled: Boolean,
    twoFactorEnabled: Boolean
  },
  
  // Admin
  role: String (default: "user", enum: ["user", "admin"]),
  isRestricted: Boolean (default: false),
  
  createdAt: Date,
  updatedAt: Date
}
```

### BirdMatch Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  matchType: String (enum: ["bird_shooting", "spin"]),
  
  // Match Data
  startTime: Date,
  endTime: Date,
  duration: Number (milliseconds),
  status: String (enum: ["active", "completed", "abandoned"]),
  
  // Game Specific
  level: Number (1-4),
  entryFee: Number,
  reward: Number,
  finalScore: Number,
  
  // Bird Shooting Specific
  birdKills: Number,
  accuracy: Number,
  weaponUsed: ObjectId (ref: BirdWeapon),
  
  // Fairness
  serverSeed: String,
  clientSeed: String,
  nonce: Number,
  
  // Session Charges
  chargesApplied: [{
    chargeTime: Date,
    amount: Number,
    reason: String
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  type: String (enum: ["game_bet", "game_win", "purchase", "deposit", "withdrawal", "session_charge"]),
  amount: Number (can be negative),
  beforeBalance: Number,
  afterBalance: Number,
  
  // Reference
  matchId: ObjectId (optional),
  description: String,
  
  status: String (enum: ["pending", "approved", "rejected"]),
  approvedBy: ObjectId (admin user, optional),
  
  createdAt: Date,
  updatedAt: Date
}
```

### CurrencyConfig Model
```javascript
{
  _id: ObjectId,
  gameType: String (enum: ["bird_shooting", "spin"]),
  level: Number,
  
  entryFee: Number,
  sessionDuration: Number (milliseconds, 3 minutes default),
  sessionCharge: Number (charged per interval),
  chargeInterval: Number (milliseconds, 3 minutes default),
  
  // Rewards
  rewards: [{
    birdType: String,
    points: Number,
    reward: Number
  }],
  
  // Auto-Recharge (Bird Shooting specific)
  autoRechargeEnabled: Boolean,
  autoRechargeAmount: Number,
  autoRechargeInterval: Number,
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🛠️ Backend Structure

### Directory Structure
```
server/
├── index.js                    # Server Entry Point
├── models/
│   ├── User.js
│   ├── Game.js
│   ├── BirdMatch.js
│   ├── Transaction.js
│   ├── CurrencyConfig.js
│   └── BirdWeapon.js
├── routes/
│   ├── auth.js                # POST /auth/register, /auth/login
│   ├── user.js                # GET/POST /user/*
│   ├── game.js                # POST /game/bird-shooting/join
│   ├── games.js               # GET /games/list
│   ├── admin.js               # Admin endpoints
│   ├── spin.js                # POST /spin/play
│   ├── payment.js             # POST /payment/*
│   ├── redeem.js              # POST /redeem/code
│   └── shop.js                # GET /shop/items, POST /shop/purchase
├── services/
│   ├── BirdShootingEngine.js  # Game Logic & Hit Validation
│   ├── SpinEngine.js          # Wheel Logic & RNG
│   └── rngService.js          # Provably Fair RNG
├── middleware/
│   ├── auth.js                # JWT Verification
│   ├── admin.js               # Admin Check
│   └── authorize.js           # Permission Check
└── scripts/
    ├── seedCurrencyConfig.js
    ├── seedStore.js
    └── createTestCode.js
```

### Server Entry Point (index.js)

**Key Initialization:**
```javascript
// 1. Load environment
require('dotenv').config();

// 2. Initialize Express & Socket.IO
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { ... } });

// 3. Connect MongoDB
mongoose.connect(MONGODB_URI).then(async () => {
  console.log('✅ MongoDB Connected');
  
  // Auto-seed weapons
  const count = await BirdWeapon.countDocuments();
  if (count === 0) {
    // Seed default weapons
  }
});

// 4. Setup Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/game', gameRoutes);
// ... more routes

// 5. Setup Socket.IO Listeners
io.on('connection', (socket) => {
  // bird_shoot:join, bird_shoot:shoot, etc.
});

// 6. Start Server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 🎮 Frontend Structure

### Directory Structure
```
client/src/
├── components/
│   ├── games/
│   │   ├── BirdShooting.jsx        # Main game component
│   │   └── SpinWheel.jsx           # Spin game component
│   ├── layout/
│   │   └── Navbar.jsx              # Navigation
│   ├── AuthForm.jsx                # Login/Register
│   ├── CurrencyConfigManager.jsx
│   ├── ProvablyFairSettings.jsx
│   └── RedeemCodeSection.jsx
├── pages/
│   ├── Home.jsx
│   ├── GameRoom.jsx
│   ├── AdminDashboard.jsx
│   ├── Profile.jsx
│   ├── Store.jsx
│   └── Wallet.jsx
├── entities/
│   └── Arrow.js                    # Projectile Physics
├── redux/
│   ├── store.js
│   └── slices/
│       └── userSlice.js            # Redux State
├── services/
│   └── api.js                      # Axios Instance
├── assets/
│   └── birds/
├── App.jsx
├── main.jsx
└── index.css
```

---

## 🎮 Game Engines

### Bird Shooting Engine (Server-Side)

**Location:** `server/services/BirdShootingEngine.js`

**Key Functions:**

#### 1. **validateHit()**
Validates if a shot hit a bird based on arrow position, bird position, and distance calculations.

#### 2. **calculateReward()**
Calculates reward based on bird type, accuracy, and headshot multiplier.

#### 3. **chargeUserSession()**
Automatically charges user for session every 3 minutes with atomic operations and transaction logging.

### Fortune Spin Engine (Server-Side)

**Location:** `server/services/SpinEngine.js`

**Provably Fair Process:**
- Generate HMAC-SHA256 hash from server seed, client seed, and nonce
- Convert hash to normalized value (0-1)
- Map to wheel segments based on cumulative probability
- Return selected segment with reward

---

## 🔌 Socket.IO Events

### Bird Shooting Game Events

#### Client → Server: `bird_shoot:join`
Initiates new match with level and client seed

#### Server → Client: `bird_shoot:session`
Returns match data, birds, server seed, and session duration

#### Client → Server: `bird_shoot:shoot`
Sends shot data (arrow position, target bird, hit type)

#### Server → Client: `bird_shoot:shot_result`
Returns hit validation, reward, and new score

#### Server → Client: `balance_update`
Updates wallet balance in real-time

#### Server → Client: `bird_shoot:game_over`
Ends match with final score and reward

---

## 🔐 Authentication & Security

### JWT Implementation
**Token Structure:**
```
Header: { alg: 'HS256', typ: 'JWT' }
Payload: {
  id: 'user_id',
  username: 'player123',
  role: 'user',
  iat: 1675000000,
  exp: 1675003600  // 1 hour
}
Signature: HMAC-SHA256(header.payload, JWT_SECRET)
```

### Password Security
- Hashing with bcryptjs (10 salt rounds)
- Secure verification during login
- Never stored in plaintext

### CORS Configuration
- Whitelist specific origins
- Allow credentials for authenticated requests
- Prevent unauthorized cross-origin access

---

## 🚀 Implementation Guides

### Setting Up a New Game

**Step 1: Create Game Model** - Define Mongoose schema for game data
**Step 2: Create Game Engine** - Implement game logic and RNG
**Step 3: Create Routes** - Setup API endpoints
**Step 4: Add Socket.IO Handlers** - Implement real-time events

---

## 🚀 Deployment & DevOps

### Environment Variables

**Server (.env):**
```env
PORT=10000
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/gamex
JWT_SECRET=your_super_secret_key_here
CLIENT_URL=https://gamex.example.com
```

**Client (.env):**
```env
VITE_API_URL=https://api.gamex.example.com
VITE_API_WS=wss://api.gamex.example.com
```

### Render Deployment
Push to GitHub → Connect to Render → Configure environment variables → Deploy

---

## ⚡ Performance Optimization

### Client-Side
1. Code splitting with lazy loading
2. Bundle optimization and gzip compression
3. Static asset caching
4. Production build optimization

### Server-Side
1. Database indexing on frequently queried fields
2. Query optimization with field projection
3. MongoDB connection pooling
4. Rate limiting and request throttling

### Network
1. WebSocket for persistent real-time connection
2. Socket.IO compression enabled
3. CDN for static assets
4. Message batching and optimization

---

## 🐛 Known Issues & Fixes

### Recent Fixes (Latest Session - Feb 4, 2026)

**Fix72:** Resolved "ReferenceError: user is not defined" in chargeUserSession
- **Root Cause**: Missing explicit user fetch at function start
- **Solution**: Added `const user = await User.findById(userId);`
- **Impact**: Session charging now works reliably
- **File**: `server/services/BirdShootingEngine.js`

**Fix73:** Implemented automatic scope behavior in Bird Shooting
- **Feature**: Auto-zoom to 2x when arrow nocked, immediate unscope after firing
- **Solution**: Added scope management in arrow nocking and firing events
- **Impact**: Improved UX and scope responsiveness
- **File**: `client/src/components/games/BirdShooting.jsx`

**Fix74:** Configured desktop mouse controls for Bird Shooting
- **Feature**: Right-click toggles scope and triggers shooting
- **Solution**: Implemented contextmenu event listener and scope toggle logic
- **Impact**: Full desktop mouse control integration
- **File**: `client/src/components/games/BirdShooting.jsx`

### Previous Critical Fixes

**Fix70:** Backward flying bug and smart sprite system upgrade
- Implemented velocity-based sprite direction detection

**Fix71:** Bird animation system optimization
- Standardized to 1x5 vertical sprite sheets

**Fix69:** API and Socket.io services refactoring
- Transitioned to environment variables (VITE_API_URL, CLIENT_URL)

**Fix68:** System-wide logic synchronization
- Implemented atomic Mongoose operations with `$inc`

### Complete Fix History
All fixes from Fix1 through Fix74 are documented with detailed root cause analysis, solutions, and file locations. See README.md for comprehensive list of all 74 fixes implemented.

---

## 📈 Current Status

### Production Metrics
- ✅ Bird Shooting game fully operational
- ✅ Fortune Spin fully operational
- ✅ Wallet system with atomic transactions
- ✅ Admin Dashboard with full controls
- ✅ Scope system (desktop & mobile)
- ✅ Build: Clean compile, no errors
- ✅ Testing: Smoke test 5/5 passing

### Recent Improvements
- Enhanced socket connection reliability
- Improved scope toggle responsiveness
- Fixed wallet pre-fetch on game entry
- Added startup delay for fullscreen stabilization
- Reduced aim sensitivity during charge (mobile)
- Device-aware HUD hints

### Planned Features
- Advanced analytics dashboard
- Leaderboard system
- Seasonal rewards
- Tournament mode
- Social features (friends, clans)

---

## 📞 Support & Maintenance

**Contact**: GameX Development Team  
**Repository**: https://github.com/SayeemX/game  
**Live Demo**: https://gamex-th2n.onrender.com  
**Last Updated**: February 4, 2026  
**Version**: 2.0.0  
**Status**: ✅ Production Ready

**Special Instruction:** Document all bugs and fixes in the "Known Issues & Fixes" section with detailed root cause analysis and solutions.
