import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

const PRIZES = [
  { label: '10 Coins', color: '#94a3b8' },
  { label: '50 Coins', color: '#38bdf8' },
  { label: 'Rare Card', color: '#a855f7' },
  { label: '500 Coins', color: '#fbbf24' },
  { label: 'JACKPOT', color: '#ef4444' }
];

const SpinWheel = ({ onSpin, isSpinning, resultIndex }) => {
  const controls = useAnimation();
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (resultIndex !== null && isSpinning) {
      // Calculate target rotation
      // 360 / 5 segments = 72 degrees per segment
      // We want the wheel to spin several times then land on the prize
      const extraSpins = 5;
      const degreesPerSegment = 72;
      const targetDegrees = (extraSpins * 360) + (360 - (resultIndex * degreesPerSegment));
      
      controls.start({
        rotate: targetDegrees,
        transition: { duration: 4, ease: [0.13, 0, 0, 1] } // Custom cubic-bezier for "heavy" spin feel
      }).then(() => {
        setRotation(targetDegrees % 360);
      });
    }
  }, [resultIndex, isSpinning, controls]);

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-80 h-80">
        {/* Pointer (fixed at top) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 z-30">
            <div className="w-8 h-10 bg-white clip-path-polygon-[50%_100%,0%_0%,100%_0%] shadow-lg border-2 border-game-dark">
                <div className="w-full h-full bg-red-500 animate-pulse"></div>
            </div>
        </div>

        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-[12px] border-game-accent shadow-[0_0_30px_rgba(139,92,246,0.3)] z-10 pointer-events-none"></div>

        {/* Wheel Body */}
        <motion.div
          className="w-full h-full rounded-full overflow-hidden relative shadow-2xl bg-game-dark border-4 border-white/10"
          animate={controls}
          initial={{ rotate: 0 }}
          style={{ transformOrigin: 'center' }}
        >
             {/* Segments */}
             {PRIZES.map((prize, i) => (
                <div 
                    key={i}
                    className="absolute top-0 left-1/2 w-1/2 h-full origin-left"
                    style={{ 
                        transform: `rotate(${i * 72}deg)`,
                        backgroundColor: i % 2 === 0 ? '#1e293b' : '#0f172a'
                    }}
                >
                    <div 
                        className="absolute top-8 left-1/2 -translate-x-1/2 -rotate-90 origin-center whitespace-nowrap font-black text-xs uppercase tracking-tighter"
                        style={{ color: prize.color }}
                    >
                        {prize.label}
                    </div>
                </div>
             ))}
             
             {/* Center Hub */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-game-dark rounded-full flex items-center justify-center z-20 border-4 border-game-accent shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                 <div className="text-white font-black text-xs tracking-tighter text-center">
                     KHELA<br/>ZONE
                 </div>
             </div>
        </motion.div>
      </div>
      
      <button 
        onClick={onSpin}
        disabled={isSpinning}
        className={`mt-12 px-10 py-4 rounded-xl font-black text-xl tracking-widest shadow-2xl transform transition-all hover:scale-105 active:scale-95 ${
            isSpinning 
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
            : 'bg-gradient-to-br from-game-accent via-purple-500 to-game-secondary text-white border-b-4 border-purple-800'
        }`}
      >
        {isSpinning ? 'LUCK IN PROGRESS...' : 'SPIN FOR GLORY'}
      </button>
    </div>
  );
};

export default SpinWheel;