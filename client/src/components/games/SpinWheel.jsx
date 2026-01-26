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
  AlertCircle
} from 'lucide-react';

const SpinWheel = () => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState('');
  const [prizes] = useState([
    { id: '1', name: "10 Bonus", value: 10, type: "bonus", probability: 25, color: "#FF6B6B", icon: <Gift className="w-4 h-4" />, tier: "common" },
    { id: '2', name: "5 Spins", value: 5, type: "spins", probability: 20, color: "#4ECDC4", icon: <Zap className="w-4 h-4" />, tier: "common" },
    { id: '3', name: "25 Balance", value: 25, type: "balance", probability: 15, color: "#FFD166", icon: <Coins className="w-4 h-4" />, tier: "rare" },
    { id: '4', name: "50 Balance", value: 50, type: "balance", probability: 10, color: "#06D6A0", icon: <Coins className="w-4 h-4" />, tier: "rare" },
    { id: '5', name: "100 Bonus", value: 100, type: "bonus", probability: 8, color: "#118AB2", icon: <Gift className="w-4 h-4" />, tier: "rare" },
    { id: '6', name: "TRX 10", value: 10, type: "crypto", probability: 5, color: "#EF476F", icon: <Sparkles className="w-4 h-4" />, tier: "legendary" },
    { id: '7', name: "iPhone 15", value: 1500, type: "asset", probability: 1, color: "#9D4EDD", icon: <Trophy className="w-4 h-4" />, tier: "legendary" },
    { id: '8', name: "Try Again", value: 0, type: "none", probability: 16, color: "#6C757D", icon: <AlertCircle className="w-4 h-4" />, tier: "common" }
  ]);

  const dispatch = useDispatch();
  const { wallet } = useSelector(state => state.user);
  const spins = wallet?.spinCredits || 0;
  const balance = wallet?.mainBalance || 0;
  const wheelRef = useRef(null);

  const segmentAngle = 360 / prizes.length;

  const handleSpin = async () => {
    if (isSpinning || spins < 1) {
      setError(spins < 1 ? "Not enough spins!" : "Already spinning!");
      return;
    }

    setIsSpinning(true);
    setError('');
    setResult(null);

    try {
      const response = await api.post('/spin/play', { bet: 1 });
      const { prize } = response.data;

      // Find the index of the winning prize
      const winningIndex = prizes.findIndex(p => p.id === prize.id);
      
      // Calculate rotation: 
      // Current rotation + some full spins + the offset to the winning segment
      // Note: The wheel rotates clockwise, segments are also laid out clockwise.
      // We want the winning segment to be at the top (pointer position).
      // If index 0 is at 0 degrees, it's already at the top if the pointer is at the top.
      const extraRotations = 5;
      const targetRotation = rotation + (extraRotations * 360) + (360 - (winningIndex * segmentAngle));

      setRotation(targetRotation);

      // Wait for animation
      setTimeout(() => {
        setResult(prize);
        setIsSpinning(false);
        
        if (prize.tier === 'legendary') {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }

        // Update Redux store
        dispatch(awardPrize(prize));
        dispatch(updateBalance({ 
          type: prize.type === 'balance' ? 'mainBalance' : (prize.type === 'bonus' ? 'bonusBalance' : 'spinCredits'), 
          amount: prize.value 
        }));

      }, 4500);

    } catch (err) {
      setError(err.response?.data?.message || 'Spin failed');
      setIsSpinning(false);
    }
  };

  const getTierColor = (tier) => {
    switch(tier) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'rare': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      default: return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.1}
        />
      )}

      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Fortune Spin
            </h1>
            <p className="text-gray-400">Spin to win amazing prizes!</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-gray-800 px-6 py-3 rounded-2xl border border-gray-700">
              <div className="text-sm text-gray-400">Balance</div>
              <div className="text-2xl font-bold text-green-400">${balance}</div>
            </div>
            <div className="bg-gray-800 px-6 py-3 rounded-2xl border border-gray-700">
              <div className="text-sm text-gray-400">Spins</div>
              <div className="text-2xl font-bold text-yellow-400">{spins}</div>
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Wheel Container */}
          <div className="lg:col-span-2 flex flex-col items-center">
            <div className="relative">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[40px] border-l-transparent border-r-transparent border-t-red-600"></div>
              </div>
              
              {/* Wheel */}
              <motion.div
                ref={wheelRef}
                className="relative w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] rounded-full border-8 border-gray-800 shadow-[0_0_50px_rgba(234,179,8,0.2)] overflow-hidden"
                animate={{ rotate: rotation }}
                transition={{
                  duration: 4.5,
                  ease: [0.2, 0.8, 0.3, 1]
                }}
                style={{
                  background: `conic-gradient(${prizes
                    .map((seg, i) => `${seg.color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`)
                    .join(', ')})`
                }}
              >
                {/* Center Circle */}
                <div className="absolute inset-[35%] bg-gray-900 rounded-full border-4 border-yellow-500 z-20 flex items-center justify-center shadow-inner">
                   <div className="text-center">
                    <div className="text-lg font-bold text-yellow-500">KHELA</div>
                    <div className="text-xs text-gray-400">ZONE</div>
                  </div>
                </div>

                {/* Prize Labels */}
                {prizes.map((prize, index) => {
                  const angle = index * segmentAngle + segmentAngle / 2;
                  return (
                    <div
                      key={prize.id}
                      className="absolute top-0 left-1/2 w-1 h-1/2 origin-bottom flex justify-center pt-4"
                      style={{
                        transform: `translateX(-50%) rotate(${angle}deg)`,
                      }}
                    >
                      <div className="text-white font-bold text-xs sm:text-sm whitespace-nowrap drop-shadow-md transform -rotate-0">
                        {prize.name}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </div>

            {/* Spin Button */}
            <div className="text-center mt-12 w-full max-w-xs">
              <button
                onClick={handleSpin}
                disabled={isSpinning || spins < 1}
                className={`w-full py-4 text-xl font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                  isSpinning || spins < 1
                    ? 'bg-gray-700 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]'
                } text-white shadow-2xl flex items-center justify-center gap-3`}
              >
                {isSpinning ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    SPINNING...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    SPIN NOW ({spins})
                  </>
                )}
              </button>
              
              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            {/* Prize Result Display */}
            <AnimatePresence>
                {result && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className={`p-6 rounded-2xl ${getTierColor(result.tier)} shadow-2xl text-center border border-white/20`}
                >
                    <div className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Congratulations!</div>
                    <div className="text-3xl font-black mb-2 drop-shadow-md">YOU WON</div>
                    <div className="text-2xl font-bold bg-white/20 rounded-xl py-2 px-4 inline-block mb-2">{result.name}</div>
                    <div className="text-sm opacity-90 block">Added to your {result.type} balance</div>
                </motion.div>
                )}
            </AnimatePresence>

            {/* Prize List / Odds */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" /> Prize Pool
              </h3>
              <div className="space-y-3">
                {prizes.map(prize => (
                  <div 
                    key={prize.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-900/50 border border-gray-700 hover:border-gray-500 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${prize.color}33`, border: `1px solid ${prize.color}` }}>
                        <span style={{ color: prize.color }}>{prize.icon}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{prize.name}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-tighter">{prize.tier}</div>
                      </div>
                    </div>
                    <div className="text-xs font-mono text-gray-400">{prize.probability}%</div>
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
