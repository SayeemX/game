import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { Target, Timer, Trophy, Zap, Crosshair, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { updateBalance } from '../../redux/slices/userSlice';

const BirdShooting = () => {
  const [gameState, setGameState] = useState({
    status: 'idle', // idle, playing, ended
    score: 0,
    birdsHit: 0,
    birdsTotal: 10,
    timeLeft: 60,
    level: 1,
    birds: [],
    shots: [],
    gameId: null
  });

  const [crosshair, setCrosshair] = useState({ x: 50, y: 50 });
  const gameContainerRef = useRef(null);
  const timerRef = useRef(null);
  const moveRef = useRef(null);
  const dispatch = useDispatch();
  const { wallet } = useSelector(state => state.user);
  const balance = wallet?.mainBalance || 0;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (moveRef.current) clearInterval(moveRef.current);
    };
  }, []);

  const generateBirds = (count, level) => {
    const birds = [];
    for (let i = 0; i < count; i++) {
      birds.push({
        id: i,
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
        size: 40 + Math.random() * 20,
        speed: 0.2 + (level * 0.1) + Math.random() * 0.3,
        direction: Math.random() * 360,
        points: 10 + Math.floor(Math.random() * level * 5),
        isHit: false
      });
    }
    return birds;
  };

  const startGame = async (level = 1) => {
    try {
      const response = await api.post('/games/bird/start', { level });
      const { gameId, birdsTotal, timeLimit } = response.data;

      // Update local wallet balance immediately
      dispatch(updateBalance({ amount: -10 }));

      setGameState({
        status: 'playing',
        score: 0,
        birdsHit: 0,
        birdsTotal: birdsTotal,
        timeLeft: timeLimit / 1000,
        level,
        birds: generateBirds(birdsTotal, level),
        shots: [],
        gameId
      });

      // Start timer
      timerRef.current = setInterval(() => {
        setGameState(prev => {
          if (prev.timeLeft <= 1) {
            clearInterval(timerRef.current);
            clearInterval(moveRef.current);
            endGame(prev.gameId);
            return { ...prev, timeLeft: 0 };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);

      // Start movement
      moveRef.current = setInterval(() => {
        setGameState(prev => {
          if (prev.status !== 'playing') return prev;
          return {
            ...prev,
            birds: prev.birds.map(bird => {
              if (bird.isHit) return bird;
              
              const radian = (bird.direction * Math.PI) / 180;
              let newX = bird.x + Math.cos(radian) * bird.speed;
              let newY = bird.y + Math.sin(radian) * bird.speed;
              
              let newDirection = bird.direction;
              if (newX < 5 || newX > 95) newDirection = 180 - newDirection;
              if (newY < 15 || newY > 85) newDirection = -newDirection;
              
              return {
                ...bird,
                x: Math.max(5, Math.min(95, newX)),
                y: Math.max(15, Math.min(85, newY)),
                direction: newDirection
              };
            })
          };
        });
      }, 30);

    } catch (error) {
      alert(error.response?.data?.error || 'Failed to start game');
    }
  };

  const handleShot = async (e) => {
    if (gameState.status !== 'playing') return;

    const rect = gameContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    try {
      const response = await api.post('/games/bird/shoot', {
        gameId: gameState.gameId,
        x,
        y
      });

      const { hit, points, totalScore, birdsRemaining, gameComplete } = response.data;

      setGameState(prev => ({
        ...prev,
        score: totalScore,
        birdsHit: prev.birdsTotal - birdsRemaining,
        birds: prev.birds.map(bird => {
           // Simple client-side hit detection visual
           const distance = Math.sqrt(Math.pow(x - bird.x, 2) + Math.pow(y - bird.y, 2));
           if (distance < bird.size / 5) { // rough match
             return { ...bird, isHit: true };
           }
           return bird;
        }),
        shots: [...prev.shots, { x, y, hit }]
      }));

      if (gameComplete) {
        clearInterval(timerRef.current);
        clearInterval(moveRef.current);
        endGame(gameState.gameId);
      }
    } catch (error) {
      console.error('Shot failed:', error);
    }
  };

  const endGame = async (gameId) => {
    try {
      const response = await api.post('/games/bird/end', { gameId });
      const { finalScore, reward, newBalance } = response.data;
      
      setGameState(prev => ({
        ...prev,
        status: 'ended',
        score: finalScore
      }));

      if (reward > 0) {
          dispatch(updateBalance({ amount: reward }));
      }
    } catch (error) {
      console.error('Failed to end game:', error);
    }
  };

  const handleMouseMove = (e) => {
    if (!gameContainerRef.current) return;
    const rect = gameContainerRef.current.getBoundingClientRect();
    setCrosshair({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    });
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-500">Bird Shooting</h1>
            <p className="text-gray-400 text-sm">Precision is key!</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl text-center">
                <div className="text-[10px] text-gray-500 uppercase font-bold">Balance</div>
                <div className="text-xl font-bold text-green-500">${balance}</div>
             </div>
             <div className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl text-center">
                <div className="text-[10px] text-gray-500 uppercase font-bold">Time Left</div>
                <div className={`text-xl font-bold ${gameState.timeLeft < 10 ? 'text-red-500' : 'text-yellow-500'}`}>
                    {gameState.timeLeft}s
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Canvas */}
          <div className="lg:col-span-3">
            <div 
              ref={gameContainerRef}
              className="relative bg-gray-900 rounded-3xl border-4 border-gray-800 h-[500px] overflow-hidden cursor-none shadow-2xl"
              onMouseMove={handleMouseMove}
              onClick={handleShot}
            >
              {/* Background Elements */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                 <div className="absolute top-20 left-40 w-40 h-40 bg-green-500 rounded-full blur-[100px]"></div>
                 <div className="absolute bottom-20 right-40 w-40 h-40 bg-blue-500 rounded-full blur-[100px]"></div>
              </div>

              {/* Crosshair */}
              {gameState.status === 'playing' && (
                <div 
                  className="absolute w-12 h-12 pointer-events-none z-50 transition-transform duration-75"
                  style={{
                    left: `${crosshair.x}%`,
                    top: `${crosshair.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <Crosshair className="w-full h-full text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                </div>
              )}

              {/* Birds */}
              {gameState.birds.map(bird => (
                <motion.div
                  key={bird.id}
                  className={`absolute rounded-full flex items-center justify-center transition-opacity duration-300 ${bird.isHit ? 'opacity-0' : 'opacity-100'}`}
                  style={{
                    left: `${bird.x}%`,
                    top: `${bird.y}%`,
                    width: `${bird.size}px`,
                    height: `${bird.size}px`,
                    transform: 'translate(-50%, -50%)',
                    background: `radial-gradient(circle, #facc15 0%, #ca8a04 100%)`,
                    boxShadow: '0 0 15px rgba(250,204,21,0.3)'
                  }}
                >
                   <Target className="w-1/2 h-1/2 text-white/50" />
                </motion.div>
              ))}

              {/* Overlays */}
              {gameState.status === 'idle' && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40">
                  <div className="text-center p-8 max-w-md">
                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Target className="w-12 h-12 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-black mb-2">READY TO SHOOT?</h2>
                    <p className="text-gray-400 mb-8">Entry fee: <span className="text-white font-bold">$10</span>. Earn points for every bird hit!</p>
                    <button
                      onClick={() => startGame(1)}
                      className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black text-xl rounded-2xl transition-all shadow-lg shadow-green-900/40"
                    >
                      START GAME
                    </button>
                  </div>
                </div>
              )}

              {gameState.status === 'ended' && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-40">
                  <div className="text-center p-8 bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl">
                    <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold mb-1">MISSION COMPLETE</h2>
                    <div className="text-5xl font-black text-green-500 mb-4">${gameState.score}</div>
                    <div className="flex justify-center gap-8 mb-8 text-gray-400 text-sm">
                        <div>
                            <div className="font-bold text-white text-lg">{gameState.birdsHit}</div>
                            BIRDS HIT
                        </div>
                        <div>
                            <div className="font-bold text-white text-lg">
                                {gameState.shots.length > 0 ? Math.round((gameState.birdsHit / gameState.shots.length) * 100) : 0}%
                            </div>
                            ACCURACY
                        </div>
                    </div>
                    <button
                      onClick={() => setGameState(prev => ({ ...prev, status: 'idle' }))}
                      className="px-12 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      TRY AGAIN
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats & Info */}
          <div className="space-y-6">
             <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" /> Current Stats
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Level</span>
                        <span className="font-mono font-bold">{gameState.level}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Score</span>
                        <span className="font-mono font-bold text-green-500">{gameState.score}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Hits</span>
                        <span className="font-mono font-bold">{gameState.birdsHit} / {gameState.birdsTotal}</span>
                    </div>
                </div>
             </div>

             <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                <h3 className="font-bold text-sm text-gray-400 mb-4">HOW TO PLAY</h3>
                <ul className="space-y-3 text-xs text-gray-500">
                    <li className="flex gap-2">
                        <span className="text-green-500 font-bold">01.</span>
                        <span>Use your mouse to aim at the moving targets.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-500 font-bold">02.</span>
                        <span>Click to shoot. Accuracy and speed give higher scores.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-500 font-bold">03.</span>
                        <span>Complete the level before time runs out.</span>
                    </li>
                </ul>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BirdShooting;
