import React, { useState, useEffect, useRef, useContext } from 'react';
import Phaser from 'phaser';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { Target, Timer, Trophy, Zap, Crosshair, AlertCircle, ShieldCheck, Gamepad2 } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { updateWallet } from '../../redux/slices/userSlice';
import SniperScene from '../../scenes/SniperScene';

const BirdShooting = () => {
  const { socket } = useContext(AuthContext);
  const [gameState, setGameState] = useState('lobby'); // lobby, playing, ended
  const [matchData, setMatchData] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [currentCombo, setCurrentCombo] = useState(0);

  const gameContainerRef = useRef(null);
  const dispatch = useDispatch();
  const { wallet } = useSelector(state => state.user);

  // Socket Listeners
  useEffect(() => {
    if (!socket) return;

    const handleSession = (data) => {
        setMatchData(data);
        setGameState('playing');
        setLoading(false);
    };

    const handleShotResult = (res) => {
        if (res.valid) {
            setCurrentScore(res.score);
            setCurrentCombo(res.combo);
        }
    };

    const handleGameOver = (data) => {
        setFinalResult(data);
        setGameState('ended');
        dispatch(updateWallet({ mainBalance: data.newBalance }));
    };

    const handleBalanceUpdate = (data) => {
        dispatch(updateWallet({ mainBalance: data.mainBalance }));
    };

    socket.on('bird_shoot:session', handleSession);
    socket.on('bird_shoot:shot_result', handleShotResult);
    socket.on('bird_shoot:game_over', handleGameOver);
    socket.on('balance_update', handleBalanceUpdate);

    return () => {
      socket.off('bird_shoot:session', handleSession);
      socket.off('bird_shoot:shot_result', handleShotResult);
      socket.off('bird_shoot:game_over', handleGameOver);
      socket.off('balance_update', handleBalanceUpdate);
    };
  }, [socket, dispatch]);

  useEffect(() => {
    if (gameState === 'playing' && matchData && socket) {
      const config = {
        type: Phaser.AUTO,
        parent: gameContainerRef.current,
        width: 800,
        height: 600,
        physics: {
          default: 'arcade',
          arcade: { gravity: { y: 0 }, debug: false }
        },
        scene: SniperScene,
        backgroundColor: '#0f212e'
      };

      const game = new Phaser.Game(config);

      game.scene.start('SniperScene', {
        socket, // Pass socket to scene
        gameId: matchData.id,
        wind: matchData.wind,
        birds: matchData.birds,
        weapon: matchData.weapon
      });

      return () => {
        game.destroy(true);
      };
    }
  }, [gameState, matchData, socket]);

  const startNewMatch = (level = 1) => {
    if (!socket) {
        setError("Connection lost. Please refresh.");
        return;
    }
    setLoading(true);
    setError(null);
    setCurrentScore(0);
    setCurrentCombo(0);
    
    socket.emit('bird_shoot:join', { 
        level, 
        weapon: { damage: 1, name: 'Elite Bow', type: 'bow' } 
    });
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-4 font-sans">
      <div className="max-w-6xl mx-auto pt-12">
        
        {/* Lobby State */}
        {gameState === 'lobby' && (
          <div className="flex flex-col items-center justify-center py-12">
            <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} className="text-center space-y-10">
                <div className="relative inline-block">
                    <div className="w-24 h-24 bg-[#3bc117]/10 rounded-3xl flex items-center justify-center mx-auto border border-[#3bc117]/20 shadow-[0_0_50px_rgba(59,193,23,0.1)]">
                        <Target className="w-12 h-12 text-[#3bc117]" />
                    </div>
                    <Zap className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
                </div>

                <div>
                    <h1 className="text-6xl font-black uppercase tracking-tighter italic">Game<span className="text-[#3bc117]">X</span> Sniper</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-xs mt-2">Elite Precision Hunting Simulation</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    {[1, 2, 3].map(level => (
                        <button 
                            key={level}
                            onClick={() => startNewMatch(level)}
                            disabled={loading}
                            className="bg-[#1a2c38] border-2 border-gray-800 hover:border-[#3bc117] p-8 rounded-[2.5rem] transition-all group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[#3bc117]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="text-[10px] font-black text-gray-500 block mb-2 uppercase tracking-widest relative z-10">Stage 0{level}</span>
                            <span className="text-2xl font-black block mb-6 relative z-10">{level === 1 ? 'WOODS' : level === 2 ? 'MOUNTAINS' : 'LEGENDARY'}</span>
                            <div className="py-3 px-6 bg-[#3bc117] text-black rounded-2xl font-black text-sm uppercase relative z-10 shadow-lg shadow-[#3bc117]/20 group-hover:scale-105 transition-transform">
                                Entry {level * 10} TRX
                            </div>
                        </button>
                    ))}
                </div>
                {error && (
                    <div className="flex items-center justify-center gap-2 text-red-500 font-black uppercase text-[10px] tracking-widest bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}
            </motion.div>
          </div>
        )}

        {/* Playing State */}
        {gameState === 'playing' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#1a2c38] p-6 rounded-[2rem] border border-gray-800 flex items-center justify-between">
                    <div>
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">TRX Balance</p>
                        <p className="text-2xl font-black text-[#3bc117]">{wallet.mainBalance.toFixed(2)}</p>
                    </div>
                    <Gamepad2 className="w-8 h-8 text-gray-700" />
                </div>
                <div className="bg-[#1a2c38] p-6 rounded-[2rem] border border-gray-800 flex items-center justify-between">
                    <div>
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Current Score</p>
                        <p className="text-2xl font-black text-white">{currentScore}</p>
                    </div>
                    <div className="px-3 py-1 bg-[#3bc117]/10 border border-[#3bc117]/20 rounded-lg text-[#3bc117] font-black text-xs">
                        X{currentCombo} COMBO
                    </div>
                </div>
                <div className="bg-[#1a2c38] p-6 rounded-[2rem] border border-[#3bc117]/20 flex items-center justify-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-[#3bc117]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#3bc117]">Provably Fair Authority Active</span>
                </div>
            </div>
            <div 
                ref={gameContainerRef} 
                className="w-full aspect-[4/3] max-h-[600px] bg-[#0f212e] rounded-[3rem] overflow-hidden border-[12px] border-[#1a2c38] shadow-[0_0_100px_rgba(0,0,0,0.5)] relative cursor-crosshair"
            />
          </div>
        )}

        {/* Results State */}
        <AnimatePresence>
            {gameState === 'ended' && finalResult && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
                <motion.div initial={{scale:0.9, y:20}} animate={{scale:1, y:0}} className="bg-[#1a2c38] border-4 border-[#3bc117] p-12 rounded-[4rem] text-center max-w-lg w-full shadow-[0_0_150px_rgba(59,193,23,0.2)]">
                    <Trophy className="w-20 h-20 text-[#3bc117] mx-auto mb-6 drop-shadow-[0_0_20px_rgba(59,193,23,0.5)]" />
                    <h2 className="text-5xl font-black uppercase tracking-tighter mb-2 italic">Extraction Complete</h2>
                    <div className="text-6xl font-black text-white mb-8">{finalResult.reward.toFixed(2)} <span className="text-[#3bc117] text-2xl">TRX</span></div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="bg-black/20 p-6 rounded-3xl border border-gray-800">
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Final Score</p>
                            <p className="text-2xl font-black text-white">{finalResult.score}</p>
                        </div>
                        <div className="bg-black/20 p-6 rounded-3xl border border-gray-800">
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Arena Balance</p>
                            <p className="text-2xl font-black text-[#3bc117]">{finalResult.newBalance.toFixed(2)}</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => setGameState('lobby')}
                        className="w-full py-6 bg-[#3bc117] hover:bg-[#45d61d] text-black font-black rounded-2xl uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#3bc117]/20 active:scale-95"
                    >
                        Return to Briefing
                    </button>
                </motion.div>
            </motion.div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default BirdShooting;
