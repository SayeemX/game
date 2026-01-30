import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import SpinWheel from '../components/SpinWheel';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, History, Wallet, Trophy } from 'lucide-react';

const GameRoom = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const [redeemCode, setRedeemCode] = useState('');
  const [message, setMessage] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(null);
  const [resultIndex, setResultIndex] = useState(null);
  const [verification, setVerification] = useState(null);

  const handleRedeem = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/game/redeem', { code: redeemCode });
      setMessage(`Code Accepted!`);
      setRedeemCode('');
      refreshUser();
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Redemption Failed');
    }
  };

  const handleSpin = async () => {
    if (user.wallet.spinCredits < 1) {
      setMessage("Insufficient Credits");
      return;
    }

    setIsSpinning(true);
    setMessage('');
    setLastWin(null);
    setResultIndex(null);
    setVerification(null);

    try {
      const res = await axios.post('/api/game/spin', { clientSeed: localStorage.getItem('clientSeed') || 'default' });
      const { prize, verification: verifyData } = res.data;
      
      // Land on ID (matching the index in our wheel)
      setResultIndex(prize.id);
      
      // Wait for animation to finish (4s in SpinWheel)
      setTimeout(() => {
        setLastWin(prize);
        setVerification(verifyData);
        refreshUser();
        setIsSpinning(false);
      }, 4500);

    } catch (err) {
      setIsSpinning(false);
      setMessage(err.response?.data?.msg || 'Connection Error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8">
      
      {/* Dashboard Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <StatCard icon={<Wallet className="text-yellow-400"/>} label="Main Balance" value={`${user?.wallet?.mainBalance || 0} COINS`} color="border-yellow-500/20" />
        <StatCard icon={<Trophy className="text-game-accent"/>} label="Spin Credits" value={typeof user?.wallet?.spinCredits === 'object' ? user.wallet.spinCredits.BRONZE : (user?.wallet?.spinCredits || 0)} color="border-game-accent/20" />
        <StatCard icon={<History className="text-game-secondary"/>} label="Items Won" value={user?.inventory?.length || 0} color="border-game-secondary/20" />
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        
        {/* Left: The Game */}
        <div className="lg:col-span-7 flex flex-col items-center bg-gray-900/40 rounded-3xl p-6 border border-white/5 shadow-inner">
            <SpinWheel onSpin={handleSpin} isSpinning={isSpinning} resultIndex={resultIndex} />
            
            <AnimatePresence>
                {lastWin && (
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }}
                        className="mt-8 w-full max-w-sm bg-gradient-to-br from-gray-800 to-black p-6 rounded-2xl border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                    >
                        <p className="text-center text-yellow-500 font-bold uppercase tracking-widest text-sm mb-2">Victory Declared</p>
                        <h2 className="text-center text-4xl font-black text-white mb-4">+{lastWin.label}</h2>
                        
                        {verification && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <button 
                                    onClick={() => alert(`Verification Hash: ${verification.hash}`)}
                                    className="flex items-center justify-center w-full text-[10px] text-gray-500 hover:text-game-accent transition"
                                >
                                    <ShieldCheck size={12} className="mr-1"/> VERIFY FAIRNESS (RNG HASH)
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Right: Controls & Info */}
        <div className="lg:col-span-5 space-y-6">
            
            {/* Redemption Section */}
            <div className="bg-gray-800/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                    <span className="w-2 h-2 bg-game-accent rounded-full mr-2"></span>
                    TOP UP CREDITS
                </h3>
                <form onSubmit={handleRedeem} className="flex gap-2">
                    <input 
                        type="text" 
                        value={redeemCode}
                        onChange={(e) => setRedeemCode(e.target.value)}
                        placeholder="ENTER PROMO CODE"
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-game-accent outline-none text-white text-sm"
                    />
                    <button 
                        type="submit"
                        className="bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-game-accent hover:text-white transition text-sm"
                    >
                        APPLY
                    </button>
                </form>
                {message && <p className="mt-3 text-xs text-game-accent font-medium uppercase tracking-wider">{message}</p>}
            </div>

            {/* Inventory / Recent Activity */}
            <div className="bg-gray-800/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                    <span className="w-2 h-2 bg-game-secondary rounded-full mr-2"></span>
                    RECENT REWARDS
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {user?.inventory?.length === 0 ? (
                        <div className="text-center py-10 text-gray-600 text-sm italic">Nothing won yet. Take a spin!</div>
                    ) : (
                        [...user.inventory].reverse().map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                <div>
                                    <p className="text-white font-bold text-sm">{item.itemName}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">{new Date(item.wonAt).toLocaleDateString()}</p>
                                </div>
                                <span className="text-[10px] bg-game-secondary/20 text-game-secondary px-2 py-1 rounded-md font-bold uppercase tracking-tighter">
                                    {item.itemType}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className={`bg-gray-800/40 p-5 rounded-2xl border ${color} flex items-center gap-4`}>
    <div className="p-3 bg-black/40 rounded-xl">{icon}</div>
    <div>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-white">{value}</p>
    </div>
  </div>
);

export default GameRoom;