import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { awardPrize, updateBalance } from '../../redux/slices/userSlice';
import api from '../../services/api';
import Confetti from 'react-confetti';
import { 
  Trophy, 
  Coins, 
  Gift, 
  Zap, 
  Sparkles,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy
} from 'lucide-react';

const SpinWheel = () => {
  const dispatch = useDispatch();
  const { wallet } = useSelector(state => state.user);
  
  // Game State
  const [prizes, setPrizes] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState('');
  
  // Provably Fair State
  const [clientSeed, setClientSeed] = useState('');
  const [serverSeedHash, setServerSeedHash] = useState('');
  const [nonce, setNonce] = useState(0);
  const [lastHash, setLastHash] = useState('');
  const [showFairness, setShowFairness] = useState(false);
  const [isRotatingSeed, setIsRotatingSeed] = useState(false);

  const wheelRef = useRef(null);
  const spins = wallet?.spinCredits || 0;
  const balance = wallet?.mainBalance || 0;

  // Initialize Game
  useEffect(() => {
    const initGame = async () => {
      try {
        const { data } = await api.post('/spin/initialize');
        if (data.success) {
            setPrizes(data.prizes);
            setClientSeed(data.clientSeed);
            setNonce(data.nonce);
            setServerSeedHash(data.serverSeedHash);
        }
      } catch (err) {
        console.error("Init failed", err);
        setError("Failed to load game configuration");
      }
    };
    initGame();
  }, []);

  const segmentAngle = prizes.length > 0 ? 360 / prizes.length : 0;

  const handleSpin = async () => {
    if (isSpinning || spins < 1) {
      setError(spins < 1 ? "Not enough spins!" : "Already spinning!");
      return;
    }

    setIsSpinning(true);
    setError('');
    setResult(null);

    try {
      // Optimistic update for smooth UI
      // In a real app, maybe wait for response before starting spin, 
      // but here we want instant feedback. We'll start a generic spin first? 
      // Actually, waiting for response is safer for result calculation.
      
      const { data } = await api.post('/spin/play', { 
        bet: 1,
        clientSeed: clientSeed 
      });

      if (!data.success) throw new Error("Spin failed");

      const { prize, result: pfResult } = data;

      // Update PF State immediately
      setLastHash(pfResult.hash);
      setNonce(pfResult.nonce + 1); // Increment local nonce display

      // Find winning index
      const winningIndex = prizes.findIndex(p => p.id === prize.id);
      
      // Calculate rotation
      // Align 0 deg (top) to the winning segment center
      // Each segment is segmentAngle wide.
      // Index 0 is from 0 to segmentAngle. Center is segmentAngle/2.
      // Wait, let's check visual rendering.
      // Visual: Rotation 0 means index 0 is at 0 degrees (12 o'clock)?
      // If we render segments starting from 0 deg clockwise:
      // Index 0: 0 to 30 deg. Center at 15 deg.
      // Pointer is at Top (0 deg).
      // To get Index 0 center to Top, we need to rotate: -15 deg.
      // To get Index i center to Top, we rotate: -(i * angle + angle/2)
      
      const anglePerSegment = 360 / prizes.length;
      const indexCenterAngle = (winningIndex * anglePerSegment) + (anglePerSegment / 2);
      
      // We want this angle to be at 0 (top)
      // So target rotation should be -indexCenterAngle
      // Add extra spins (e.g. 5 full rotations = 1800 deg)
      // We need to keep adding to current 'rotation' to spin smoothly in one direction
      const extraSpins = 5 * 360; 
      
      // Current rotation modulo 360 is where we are.
      // We want to end at a specific angle relative to 0.
      // Let's just keep adding positive rotation.
      // Target visual angle: 360 - indexCenterAngle (if rotating clockwise to bring it to top)
      
      const targetVisualAngle = 360 - indexCenterAngle;
      
      // Ensure we always spin forward significantly
      const currentRotation = rotation;
      const baseNextRotation = currentRotation + extraSpins;
      
      // Adjust to land on target
      // We want (baseNextRotation + adjustment) % 360 === targetVisualAngle
      const remainder = baseNextRotation % 360;
      const adjustment = targetVisualAngle - remainder;
      
      const finalRotation = baseNextRotation + adjustment + (adjustment < 0 ? 360 : 0);

      setRotation(finalRotation);

      // Wait for animation
      setTimeout(() => {
        setResult(prize);
        setIsSpinning(false);
        
        if (prize.tier === 'legendary' || prize.value >= 500) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }

        // Update Redux
        dispatch(awardPrize(prize));
        dispatch(updateBalance({ 
          type: prize.type === 'balance' ? 'mainBalance' : (prize.type === 'bonus' ? 'bonusBalance' : 'spinCredits'), 
          amount: prize.value 
        }));

      }, 4500);

    } catch (err) {
      setError(err.response?.data?.error || 'Spin failed');
      setIsSpinning(false);
    }
  };

  const handleRotateSeed = async () => {
    setIsRotatingSeed(true);
    try {
        const { data } = await api.post('/spin/rotate-seed');
        if (data.success) {
            setServerSeedHash(data.newServerSeedHash);
            setNonce(0);
            // Optionally show the old seed or just notify
        }
    } catch (err) {
        setError("Failed to rotate seed");
    } finally {
        setIsRotatingSeed(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

  const getTierColor = (tier) => {
    switch(tier) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'rare': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      default: return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    }
  };

  const getIcon = (type) => {
      switch(type) {
          case 'bonus': return <Gift className="w-4 h-4" />;
          case 'spins': return <Zap className="w-4 h-4" />;
          case 'balance': return <Coins className="w-4 h-4" />;
          case 'crypto': return <Sparkles className="w-4 h-4" />;
          case 'jackpot': return <Trophy className="w-4 h-4" />;
          default: return <AlertCircle className="w-4 h-4" />;
      }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-4 font-sans">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.1}
          colors={['#FFD700', '#FFA500', '#FF6347', '#32CD32']}
        />
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto pt-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
              <Gift className="w-3 h-3" />
              SayeemX GIFT
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
              Fortune Spin
            </h1>
          </div>
          <div className="flex gap-4">
            <div className="bg-[#161b22] px-6 py-4 rounded-2xl border border-gray-800 flex flex-col items-end min-w-[140px]">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Balance</div>
              <div className="text-2xl font-black text-green-400 font-mono tracking-tight">${balance.toFixed(2)}</div>
            </div>
            <div className="bg-[#161b22] px-6 py-4 rounded-2xl border border-gray-800 flex flex-col items-end min-w-[140px]">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Spins</div>
              <div className="text-2xl font-black text-yellow-500 font-mono tracking-tight">{spins}</div>
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* Wheel Section */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center bg-[#161b22] rounded-3xl border border-gray-800 p-8 md:p-12 relative overflow-hidden">
             {/* Background glow */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="relative z-10">
              {/* Pointer */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20 drop-shadow-xl">
                <div className="w-12 h-12 bg-gradient-to-b from-yellow-400 to-yellow-600 clip-path-polygon-[50%_100%,0%_0%,100%_0%]"></div>
              </div>
              
              {/* Wheel */}
              <motion.div
                ref={wheelRef}
                className="relative w-[320px] h-[320px] sm:w-[500px] sm:h-[500px] rounded-full border-[16px] border-[#0d1117] shadow-[0_0_60px_rgba(0,0,0,0.5)] overflow-hidden"
                animate={{ rotate: rotation }}
                transition={{
                  duration: 4.5,
                  ease: [0.15, 0.85, 0.35, 1.05] // Custom bezier for realistic heavy wheel feel
                }}
                style={{
                  background: prizes.length > 0 ? `conic-gradient(${prizes
                    .map((seg, i) => `${seg.color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`)
                    .join(', ')})` : '#333'
                }}
              >
                {/* Center Hub */}
                <div className="absolute inset-[42%] bg-[#161b22] rounded-full border-[8px] border-[#0d1117] z-20 flex items-center justify-center shadow-2xl">
                   <div className="text-center">
                    <div className="text-2xl font-black text-white tracking-tighter leading-none">SYM</div>
                    <div className="text-[10px] text-yellow-500 font-bold tracking-[0.3em] mt-1">GIFT</div>
                  </div>
                </div>

                {/* Segments */}
                {prizes.map((prize, index) => {
                  const angle = index * segmentAngle + segmentAngle / 2;
                  return (
                    <div
                      key={prize.id}
                      className="absolute top-0 left-1/2 w-1 h-[50%] origin-bottom flex justify-center pt-6"
                      style={{
                        transform: `translateX(-50%) rotate(${angle}deg)`,
                      }}
                    >
                      <div className="flex flex-col items-center transform rotate-0 origin-center">
                         <div className="text-white drop-shadow-md mb-1 transform scale-75 sm:scale-100">
                             {getIcon(prize.type)}
                         </div>
                         <div className="text-white font-black text-[10px] sm:text-xs uppercase tracking-tight whitespace-nowrap drop-shadow-md bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                            {prize.value > 0 ? prize.value : ''} {prize.type === 'balance' ? '$' : ''}
                         </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </div>

            {/* Spin Button */}
            <div className="text-center mt-12 w-full max-w-sm relative z-10">
              <button
                onClick={handleSpin}
                disabled={isSpinning || spins < 1}
                className={`w-full py-5 text-xl font-black rounded-2xl transition-all duration-300 transform uppercase tracking-widest ${
                  isSpinning || spins < 1
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_50px_rgba(234,179,8,0.5)] hover:-translate-y-1 active:translate-y-0'
                } flex items-center justify-center gap-3`}
              >
                {isSpinning ? (
                  <>
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    SPINNING...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6 fill-current" />
                    SPIN FOR GLORY
                  </>
                )}
              </button>
              
              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            
            {/* Result Card */}
            <div className="min-h-[160px]">
                <AnimatePresence mode="wait">
                    {result ? (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`p-8 rounded-3xl ${getTierColor(result.tier)} shadow-xl text-center border border-white/10 relative overflow-hidden`}
                    >
                        <div className="relative z-10">
                            <div className="text-xs font-black uppercase tracking-[0.2em] mb-2 opacity-90">Congratulations</div>
                            <div className="text-4xl font-black mb-2 text-white drop-shadow-md">{result.name}</div>
                            <div className="text-sm font-bold opacity-90 uppercase tracking-wide">Added to Wallet</div>
                        </div>
                         {/* Shine effect */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/20 to-transparent skew-x-12 opacity-50"></div>
                    </motion.div>
                    ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 rounded-3xl bg-[#161b22] border border-gray-800 text-center">
                        <Trophy className="w-12 h-12 text-gray-700 mb-4" />
                        <div className="text-gray-500 font-bold uppercase tracking-widest text-xs">Ready to Win?</div>
                    </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Provably Fair Panel */}
            <div className="bg-[#161b22] rounded-3xl border border-gray-800 overflow-hidden">
                <button 
                    onClick={() => setShowFairness(!showFairness)}
                    className="w-full flex items-center justify-between p-6 hover:bg-gray-800/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-green-500" />
                        <span className="font-bold text-gray-300 uppercase tracking-wider text-sm">Provably Fair</span>
                    </div>
                    {showFairness ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>
                
                <AnimatePresence>
                    {showFairness && (
                        <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-6 pt-0 space-y-4 border-t border-gray-800">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Active Client Seed</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={clientSeed}
                                            onChange={(e) => setClientSeed(e.target.value)}
                                            className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-3 py-2 text-xs font-mono text-gray-300 focus:border-yellow-500 outline-none transition-colors"
                                        />
                                        <button onClick={() => setClientSeed(Math.random().toString(36).substring(2))} className="p-2 bg-gray-800 rounded-xl hover:bg-gray-700 text-gray-400">
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Active Server Seed (Hashed)</label>
                                    <div className="flex gap-2 items-center bg-[#0d1117] border border-gray-700 rounded-xl px-3 py-2">
                                        <code className="text-[10px] text-gray-400 truncate flex-1 font-mono">{serverSeedHash}</code>
                                        <button onClick={() => copyToClipboard(serverSeedHash)} className="text-gray-500 hover:text-white"><Copy className="w-3 h-3" /></button>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                     <div className="flex-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Nonce</label>
                                        <div className="bg-[#0d1117] border border-gray-700 rounded-xl px-3 py-2 text-xs font-mono text-gray-300">{nonce}</div>
                                     </div>
                                     <div className="flex-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Rotate Seed</label>
                                        <button 
                                            onClick={handleRotateSeed}
                                            disabled={isRotatingSeed}
                                            className="w-full bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-300 py-2 rounded-xl transition-colors border border-gray-700"
                                        >
                                            {isRotatingSeed ? '...' : 'New Pair'}
                                        </button>
                                     </div>
                                </div>

                                {lastHash && (
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Last Game Hash</label>
                                        <div className="flex gap-2 items-center bg-[#0d1117] border border-green-900/30 rounded-xl px-3 py-2">
                                            <code className="text-[10px] text-green-500 truncate flex-1 font-mono">{lastHash}</code>
                                            <button onClick={() => copyToClipboard(lastHash)} className="text-green-500 hover:text-white"><Copy className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Payout Table */}
            <div className="bg-[#161b22] rounded-3xl border border-gray-800 p-6">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Payout Table</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800">
                    {prizes.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ background: p.color }}></div>
                                <span className="font-bold text-gray-300">{p.name}</span>
                            </div>
                            <span className="font-mono text-gray-500">{p.probability}%</span>
                        </div>
                    ))}
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SpinWheel;
