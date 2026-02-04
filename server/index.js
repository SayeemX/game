require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Import Models
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const BirdMatch = require('./models/BirdMatch');
const Game = require('./models/Game');
const BirdWeapon = require('./models/BirdWeapon');
const birdShootingEngine = require('./services/BirdShootingEngine');

const app = express();
const server = http.createServer(app);

// Allowed origins for CORS (used by both Express and Socket.IO)
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.CLIENT_URL, 'https://gamex-th2n.onrender.com', 'https://sayeemx.github.io']
  : ['http://localhost:5173', 'http://localhost:3000'];

// Socket.io Setup with dynamic CORS using the same allowed origins
const io = new Server(server, {
    cors: {
        origin: function(origin, callback) {
            if (!origin || allowedOrigins.includes(origin) || (typeof origin === 'string' && origin.endsWith('.github.io'))) {
                callback(null, true);
            } else {
                callback(new Error('CORS policy violation'));
            }
        },
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Production Security & Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Set to true and configure if using specialized CDNs
}));
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.github.io')) {
      callback(null, true);
    } else {
      console.log('Origin blocked by CORS:', origin);
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ FATAL ERROR: MONGODB_URI or MONGO_URI is not defined in environment variables.');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
.then(async () => {
  console.log('✅ MongoDB Connected Successfully');
  
  // Auto-seed weapons if empty
  try {
    const count = await BirdWeapon.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding initial weapons...');
      const initialWeapons = [
        { name: "Basic Wooden Bow", key: "basic_bow", type: "bow", damage: 1, price: 0 },
        { name: "Recurve Hunter", key: "recurve_bow", type: "bow", damage: 1.5, price: 100 },
        { name: "Shadow Sniper", key: "shadow_sniper", type: "airgun", damage: 2.5, price: 1000 }
      ];
      await BirdWeapon.insertMany(initialWeapons);
    }

    const gameCount = await Game.countDocuments();
    if (gameCount === 0) {
      console.log('🌱 Seeding initial game config...');
      await Game.create({
        trxPool: 0,
        birdShooting: { entryFee: 10 },
        payment: {
          bkash: { number: "017XXXXXXXX", active: true },
          nagad: { number: "018XXXXXXXX", active: true },
          trx: { address: "TY123...456", active: true },
          conversionRate: 15
        }
      });
    }
  } catch (e) { console.error('Seeding failed:', e); }
})
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/spin', require('./routes/spin'));
app.use('/api/games', require('./routes/games'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/redeem', require('./routes/redeem'));
app.use('/api/shop', require('./routes/shop'));

// Socket.io Authentication Middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if (!token) return next(new Error('Authentication error: No token provided'));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.user?.id || decoded.id;
        const user = await User.findById(userId).select('-password');
        
        if (!user) return next(new Error('User not found'));
        
        socket.user = user;
        next();
    } catch (err) {
        next(new Error('Authentication error: Invalid token'));
    }
});

// Track active sessions for charging
const activeSessions = new Map(); // userId -> { startTime, lastChargeTime, socketId, totalCharged, matchId, intervalMinutes, timer }

const SESSION_CHARGE_AMOUNT = 0.1; 

const chargeUserSession = async (userId, io, isAuto = false) => {
    try {
        // Ensure the 'user' object is always available in scope if needed downstream
        const user = await User.findById(userId);
        const session = activeSessions.get(userId);
        if (!session) return false;

        // Auto-Recharge Check
        if (isAuto && !session.autoRecharge) {
            io.to(session.socketId).emit('error', { 
                message: 'Session Expired',
                type: 'SESSION_EXPIRED'
            });
            return false;
        }

        const amountToDeduct = SESSION_CHARGE_AMOUNT;
        
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId, "wallet.mainBalance": { $gte: amountToDeduct } },
            { 
                $inc: { 
                    "wallet.mainBalance": -amountToDeduct,
                    "wallet.totalSpent": amountToDeduct 
                } 
            },
            { new: true }
        );

        if (!updatedUser) {
            io.to(session.socketId).emit('error', { 
                message: 'Insufficient balance for session. Please recharge or exit.',
                type: 'SESSION_EXPIRED'
            });
            return false;
        }

        // Add to Website TRX Pool
        await Game.findOneAndUpdate({}, { $inc: { trxPool: amountToDeduct } });

        // Double check session still exists after async DB calls
        const currentSession = activeSessions.get(userId);
        if (!currentSession || currentSession.matchId !== session.matchId) {
            return false;
        }

        currentSession.totalCharged = (currentSession.totalCharged || 0) + amountToDeduct;
        currentSession.lastChargeTime = Date.now();
        
        // Increment interval for next time (Add 1 minute)
        currentSession.intervalMinutes += 1;
        const nextDurationMs = currentSession.intervalMinutes * 60 * 1000;

        // Schedule next charge
        currentSession.timer = setTimeout(async () => {
            await chargeUserSession(userId, io, true);
        }, nextDurationMs);

        io.to(currentSession.socketId).emit('balance_update', { 
            mainBalance: updatedUser.wallet.mainBalance,
            sessionCharged: currentSession.totalCharged,
            nextChargeTime: Date.now() + nextDurationMs,
            intervalMinutes: currentSession.intervalMinutes,
            autoRecharge: currentSession.autoRecharge
        });
        
        await Transaction.create({
            userId: userId,
            type: 'game_bet',
            amount: SESSION_CHARGE_AMOUNT,
            currency: 'TRX',
            description: `Bird Shooting Session Extension (${currentSession.intervalMinutes} min) - Match: ${currentSession.matchId}`,
            status: 'completed'
        });

        return true;
    } catch (err) {
        console.error('Session charge error:', err);
        return false;
    }
};

