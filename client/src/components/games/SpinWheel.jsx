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
  Info
} from 'lucide-react';
import ReactConfetti from 'react-confetti';
import { spinAPI } from '../../services/api';
import { updateWallet } from '../../redux/slices/userSlice';
import ProvablyFairSettings from '../ProvablyFairSettings';

const SpinWheel = () => {
  const dispatch = useDispatch();
  const { wallet, isAuthenticated } = useSelector(state => state.user);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [prizes, setPrizes] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [jackpot, setJackpot] = useState(1000);
  
  // Audio & Haptics Toggle
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  // Animation & Physics
  const [currentAngle, setCurrentAngle] = useState(0);
  const [pointerState, setPointerState] = useState('idle');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Audio Context (Dynamic Soundscapes)
  const audioCtxRef = useRef(null);
  const tickSoundRef = useRef(null);
  const winSoundRef = useRef(null);

  useEffect(() => {
    fetchConfig();
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    // Init Audio
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
    if (prizes.length > 0) {
      drawWheel();
    }
  }, [prizes, currentAngle, dimensions]);

  const fetchConfig = async () => {
    try {
      const res = await spinAPI.initialize();
      setPrizes(res.data.prizes);
      if (res.data.progressiveJackpot) setJackpot(res.data.progressiveJackpot);
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
    if (hapticsEnabled && window.navigator && window.navigator.vibrate) {
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
    
    const segmentAngle = (2 * Math.PI) / prizes.length;
    
    // Draw Outer Shadow/Ring
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
      
      // Gradient for 3D effect
      const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
      grad.addColorStop(0, prize.color);
      grad.addColorStop(1, adjustColor(prize.color, -40)); // Darken edge

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.fillStyle = grad;
      ctx.fill();
      
      // Separator lines
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      
      // Contrast text
      const isDark = isColorDark(prize.color);
      ctx.fillStyle = isDark ? '#fff' : '#000';
      ctx.shadowBlur = 2;
      ctx.shadowColor = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)';
      
      ctx.font = `black ${size/35}px Inter`;
      ctx.fillText(prize.name.toUpperCase(), radius - 40, 5);
      ctx.restore();
    });

    // Outer edge lights
    for (let i = 0; i < 24; i++) {
        const angle = (i * (360 / 24)) * (Math.PI / 180);
        ctx.beginPath();
        ctx.arc(center + Math.cos(angle) * (radius + 5), center + Math.sin(angle) * (radius + 5), 3, 0, 2 * Math.PI);
        ctx.fillStyle = (Math.floor(Date.now() / 200) % 2 === 0 && i % 2 === 0) ? '#fbbf24' : '#333';
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
    if (isSpinning || wallet.spinCredits < 1) return;
    
    // Unlock audio context on user gesture
    if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
    }

    setIsSpinning(true);
    setResult(null);
    setError(null);
    
    try {
      const res = await spinAPI.play(1);
      const winningPrize = res.data.prize;
      
      const prizeIndex = prizes.findIndex(p => p.id === winningPrize.id);
      const segmentAngle = 360 / prizes.length;
      
      // Real Physics: Total rotation based on initial velocity + friction
      // But we must end on the specific segment.
      // So we calculate the target rotation and then apply a custom ease-out.
      const extraSpins = 10 + Math.random() * 5;
      const targetRotation = extraSpins * 360 + (360 - (prizeIndex * segmentAngle) - segmentAngle / 2);
      
      animateWheel(targetRotation, res.data);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Security check failed. Try again.');
      setIsSpinning(false);
    }
  };

  const animateWheel = (targetRotation, gameData) => {
    const startTime = performance.now();
    const duration = 8000; // Realistic slow down (8s)
    const startAngle = (currentAngle * 180) / Math.PI;
    let lastTickAngle = 0;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease Out Quintic for high-end feel
      const t = 1 - progress;
      const easeOut = 1 - t * t * t * t * t;
      
      const newRotation = startAngle + (targetRotation * easeOut);
      setCurrentAngle((newRotation * Math.PI) / 180);
      
      // Dynamic Ticking System
      const currentRotation = newRotation % 360;
      const segmentAngle = 360 / prizes.length;
      if (Math.floor(currentRotation / segmentAngle) !== Math.floor(lastTickAngle / segmentAngle)) {
          playSound('tick');
          triggerHaptic();
          setPointerState('active');
          setTimeout(() => setPointerState('idle'), 50);
      }
      lastTickAngle = currentRotation;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setResult(gameData.prize);
        if (gameData.progressiveJackpot) setJackpot(gameData.progressiveJackpot);
        if (gameData.prize.value > 0) playSound('win');
        
        // Map server response to Redux state
        dispatch(updateWallet({
            mainBalance: gameData.wallet.balance,
            bonusBalance: gameData.wallet.bonus,
            spinCredits: gameData.wallet.spins
        }));
      }
    };
    
    requestAnimationFrame(animate);
  };

  if (!isAuthenticated) {
      return (
          <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
              <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-yellow-500/10 rounded-3xl flex items-center justify-center mx-auto border border-yellow-500/20">
                      <ShieldCheck className="w-10 h-10 text-yellow-500" />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter italic">Access Denied</h2>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Please authenticate to access the Arena</p>
                  <a href="/login" className="inline-block px-12 py-4 bg-yellow-500 text-black font-black rounded-2xl uppercase tracking-widest">Login</a>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pt-8 sm:pt-12 pb-24 overflow-hidden relative">
      {result && result.tier === 'legendary' && <ReactConfetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} gravity={0.1} />}
      
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* Header: Jackpot Display */}
        <div className="mb-12 text-center">
            <motion.div 
                animate={{ scale: [1, 1.05, 1], filter: ['drop-shadow(0 0 10px rgba(245,158,11,0.2))', 'drop-shadow(0 0 30px rgba(245,158,11,0.5))', 'drop-shadow(0 0 10px rgba(245,158,11,0.2))'] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="inline-block bg-[#1a2c38] border-2 border-yellow-500/50 p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem]"
            >
                <div className="flex items-center justify-center gap-3 mb-2">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    <span className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Progressive Jackpot</span>
                </div>
                <div className="text-4xl sm:text-6xl font-black text-white tracking-tighter">
                    {jackpot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-yellow-500 text-2xl sm:text-4xl">TRX</span>
                </div>
            </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Stats Panel */}
            <div className="lg:col-span-3 space-y-4">
                <div className="bg-[#1a2c38] border border-gray-800 p-6 rounded-[2rem]">
                    <div className="flex items-center gap-3 mb-4">
                        <Coins className="w-5 h-5 text-yellow-500" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Your Balance</span>
                    </div>
                    <div className="text-2xl font-black text-white">{wallet.mainBalance.toFixed(2)} <span className="text-xs text-gray-500">TRX</span></div>
                </div>
                <div className="bg-[#1a2c38] border border-gray-800 p-6 rounded-[2rem]">
                    <div className="flex items-center gap-3 mb-4">
                        <RotateCw className="w-5 h-5 text-yellow-500" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Available Spins</span>
                    </div>
                    <div className="text-2xl font-black text-white">{wallet.spinCredits}</div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setAudioEnabled(!audioEnabled)} className={`flex-1 py-4 rounded-2xl border transition-all flex items-center justify-center gap-2 ${audioEnabled ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
                        {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        <span className="text-[8px] font-black uppercase">SFX</span>
                    </button>
                    <button onClick={() => setHapticsEnabled(!hapticsEnabled)} className={`flex-1 py-4 rounded-2xl border transition-all flex items-center justify-center gap-2 ${hapticsEnabled ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
                        <Vibrate className="w-4 h-4" />
                        <span className="text-[8px] font-black uppercase">Feel</span>
                    </button>
                </div>
            </div>

            {/* The Main Wheel Container */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center relative py-12" ref={containerRef}>
                
                {/* Pointer */}
                <motion.div 
                    className="absolute top-8 left-1/2 -translate-x-1/2 z-20"
                    animate={pointerState === 'active' ? { y: [0, 8, 0], rotate: [0, -15, 0] } : {}}
                    transition={{ duration: 0.05 }}
                >
                    <div className="w-10 h-14 bg-gradient-to-b from-white to-gray-400 clip-path-pointer shadow-2xl border-x-2 border-black/20"></div>
                </motion.div>
                
                {/* Wheel Outer Housing */}
                <div className="relative p-4 sm:p-8 bg-[#0a0a0a] rounded-full border-[12px] sm:border-[20px] border-[#1a2c38] shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                    <canvas 
                        ref={canvasRef} 
                        width={dimensions.width} 
                        height={dimensions.height} 
                        className="rounded-full relative z-10"
                    />

                    {/* Central Spin Button - The Heart of the Game */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                        <button 
                            onClick={spin}
                            disabled={isSpinning || wallet.spinCredits < 1}
                            className={`
                                w-20 h-20 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300
                                border-4 border-[#1a2c38] shadow-[0_0_30px_rgba(0,0,0,0.5)] active:scale-95
                                ${isSpinning 
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                                    : 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-600 text-black hover:shadow-[0_0_50px_rgba(245,158,11,0.4)]'
                                }
                            `}
                        >
                            <RotateCw className={`w-6 h-6 sm:w-8 sm:h-8 mb-1 ${isSpinning ? 'animate-spin' : ''}`} />
                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">
                                {isSpinning ? 'SPINNING' : 'SPIN'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Win Overlay */}
                <AnimatePresence>
                    {result && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.5, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
                        >
                            <div className="bg-black/90 backdrop-blur-xl border-4 border-yellow-500 p-8 sm:p-12 rounded-[3rem] text-center pointer-events-auto shadow-[0_0_150px_rgba(245,158,11,0.6)]">
                                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
                                    <Trophy className="w-16 h-16 sm:w-24 sm:h-24 text-yellow-500 mx-auto mb-6" />
                                </motion.div>
                                <h2 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tighter mb-2 italic">
                                    {result.type === 'crash' ? 'CRASHED!' : result.type === 'weapon' ? 'ARSENAL UNLOCKED!' : 'EPIC WIN!'}
                                </h2>
                                <p className="text-yellow-500 font-black text-2xl sm:text-3xl uppercase tracking-widest mb-8">
                                    {result.name}
                                </p>
                                {result.type === 'crash' && (
                                    <p className="text-gray-400 text-xs font-bold uppercase mb-8 tracking-widest animate-pulse">
                                        Try your luck in the GameX Crash Arena
                                    </p>
                                )}
                                <button 
                                    onClick={() => setResult(null)}
                                    className="px-12 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl uppercase tracking-widest transition-all"
                                >
                                    {result.type === 'crash' ? 'CLOSE' : 'COLLECT'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Info Panel */}
            <div className="lg:col-span-3 space-y-4">
                <div className="p-6 bg-[#1a2c38]/50 border border-gray-800 rounded-[2rem]">
                    <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Provably Fair</span>
                    </div>
                    <p className="text-[9px] text-gray-500 leading-relaxed font-bold uppercase tracking-widest">Results are cryptographically pre-determined. Verify using your Client Seed in settings.</p>
                </div>
                <div className="p-6 bg-[#1a2c38]/50 border border-gray-800 rounded-[2rem]">
                    <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Legendary Tier</span>
                    </div>
                    <p className="text-[9px] text-gray-500 leading-relaxed font-bold uppercase tracking-widest">Hit the jackpot or gold segments for payouts up to 5000x.</p>
                </div>
                {error && (
                    <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-[10px] font-black text-red-500 uppercase">{error}</span>
                    </motion.div>
                )}
            </div>

        </div>

        {/* Provably Fair Controls */}
        <ProvablyFairSettings />

      </div>
      
      <style jsx>{`
        .clip-path-pointer {
            clip-path: polygon(0% 0%, 100% 0%, 50% 100%);
        }
      `}</style>
    </div>
  );
};

export default SpinWheel;
