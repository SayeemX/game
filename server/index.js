const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');

const User = require('./models/User');
const Transaction = require('./models/Transaction');
const BirdMatch = require('./models/BirdMatch');
const Game = require('./models/Game');
const birdShootingEngine = require('./services/BirdShootingEngine');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://game.github.io',
  'https://gamex-th2n.onrender.com',
  process.env.CLIENT_URL
].filter(Boolean);

// birdShootingEngine is already an instance
// No game loop needed for this request-response engine style

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, 
}));
app.use(cors({
  origin: function(origin, callback) {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      return callback(new Error('CORS policy violation'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in environment variables');
  process.exit(1);
}
mongoose.connect(MONGO_URI)
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/spin', require('./routes/spin'));
app.use('/api/games', require('./routes/games'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/redeem', require('./routes/redeem'));
app.use('/api/shop', require('./routes/shop'));

const jwt = require('jsonwebtoken');

// Socket.io Authentication Middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if (!token) return next(new Error('Authentication error'));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.user?.id || decoded.id;
        const user = await User.findById(userId).select('-password');
        
        if (!user) return next(new Error('User not found'));
        
        socket.user = user;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user?.username} (${socket.id})`);

    // Bird Shooting Game Events
    socket.on('bird_shoot:join', async (data) => {
        try {
            const level = data?.level || 1;
            const user = await User.findById(socket.user.id);
            
            // Fetch Entry Fee from Admin Config
            const gameConfig = await Game.findOne();
            const baseFee = gameConfig?.birdShooting?.entryFee || 10;
            const entryFee = baseFee * level;

            if (user.wallet.mainBalance < entryFee) {
                return socket.emit('error', { message: 'Insufficient TRX balance' });
            }

            // Deduct Fee
            user.wallet.mainBalance -= entryFee;
            await user.save();

            // Create Game
            const weaponKey = user.inventory.equippedWeapon || 'basic_bow';
            const weaponStats = { key: weaponKey, damage: 1, perks: { windResistance: 0.1 } };
            const game = birdShootingEngine.createGame(socket.user.id, level, weaponStats);

            // Create Match Record
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
            
            // Initial balance update
            socket.emit('balance_update', { mainBalance: user.wallet.mainBalance });
        } catch (err) {
            console.error(err);
            socket.emit('error', { message: 'Failed to join game' });
        }
    });

    socket.on('bird_shoot:shoot', async (data) => {
        if (!data || !data.gameId) return;
        
        const result = birdShootingEngine.validateShot(data.gameId, data.shotData);
        socket.emit('bird_shoot:shot_result', result);
        
        if (result && result.hit && result.alive === false) {
             if (result.score > 25 || result.combo > 5) {
                 io.emit('live_win', {
                     username: socket.user.username,
                     game: 'Sniper',
                     amount: result.score / 5, 
                     multiplier: result.combo
                 });
             }
        }
    });

    socket.on('bird_shoot:end', async (data) => {
        if (!data || !data.gameId) return;
        const game = birdShootingEngine.endGame(data.gameId);
        if (game) {
            try {
                const reward = Math.floor(game.score / 5); 
                const user = await User.findById(socket.user.id);
                
                if (reward > 0) {
                    user.wallet.mainBalance += reward;
                    user.wallet.totalWon += reward;
                    await user.save();
                    
                    // Log Transaction
                    await Transaction.create({
                        userId: user._id,
                        type: 'game_win',
                        amount: reward,
                        currency: 'TRX',
                        description: `GameX Sniper Reward - Score: ${game.score}`,
                        status: 'completed'
                    });
                }

                await BirdMatch.findOneAndUpdate(
                    { matchId: data.gameId },
                    { 
                        score: game.score, 
                        reward, 
                        status: 'completed', 
                        endedAt: new Date(),
                        stats: { shots: game.shots, hits: game.hits, accuracy: (game.hits / (game.shots || 1)) * 100 }
                    }
                );
                
                socket.emit('bird_shoot:game_over', {
                    ...game,
                    reward,
                    newBalance: user.wallet.mainBalance
                });
                
                if (reward > 5) {
                    io.emit('live_win', {
                        username: socket.user.username,
                        game: 'Sniper',
                        amount: reward,
                        multiplier: (game.hits / (game.shots || 1) * 10).toFixed(1)
                    });
                }
            } catch (err) {
                console.error('Finalization error:', err);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Production Serving
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // SPA Fallback: Serve index.html for all non-API GET requests
  app.get(/^(?!\/api).+/, (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
    } else {
      res.status(404).json({ error: 'API route not found' });
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