io.on('connection', (socket) => {
    console.log(`📡 Socket Connected: ${socket.user?.username}`);

    // Session will now be initialized upon match entry
    
    socket.on('bird_shoot:join', async (data) => {
        try {
            let level = parseInt(data?.level);
            if (isNaN(level) || level < 1 || level > 4) {
                level = 1; // Default to level 1 if invalid
            }
            const userId = socket.user.id;

            // Clear any existing session/timer for this user
            const existingSession = activeSessions.get(userId);
            if (existingSession && existingSession.timer) {
                clearTimeout(existingSession.timer);
            }

            const gameConfig = await Game.findOne();
            const baseFee = gameConfig?.birdShooting?.entryFee || 10;
            const entryFee = baseFee * level;
            const totalDeduction = entryFee + SESSION_CHARGE_AMOUNT;

            // Atomic Deduction
            const updatedUser = await User.findOneAndUpdate(
                { _id: userId, "wallet.mainBalance": { $gte: totalDeduction } },
                { 
                    $inc: { 
                        "wallet.mainBalance": -totalDeduction,
                        "wallet.totalSpent": totalDeduction 
                    } 
                },
                { new: true }
            );

            if (!updatedUser) {
                return socket.emit('error', { message: 'Insufficient balance for entry fee and initial session charge' });
            }
            
            // Add session charge to Website TRX Pool
            await Game.findOneAndUpdate({}, { $inc: { trxPool: SESSION_CHARGE_AMOUNT } });

            const weaponKey = updatedUser.inventory.equippedWeapon || 'basic_bow';
            let weaponStats = { key: 'basic_bow', type: 'bow', damage: 1, perks: { windResistance: 0.1 } };
            
            try {
                const weapon = await BirdWeapon.findOne({ key: weaponKey });
                if (weapon) weaponStats = weapon.toObject();
            } catch(e) { console.error("Weapon lookup failed, using defaults"); }

            const ammoType = weaponStats.type === 'bow' ? 'arrow' : 'pellet';
            if (!updatedUser.inventory.items) updatedUser.inventory.items = [];
            let ammoItem = updatedUser.inventory.items.find(i => i.itemKey === ammoType);
            
            // Check if user has ANY ammo
            if (!ammoItem || ammoItem.amount <= 0) {
                // Revert deduction if no ammo (atomic reversal)
                await User.findByIdAndUpdate(userId, { $inc: { "wallet.mainBalance": totalDeduction, "wallet.totalSpent": -totalDeduction } });
                return socket.emit('error', { 
                    message: `Insufficient ${ammoType}s. Please refill in the Armory.`,
                    type: 'AMMO_REQUIRED'
                });
            }

            const ammoToLoad = ammoItem.amount;
            
            // Atomically clear ammo and get game start data
            await User.updateOne(
                { _id: userId, "inventory.items.itemKey": ammoType },
                { $set: { "inventory.items.$.amount": 0 } }
            );

            const game = birdShootingEngine.createGame(socket.user.id, level, weaponStats);
            game.ammo = ammoToLoad;
            game.ammoType = ammoType;

            // Start Session Tracking (Initial 5 minutes)
            const INITIAL_INTERVAL_MIN = 5;
            const durationMs = INITIAL_INTERVAL_MIN * 60 * 1000;
            
            const sessionTimer = setTimeout(async () => {
                await chargeUserSession(socket.user.id, io, true);
            }, durationMs);

            activeSessions.set(socket.user.id, {
                startTime: Date.now(),
                lastChargeTime: Date.now(),
                socketId: socket.id,
                timer: sessionTimer,
                totalCharged: SESSION_CHARGE_AMOUNT,
                matchId: game.id,
                intervalMinutes: INITIAL_INTERVAL_MIN,
                autoRecharge: false
            });

            await Transaction.create({
                userId: updatedUser._id,
                type: 'game_bet',
                amount: totalDeduction,
                currency: 'TRX',
                description: `Bird Shooting Entry + Session Charge - Match: ${game.id}`,
                status: 'completed'
            });

            await BirdMatch.create({
                userId: updatedUser._id,
                matchId: game.id,
                level,
                entryFee,
                seed: game.seed,
                weaponKey: weaponKey,
                status: 'active'
            });
            
            socket.join(game.id);
            socket.emit('bird_shoot:session', { 
                ...game, 
                sessionCharged: SESSION_CHARGE_AMOUNT,
                nextChargeTime: Date.now() + durationMs,
                intervalMinutes: INITIAL_INTERVAL_MIN
            });
            socket.emit('balance_update', { 
                mainBalance: updatedUser.wallet.mainBalance, 
                sessionCharged: SESSION_CHARGE_AMOUNT,
                nextChargeTime: Date.now() + durationMs,
                intervalMinutes: INITIAL_INTERVAL_MIN
            });
        } catch (err) {
            console.error('Join Error:', err);
            socket.emit('error', { message: 'Server error joining match' });
        }
    });

    socket.on('bird_shoot:shoot', (data) => {
        if (!data?.gameId) return;
        const game = birdShootingEngine.activeGames.get(data.gameId);
        
        // Authoritative Check: Ensure user matches the game and has ammo
        if (game && game.userId === socket.user.id && game.status === 'active' && game.ammo > 0) {
            game.ammo--;
            const result = birdShootingEngine.validateShot(data.gameId, data.shotData);
            socket.emit('bird_shoot:shot_result', { ...result, remainingAmmo: game.ammo });
        } else {
            socket.emit('error', { 
                message: game?.ammo <= 0 ? 'Out of ammo!' : 'Unauthorized or invalid game state',
                type: 'SHOOT_ERROR'
            });
        }
    });

    socket.on('bird_shoot:extend_session', async (data) => {
        const userId = socket.user.id;
        const session = activeSessions.get(userId);
        
        if (!session) {
            return socket.emit('error', { message: 'No active session found' });
        }

        if (data && data.autoRecharge !== undefined) {
            session.autoRecharge = !!data.autoRecharge;
        }

        // Attempt manual charge
        const success = await chargeUserSession(userId, io, false);
        if (!success) {
            socket.emit('bird_shoot:extend_failed', { message: 'Insufficient balance to extend session' });
        }
    });

    const finalizeMatch = async (gameId, userId) => {
        const game = birdShootingEngine.endGame(gameId);
        
        // Clear Session Timer
        const session = activeSessions.get(userId);
        if (session) {
            if (session.timer) clearTimeout(session.timer);
            session.endTime = Date.now();
            console.log(`📊 Match ${gameId} finalized. Duration: ${Math.round((session.endTime - session.startTime)/1000)}s. Total Charged: ${session.totalCharged} TRX`);
        }

        if (game) {
            try {
                const reward = Math.floor(game.score / 5); 
                
                // Return unused ammo and apply reward atomically
                const updateQuery = { $inc: {} };
                if (reward > 0) {
                    updateQuery.$inc["wallet.mainBalance"] = reward;
                    updateQuery.$inc["wallet.totalWon"] = reward;
                }

                const user = await User.findById(userId);
                if (user && game.ammo > 0 && game.ammoType) {
                    // Mongoose array manipulation for atomic ammo return
                    await User.updateOne(
                        { _id: userId, "inventory.items.itemKey": game.ammoType },
                        { $inc: { "inventory.items.$.amount": game.ammo } }
                    );
                }

                let updatedUser = user;
                if (reward > 0) {
                    updatedUser = await User.findByIdAndUpdate(userId, updateQuery, { new: true });
                    
                    await Transaction.create({
                        userId: user._id,
                        type: 'game_win',
                        amount: reward,
                        currency: 'TRX',
                        description: `Sniper 3D Reward`,
                        status: 'completed'
                    });
                }

                await BirdMatch.findOneAndUpdate(
                    { matchId: gameId },
                    { 
                        score: game.score, 
                        reward, 
                        status: 'completed', 
                        endedAt: new Date(),
                        metadata: {
                            inTime: session?.startTime,
                            outTime: session?.endTime,
                            totalCharged: session?.totalCharged
                        }
                    }
                );
                
                activeSessions.delete(userId);
                return { game, reward, newBalance: updatedUser?.wallet?.mainBalance || user.wallet.mainBalance };
            } catch (err) {
                console.error('Finalization error:', err);
            }
        }
        activeSessions.delete(userId);
        return null;
    };

    socket.on('bird_shoot:end', async (data) => {
        if (!data?.gameId) return;
        const result = await finalizeMatch(data.gameId, socket.user.id);
        if (result) {
            socket.emit('bird_shoot:game_over', {
                ...result.game,
                reward: result.reward,
                newBalance: result.newBalance
            });
        }
    });

    socket.on('disconnect', async () => {
        console.log(`🔌 Socket Disconnected: ${socket.user?.username}`);
        if (socket.user?.id) {
            const session = activeSessions.get(socket.user.id);
            if (session) {
                // Auto-finalize if disconnected during active match to return ammo
                await finalizeMatch(session.matchId, socket.user.id);
            }
        }
    });
});

// Production Static Serving
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get(/(.*)/, (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
    }
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Production Server running on port ${PORT}`);
});