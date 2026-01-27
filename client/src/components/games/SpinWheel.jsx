import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  RotateCw, 
  Trophy, 
  ShieldCheck, 
  Zap, 
  AlertCircle,
  Settings,
  ArrowRight,
  Wallet,
  Coins
} from 'lucide-react';
import { spinAPI } from '../../services/api';
import { updateWallet } from '../../redux/slices/userSlice';

const SpinWheel = () => {
  const dispatch = useDispatch();
  const { wallet, isAuthenticated } = useSelector(state => state.user);
  
  const canvasRef = useRef(null);
  const [prizes, setPrizes] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState(null);
  
  // Physics states
  const [currentAngle, setCurrentAngle] = useState(0);

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (prizes.length > 0) {
      drawWheel();
    }
  }, [prizes, currentAngle]);

  const fetchConfig = async () => {
    try {
      const res = await spinAPI.initialize();
      setPrizes(res.data.prizes);
    } catch (err) {
      setError('Failed to initialize game');
    }
  };

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;
    
    ctx.clearRect(0, 0, size, size);
    
    const segmentAngle = (2 * Math.PI) / prizes.length;
    
    prizes.forEach((prize, i) => {
      const startAngle = i * segmentAngle + currentAngle;
      const endAngle = startAngle + segmentAngle;
      
      // Draw segment
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.fillStyle = i % 2 === 0 ? '#1a2c38' : '#0f212e';
      if (prize.type === 'badluck') ctx.fillStyle = '#1e1e1e';
      if (prize.tier === 'legendary') ctx.fillStyle = '#fbbf24';
      ctx.fill();
      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = (prize.tier === 'legendary' && i % 2 !== 0) ? '#000' : '#fff';
      if (prize.type === 'badluck') ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px Inter';
      ctx.fillText(prize.name.toUpperCase(), radius - 30, 5);
      ctx.restore();
    });
    
    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 40, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a2c38';
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Inner logo/icon
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 20px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('X', center, center + 7);
  };

  const spin = async () => {
    if (isSpinning || wallet.spinCredits < 1) return;
    
    setIsSpinning(true);
    setResult(null);
    setError(null);
    
    try {
      const res = await spinAPI.play(1);
      const winningPrize = res.data.prize;
      
      // Calculate stop angle
      const prizeIndex = prizes.findIndex(p => p.id === winningPrize.id);
      const segmentAngle = 360 / prizes.length;
      
      // Target angle: 
      // 1. Multiple full rotations
      // 2. Offset to the winning segment
      // 3. Subtract from 360 because canvas rotation is clockwise but wheel visually "spins"
      // We want the pointer (at top, 270deg or -90deg) to hit the segment
      const extraSpins = 5 + Math.random() * 5;
      const targetRotation = extraSpins * 360 + (360 - (prizeIndex * segmentAngle) - segmentAngle / 2);
      
      animateWheel(targetRotation, res.data);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Spin failed');
      setIsSpinning(false);
    }
  };

  const animateWheel = (targetRotation, gameData) => {
    const startTime = performance.now();
    const duration = 6000; // Increased to 6s for more tension
    const startAngle = currentAngle * (180 / Math.PI);
    let lastTickAngle = 0;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Advanced Ease Out: Starts fast, stays fast, then slows down dramatically
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const newRotation = startAngle + (targetRotation * easeOut);
      
      setCurrentAngle(newRotation * (Math.PI / 180));
      
      // Simulate "Ticks" as segments pass the pointer
      const currentRotation = newRotation % 360;
      const segmentAngle = 360 / prizes.length;
      if (Math.floor(currentRotation / segmentAngle) !== Math.floor(lastTickAngle / segmentAngle)) {
          // You could trigger a haptic or sound here
          // Visually: shake the pointer or flash a light
          setPointerState('active');
          setTimeout(() => setPointerState('idle'), 50);
      }
      lastTickAngle = currentRotation;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setTimeout(() => {
            setResult(gameData.prize);
            dispatch(updateWallet(gameData.wallet));
        }, 500);
      }
    };
    
    requestAnimationFrame(animate);
  };

  const [pointerState, setPointerState] = useState('idle');

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pt-12 pb-24 overflow-hidden relative">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Side: Game Stats & Info */}
            <div className="lg:col-span-4 space-y-8">
                <motion.div
                    animate={isSpinning ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1 }}
                >
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6"
                    >
                        <Zap className="w-4 h-4 animate-pulse" /> PROVABLY FAIR SECURED
                    </motion.div>
                    <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tighter mb-4 leading-none italic">
                        Fortune <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600 animate-gradient-x">Spin</span>
                    </h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs leading-loose">
                        Spin the legendary SayeemX wheel for a chance to win massive multipliers and exclusive rewards.
                    </p>
                </motion.div>

                <div className="grid grid-cols-2 gap-4">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="bg-gradient-to-br from-[#1a2c38] to-[#0f212e] border border-gray-800 p-8 rounded-[2.5rem] relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5"><RotateCw className="w-12 h-12" /></div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Your Spins</p>
                        <div className="flex items-center gap-2">
                            <RotateCw className={`w-5 h-5 text-yellow-500 ${isSpinning ? 'animate-spin' : ''}`} />
                            <span className="text-3xl font-black">{wallet.spinCredits}</span>
                        </div>
                    </motion.div>
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="bg-gradient-to-br from-[#1a2c38] to-[#0f212e] border border-gray-800 p-8 rounded-[2.5rem] relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5"><Trophy className="w-12 h-12" /></div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Win Rate</p>
                        <div className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-green-500" />
                            <span className="text-3xl font-black">74%</span>
                        </div>
                    </motion.div>
                </div>

                <div className="bg-black/40 backdrop-blur-xl border border-gray-800 rounded-[3rem] p-8 space-y-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-yellow-500/5 opacity-20 pointer-events-none"></div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-500">Cost per spin</span>
                        <span className="text-sm font-black text-white px-3 py-1 bg-gray-800 rounded-lg">1 Credit</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-500">Max Prize</span>
                        <span className="text-sm font-black text-yellow-500 px-3 py-1 bg-yellow-500/10 rounded-lg">$500.00</span>
                    </div>
                    <button 
                        onClick={spin}
                        disabled={isSpinning || wallet.spinCredits < 1}
                        className="w-full py-6 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 disabled:from-gray-800 disabled:to-gray-900 disabled:text-gray-500 text-black font-black rounded-3xl uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(245,158,11,0.2)] hover:shadow-[0_0_60px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
                        {isSpinning ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            <>
                                <Coins className="w-6 h-6" /> Spin Arena
                            </>
                        )}
                    </button>
                    {error && (
                        <p className="text-[10px] text-red-500 font-black uppercase text-center animate-bounce">{error}</p>
                    )}
                </div>
            </div>

            {/* Middle: The Wheel */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                
                {/* Pointer */}
                <motion.div 
                    className="absolute top-0 left-1/2 -translate-x-1/2 z-20"
                    animate={pointerState === 'active' ? { y: [0, 5, 0], rotate: [0, -10, 0] } : {}}
                    transition={{ duration: 0.05 }}
                >
                    <div className="w-10 h-14 bg-gradient-to-b from-yellow-400 to-orange-600 clip-path-pointer shadow-[0_0_30px_rgba(245,158,11,0.5)] border-x-2 border-white/20"></div>
                </motion.div>
                
                <motion.div 
                    className="relative p-6 bg-[#0f212e] rounded-full border-[12px] border-[#1a2c38] shadow-[0_0_150px_rgba(0,0,0,0.5)]"
                    animate={isSpinning ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    {/* Outer Neon Ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-yellow-500/20 animate-pulse"></div>
                    <div className={`absolute inset-0 rounded-full border-2 border-yellow-500/50 blur-sm transition-opacity duration-1000 ${isSpinning ? 'opacity-100' : 'opacity-0'}`}></div>
                    
                    <canvas 
                        ref={canvasRef} 
                        width={500} 
                        height={500} 
                        className="max-w-full h-auto rounded-full relative z-10"
                    />
                </motion.div>

                {/* Win Modal / Result */}
                <AnimatePresence>
                    {result && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
                        >
                            <div className="bg-black border-4 border-yellow-500 p-12 rounded-[4rem] shadow-[0_0_100px_rgba(245,158,11,0.6)] text-center pointer-events-auto relative overflow-hidden group">
                                <div className="absolute inset-0 bg-yellow-500/10 animate-pulse"></div>
                                <div className="relative z-10">
                                    <motion.div
                                        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                    >
                                        <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                                    </motion.div>
                                    <h2 className="text-6xl font-black text-white uppercase tracking-tighter mb-2 leading-none">
                                        {result.type === 'badluck' ? 'CRASH!' : 'EPIC WIN!'}
                                    </h2>
                                    <p className="text-yellow-500 font-black text-2xl uppercase tracking-[0.3em] mb-8">
                                        {result.name}
                                    </p>
                                    <button 
                                        onClick={() => setResult(null)}
                                        className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl uppercase tracking-widest text-sm shadow-xl transition-all hover:scale-105"
                                    >
                                        COLLECT REWARD
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Right Side: Features */}
            <div className="lg:col-span-3 space-y-6">
                <div className="p-8 bg-[#1a2c38] border border-gray-800 rounded-[2.5rem]">
                    <ShieldCheck className="w-8 h-8 text-yellow-500 mb-4" />
                    <h3 className="text-lg font-black uppercase tracking-tighter mb-2">Fair Play</h3>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-loose">
                        Each spin is cryptographically secured. You can verify the result using the server hash and your client seed.
                    </p>
                </div>
                <div className="p-8 bg-[#1a2c38] border border-gray-800 rounded-[2.5rem]">
                    <Sparkles className="w-8 h-8 text-yellow-500 mb-4" />
                    <h3 className="text-lg font-black uppercase tracking-tighter mb-2">Legendary Tier</h3>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-loose">
                        The gold segments represent legendary rewards. Hit them to unlock massive payouts up to 500x.
                    </p>
                </div>
            </div>

        </div>

      </div>
      
      <style jsx>{`
        .clip-path-pointer {
            clip-path: polygon(0% 0%, 100% 0%, 50% 100%);
        }
      `}</style>
    </div>
  );
};

const Loader2 = ({ className }) => (
    <RotateCw className={className} />
);

export default SpinWheel;