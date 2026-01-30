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
  Coins,
  Volume2,
  VolumeX,
  Vibrate,
  Info,
  ShoppingBag,
  Plus,
  Gem,
  Award,
  Crown,
  CheckCircle2
} from 'lucide-react';
import ReactConfetti from 'react-confetti';
import { spinAPI, shopAPI } from '../../services/api';
import { updateWallet } from '../../redux/slices/userSlice';
import ProvablyFairSettings from '../ProvablyFairSettings';

const WHEEL_CONFIGS = {
  BRONZE: { label: 'Bronze', color: '#cd7f32', icon: Award, cost: 1 },
  SILVER: { label: 'Silver', color: '#c0c0c0', icon: ShieldCheck, cost: 10 },
  GOLD: { label: 'Gold', color: '#ffd700', icon: Crown, cost: 100 },
  DIAMOND: { label: 'Diamond', color: '#b9f2ff', icon: Gem, cost: 1000 }
};

const WHEEL_TIERS = {
    BRONZE: { cost: 1 },
    SILVER: { cost: 10 },
    GOLD: { cost: 100 },
    DIAMOND: { cost: 1000 }
};

const SpinWheel = () => {
  const dispatch = useDispatch();
  const { wallet, isAuthenticated } = useSelector(state => state.user);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  const [currentTier, setCurrentTier] = useState('BRONZE');
  const [tiersData, setTiersData] = useState({});
  const [jackpots, setJackpots] = useState({});
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buying, setBuying] = useState(false);
  
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  const [currentAngle, setCurrentAngle] = useState(0);
  const [pointerState, setPointerState] = useState('idle');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const audioCtxRef = useRef(null);

  useEffect(() => {
    fetchConfig();
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    if (typeof window !== 'undefined') {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const updateDimensions = () => {
    if (containerRef.current) {
        const size = Math.min(containerRef.current.offsetWidth, 600);
        setDimensions({ width: size, height: size });
    }
  };

  useEffect(() => {
    if (tiersData[currentTier]) {
      drawWheel();
    }
  }, [currentTier, tiersData, currentAngle, dimensions]);

  const fetchConfig = async () => {
    try {
      const res = await spinAPI.initialize();
      setTiersData(res.data.tiers);
      setJackpots(res.data.jackpots);
    } catch (err) {
      setError('System initialization error. Please refresh.');
    }
  };

  const playSound = (type) => {
    if (!audioEnabled || !audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    
    if (type === 'tick') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, audioCtxRef.current.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtxRef.current.currentTime + 0.1);
    } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, audioCtxRef.current.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtxRef.current.currentTime + 0.5);
        gain.gain.setValueAtTime(0.2, audioCtxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtxRef.current.currentTime + 0.5);
    }
  };

  const triggerHaptic = () => {
    if (hapticsEnabled && window.navigator?.vibrate) {
        window.navigator.vibrate(10);
    }
  };

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 20;
    
    ctx.clearRect(0, 0, size, size);
    const prizes = tiersData[currentTier].prizes;
    const segmentAngle = (2 * Math.PI) / prizes.length;
    
    // Outer Ring
    ctx.beginPath();
    ctx.arc(center, center, radius + 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 5;
    ctx.stroke();

    prizes.forEach((prize, i) => {
      const startAngle = i * segmentAngle + currentAngle;
      const endAngle = startAngle + segmentAngle;
      
      const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
      grad.addColorStop(0, prize.color);
      grad.addColorStop(1, adjustColor(prize.color, -40));

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.fillStyle = grad;
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      const isDark = isColorDark(prize.color);
      ctx.fillStyle = isDark ? '#fff' : '#000';
      ctx.font = `bold ${size/45}px Inter`;
      ctx.fillText(prize.name.toUpperCase(), radius - 30, 5);
      ctx.restore();
    });

    // Lights
    for (let i = 0; i < 32; i++) {
        const angle = (i * (360 / 32)) * (Math.PI / 180);
        ctx.beginPath();
        ctx.arc(center + Math.cos(angle) * (radius + 5), center + Math.sin(angle) * (radius + 5), 2, 0, 2 * Math.PI);
        ctx.fillStyle = (Math.floor(Date.now() / 200) % 2 === 0 && i % 2 === 0) ? WHEEL_CONFIGS[currentTier].color : '#333';
        ctx.fill();
    }
  };

  const adjustColor = (hex, amt) => {
    let usePound = false;
    if (hex[0] === "#") { hex = hex.slice(1); usePound = true; }
    const num = parseInt(hex, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255; else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255; else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255; else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
  };

  const isColorDark = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };

  const spin = async () => {
    if (isSpinning) return;
    
    const cost = WHEEL_CONFIGS[currentTier].cost;
    const availableCredits = typeof wallet.spinCredits === 'object' ? (wallet.spinCredits[currentTier] || 0) : wallet.spinCredits;
    const canSpin = availableCredits >= 1 || wallet.mainBalance >= cost;
    
    if (!canSpin) {
        setShowBuyModal(true);
        return;
    }
    
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
    setIsSpinning(true);
    setResult(null);
    setError(null);
    
    try {
      const res = await spinAPI.play(currentTier);
      const winningPrize = res.data.prize;
      const prizes = tiersData[currentTier].prizes;
      const prizeIndex = prizes.findIndex(p => p.id === winningPrize.id);
      const numSegments = prizes.length;
      const segmentAngle = 360 / numSegments;
      
      const currentRotationDeg = (currentAngle * 180 / Math.PI) % 360;
      const desiredRotationDeg = 270 - (prizeIndex * segmentAngle + segmentAngle / 2);
      
      let delta = (desiredRotationDeg - currentRotationDeg) % 360;
      if (delta < 0) delta += 360;
      
      const extraSpins = 10 + Math.floor(Math.random() * 5);
      const totalDelta = extraSpins * 360 + delta;
      
      animateWheel(totalDelta, res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Spin failed');
      setIsSpinning(false);
    }
  };

  const animateWheel = (totalDelta, gameData) => {
    const startTime = performance.now();
    const duration = 8000;
    const startAngleDeg = (currentAngle * 180) / Math.PI;
    let lastTickAngle = 0;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // BC.Game Style Ease Out Bounce
      const easeOutBounce = (x) => {
        const n1 = 7.5625; const d1 = 2.75;
        if (x < 1 / d1) return n1 * x * x;
        else if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
        else if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
        else return n1 * (x -= 2.625 / d1) * x + 0.984375;
      };

      const currentRotationDeg = startAngleDeg + (totalDelta * easeOutBounce(progress));
      setCurrentAngle((currentRotationDeg * Math.PI) / 180);
      
      const segmentAngle = 360 / tiersData[currentTier].prizes.length;
      if (Math.floor(currentRotationDeg / segmentAngle) !== Math.floor(lastTickAngle / segmentAngle)) {
          playSound('tick');
          triggerHaptic();
          setPointerState('active');
          setTimeout(() => setPointerState('idle'), 50);
      }
      lastTickAngle = currentRotationDeg;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setResult(gameData.prize);
        setJackpots(gameData.jackpots);
        if (gameData.prize.value > 0) playSound('win');
        
        dispatch(updateWallet({
            mainBalance: gameData.wallet.balance,
            spinCredits: gameData.wallet.spins
        }));
      }
    };
    
    requestAnimationFrame(animate);
  };

  const handleBuySpins = async (amount) => {
    setBuying(true);
    try {
      const res = await shopAPI.buySpins(amount, currentTier);
      dispatch(updateWallet(res.data.wallet));
      setShowBuyModal(false);
      playSound('win');
    } catch (err) {
      setError(err.response?.data?.error || 'Purchase failed');
    } finally { setBuying(false); }
  };

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <div className="text-center space-y-6">
            <ShieldCheck className="w-20 h-20 text-yellow-500 mx-auto opacity-20" />
            <h2 className="text-3xl font-black uppercase italic">Access Denied</h2>
            <a href="/login" className="inline-block px-12 py-4 bg-yellow-500 text-black font-black rounded-2xl uppercase tracking-widest">Login</a>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pt-8 pb-24 relative overflow-hidden">
      {result && (result.type === 'jackpot' || result.value >= 100) && <ReactConfetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} />}
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* Jackpot HUD */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-4 mb-12">
            {Object.entries(jackpots).map(([key, data]) => (
                <motion.div 
                    key={key} 
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 4, repeat: Infinity, delay: Math.random() }}
                    className="bg-[#1a2c38] border border-gray-800 p-3 sm:p-4 rounded-2xl text-center"
                >
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{key} JACKPOT</p>
                    <p className="text-sm sm:text-lg font-black text-yellow-500">{data.current.toFixed(2)}</p>
                </motion.div>
            ))}
        </div>

        {/* Tier Selection */}
        <div className="flex justify-center mb-12">
            <div className="flex bg-black/40 p-1.5 rounded-3xl border border-gray-800 backdrop-blur-xl">
                {Object.keys(WHEEL_CONFIGS).map(tier => {
                    const Config = WHEEL_CONFIGS[tier];
                    return (
                        <button
                            key={tier}
                            onClick={() => !isSpinning && setCurrentTier(tier)}
                            className={`
                                flex items-center gap-2 px-4 sm:px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all
                                ${currentTier === tier ? 'bg-[#1a2c38] text-white shadow-xl' : 'text-gray-500 hover:text-gray-300'}
                            `}
                        >
                            <Config.icon className="w-4 h-4" style={{ color: currentTier === tier ? Config.color : 'inherit' }} />
                            <span className="hidden sm:inline">{Config.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-3 space-y-4">
                <div className="bg-[#1a2c38] border border-gray-800 p-6 rounded-[2rem]">
                    <div className="flex items-center gap-3 mb-2">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Balance</p>
                    </div>
                    <p className="text-2xl font-black text-white">{wallet.mainBalance.toFixed(2)} <span className="text-xs text-gray-500">TRX</span></p>
                </div>
                <div className="bg-[#1a2c38] border border-gray-800 p-6 rounded-[2rem]">
                    <div className="flex items-center gap-3 mb-2">
                        <RotateCw className="w-4 h-4 text-yellow-500" />
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Available {currentTier} Spins</p>
                    </div>
                    <p className="text-2xl font-black text-white">
                        {typeof wallet.spinCredits === 'object' ? (wallet.spinCredits[currentTier] || 0) : wallet.spinCredits}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setAudioEnabled(!audioEnabled)} className={`flex-1 py-4 rounded-2xl transition-all flex items-center justify-center ${audioEnabled ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                        {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setHapticsEnabled(!hapticsEnabled)} className={`flex-1 py-4 rounded-2xl transition-all flex items-center justify-center ${hapticsEnabled ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                        <Vibrate className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="lg:col-span-6 flex flex-col items-center justify-center relative py-8" ref={containerRef}>
                {/* Pointer */}
                <motion.div 
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
                    animate={pointerState === 'active' ? { y: [0, 8, 0], rotate: [0, -15, 0] } : {}}
                    transition={{ duration: 0.05 }}
                >
                    <div className="w-10 h-14 bg-white shadow-2xl" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }}></div>
                </motion.div>
                
                {/* Wheel Housing */}
                <div className="relative p-4 bg-[#0a0a0a] rounded-full border-[15px] border-[#1a2c38] shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                    <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} className="rounded-full relative z-10" />
                    
                    {/* Spin Button */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                        <button 
                            onClick={spin}
                            disabled={isSpinning}
                            className={`
                                w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300
                                border-4 border-[#1a2c38] shadow-2xl active:scale-90
                                ${isSpinning 
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                                    : 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-600 text-black'
                                }
                            `}
                        >
                            <RotateCw className={`w-8 h-8 mb-1 ${isSpinning ? 'animate-spin' : ''}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{isSpinning ? '...' : 'SPIN'}</span>
                        </button>
                    </div>
                </div>

                {/* Win Overlay */}
                <AnimatePresence>
                    {result && (
                        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
                            <div className="bg-black/95 border-4 border-yellow-500 p-12 rounded-[3rem] text-center shadow-[0_0_150px_rgba(245,158,11,0.5)] pointer-events-auto">
                                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                                <h2 className="text-4xl font-black uppercase italic">{result.type === 'crash' ? 'CRASHED!' : 'EPIC WIN!'}</h2>
                                <p className="text-2xl font-black text-white mt-2 mb-8 uppercase tracking-widest">{result.name}</p>
                                <button onClick={() => setResult(null)} className="w-full py-4 bg-yellow-500 text-black font-black rounded-2xl uppercase tracking-widest shadow-xl transition-all hover:scale-105">COLLECT</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Buy Spins Modal */}
                <AnimatePresence>
                    {showBuyModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowBuyModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative bg-[#1a2c38] border-2 border-yellow-500/30 rounded-[3rem] p-8 w-full max-w-md shadow-2xl">
                                <div className="text-center space-y-6">
                                    <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto border border-yellow-500/20">
                                        <ShoppingBag className="w-8 h-8 text-yellow-500" />
                                    </div>
                                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Refill <span className="text-yellow-500">{currentTier} Spins</span></h2>
                                    <div className="space-y-3">
                                        {[10, 50, 100].map(amt => {
                                            const totalCost = amt * WHEEL_TIERS[currentTier].cost;
                                            return (
                                                <button key={amt} onClick={() => handleBuySpins(amt)} disabled={buying || wallet.mainBalance < totalCost} className="w-full flex items-center justify-between p-5 bg-black/20 border border-gray-800 rounded-2xl hover:border-yellow-500/50 transition-all disabled:opacity-50">
                                                    <div className="flex items-center gap-3">
                                                        <RotateCw className="w-4 h-4 text-gray-500" />
                                                        <span className="font-black uppercase tracking-widest text-xs">{amt} SPINS</span>
                                                    </div>
                                                    <span className="text-yellow-500 font-black">{totalCost} TRX</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button onClick={() => setShowBuyModal(false)} className="text-gray-500 font-black uppercase text-[10px] tracking-[0.2em] hover:text-white transition-colors">Maybe Later</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <div className="lg:col-span-3 space-y-4">
                <div className="p-6 bg-[#1a2c38]/50 border border-gray-800 rounded-[2rem]">
                    <ShieldCheck className="w-5 h-5 text-green-500 mb-2" />
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Advanced Fairness</p>
                    <p className="text-[9px] text-gray-600 mt-1 leading-relaxed uppercase">Provably fair Multi-algorithm verification (SHA-256/512) ensures 100% transparency.</p>
                </div>
                <ProvablyFairSettings />
            </div>

        </div>
      </div>
    </div>
  );
};

export default SpinWheel;