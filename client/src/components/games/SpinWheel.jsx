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
    const duration = 5000; // 5 seconds
    const startAngle = currentAngle * (180 / Math.PI);
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const newRotation = startAngle + (targetRotation * easeOut);
      
      setCurrentAngle(newRotation * (Math.PI / 180));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setResult(gameData.prize);
        dispatch(updateWallet(gameData.wallet));
      }
    };
    
    requestAnimationFrame(animate);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pt-12 pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Side: Game Stats & Info */}
            <div className="lg:col-span-4 space-y-8">
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6"
                    >
                        <Zap className="w-4 h-4" /> PROVABLY FAIR SECURED
                    </motion.div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter mb-4 leading-none">
                        Fortune <span className="text-yellow-500">Spin</span>
                    </h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm leading-relaxed">
                        Spin the legendary SayeemX wheel for a chance to win massive multipliers, bonus balance, and exclusive rewards.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#1a2c38] border border-gray-800 p-6 rounded-3xl">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Your Spins</p>
                        <div className="flex items-center gap-2">
                            <RotateCw className="w-4 h-4 text-yellow-500" />
                            <span className="text-2xl font-black">{wallet.spinCredits}</span>
                        </div>
                    </div>
                    <div className="bg-[#1a2c38] border border-gray-800 p-6 rounded-3xl">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Win Rate</p>
                        <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-green-500" />
                            <span className="text-2xl font-black">74%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-black/40 border border-gray-800 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-500">Cost per spin</span>
                        <span className="text-sm font-black text-white">1 Credit</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-500">Max Prize</span>
                        <span className="text-sm font-black text-yellow-500">$500.00</span>
                    </div>
                    <button 
                        onClick={spin}
                        disabled={isSpinning || wallet.spinCredits < 1}
                        className="w-full py-5 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-800 disabled:text-gray-500 text-black font-black rounded-2xl uppercase tracking-[0.2em] shadow-2xl shadow-yellow-500/10 transition-all flex items-center justify-center gap-3"
                    >
                        {isSpinning ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            <>
                                <Coins className="w-6 h-6" /> Spin Now
                            </>
                        )}
                    </button>
                    {error && (
                        <p className="text-[10px] text-red-500 font-black uppercase text-center">{error}</p>
                    )}
                </div>
            </div>

            {/* Middle: The Wheel */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
                    <div className="w-8 h-12 bg-yellow-500 clip-path-pointer shadow-2xl"></div>
                </div>
                
                <div className="relative p-4 bg-[#1a2c38] rounded-full border-8 border-gray-800 shadow-[0_0_100px_rgba(250,204,21,0.05)]">
                    <canvas 
                        ref={canvasRef} 
                        width={500} 
                        height={500} 
                        className="max-w-full h-auto rounded-full"
                    />
                </div>

                {/* Win Modal / Result */}
                <AnimatePresence>
                    {result && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.5, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5, y: 20 }}
                            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                        >
                            <div className="bg-yellow-500 p-8 rounded-[3rem] shadow-[0_0_50px_rgba(250,204,21,0.5)] text-center pointer-events-auto border-8 border-black">
                                <Trophy className="w-12 h-12 text-black mx-auto mb-4" />
                                <h2 className="text-4xl font-black text-black uppercase tracking-tighter mb-1">
                                    {result.type === 'badluck' ? 'Unlucky!' : 'You Won!'}
                                </h2>
                                <p className="text-black font-black text-lg uppercase tracking-widest mb-6">
                                    {result.name}
                                </p>
                                <button 
                                    onClick={() => setResult(null)}
                                    className="px-8 py-3 bg-black text-white font-black rounded-2xl uppercase tracking-widest text-xs hover:scale-105 transition-transform"
                                >
                                    Continue
                                </button>
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