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

// Socket.io Setup with dynamic CORS
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Production Security & Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Set to true and configure if using specialized CDNs
}));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://gamex-th2n.onrender.com',
  process.env.CLIENT_URL,
  process.env.ADDITIONAL_ORIGINS
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or same-origin static files)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    } else {
      // Check if it's a subdomain or variations
      const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed));
      if (isAllowed) return callback(null, true);
      
      console.error(`CORS Blocked: ${origin}`);
      return callback(new Error('CORS policy violation'), false);
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

io.on('connection', (socket) => {
    console.log(`📡 Socket Connected: ${socket.user?.username}`);

    socket.on('bird_shoot:join', async (data) => {
        try {
            const level = data?.level || 1;
            const user = await User.findById(socket.user.id);
            
            const gameConfig = await Game.findOne();
            const baseFee = gameConfig?.birdShooting?.entryFee || 10;
            const entryFee = baseFee * level;

            if (user.wallet.mainBalance < entryFee) {
                return socket.emit('error', { message: 'Insufficient balance' });
            }

            user.wallet.mainBalance -= entryFee;
            
            const weaponKey = user.inventory.equippedWeapon || 'basic_bow';
            let weaponStats = { key: 'basic_bow', type: 'bow', damage: 1, perks: { windResistance: 0.1 } };
            
            try {
                const weapon = await BirdWeapon.findOne({ key: weaponKey });
                if (weapon) weaponStats = weapon.toObject();
            } catch(e) { console.error("Weapon lookup failed, using defaults"); }

            // Ammo Check & Deduction
            const ammoType = weaponStats.type === 'bow' ? 'arrow' : 'pellet';
            if (!user.inventory.items) user.inventory.items = [];
            const ammoItem = user.inventory.items.find(i => i.itemKey === ammoType);
            const ammoRequired = 20;

            if (!ammoItem || ammoItem.amount < ammoRequired) {
                return socket.emit('error', { 
                    message: `Insufficient ${ammoType}s. You need ${ammoRequired} to start.`,
                    type: 'AMMO_REQUIRED'
                });
            }
            ammoItem.amount -= ammoRequired;

            const game = birdShootingEngine.createGame(socket.user.id, level, weaponStats);
            game.ammo = ammoRequired;

            await user.save();
            await BirdMatch.create({
                userId: user._id,
                matchId: game.id,
                level,
                entryFee,
                seed: game.seed,
                weaponKey: weaponKey,
                status: 'active'
            });
            
            socket.join(game.id);
            socket.emit('bird_shoot:session', game);
            socket.emit('balance_update', { mainBalance: user.wallet.mainBalance });
        } catch (err) {
            console.error('Join Error:', err);
            socket.emit('error', { message: 'Server error joining match' });
        }
    });

    socket.on('bird_shoot:shoot', (data) => {
        if (!data?.gameId) return;
        const result = birdShootingEngine.validateShot(data.gameId, data.shotData);
        socket.emit('bird_shoot:shot_result', result);
    });

    socket.on('bird_shoot:end', async (data) => {
        if (!data?.gameId) return;
        const game = birdShootingEngine.endGame(data.gameId);
        if (game) {
            try {
                const reward = Math.floor(game.score / 5); 
                const user = await User.findById(socket.user.id);
                
                if (reward > 0) {
                    user.wallet.mainBalance += reward;
                    user.wallet.totalWon += reward;
                    await user.save();
                    
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
                    { matchId: data.gameId },
                    { 
                        score: game.score, 
                        reward, 
                        status: 'completed', 
                        endedAt: new Date()
                    }
                );
                
                socket.emit('bird_shoot:game_over', {
                    ...game,
                    reward,
                    newBalance: user.wallet.mainBalance
                });
            } catch (err) {
                console.error('Finalization error:', err);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Socket Disconnected: ${socket.id}`);
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