import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Sparkles } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const LiveWins = () => {
  const { socket } = useContext(AuthContext);
  const [wins, setWins] = useState([
    { id: 1, user: 'GameX_Pro', game: 'Fortune Spin', amount: '125.50', multiplier: '12.5x', color: 'text-yellow-500' },
    { id: 2, user: 'Rabbix_77', game: 'GameX Sniper', amount: '42.20', multiplier: '4.2x', color: 'text-blue-500' },
    { id: 3, user: 'Karim_Boss', game: 'Fortune Spin', amount: '840.00', multiplier: '84x', color: 'text-green-500' },
    { id: 4, user: 'Elite_Player', game: 'GameX Sniper', amount: '15.00', multiplier: '1.5x', color: 'text-purple-500' },
  ]);

  const timeoutRef = useRef(null);

  useEffect(() => {
    if (socket) {
        socket.on('live_win', (data) => {
            const newWin = {
                id: Date.now(),
                user: data.username,
                game: data.game,
                amount: data.amount.toFixed(2),
                multiplier: data.multiplier + 'x',
                color: data.amount > 100 ? 'text-yellow-500' : 'text-[#3bc117]'
            };
            setWins(prev => [newWin, ...prev.slice(0, 9)]);
        });
    }

    const generateWin = () => {
      const prefixes = ['Sayeem', 'Elite', 'Alpha', 'Crypto', 'Winner', 'King', 'Shadow', 'Neon', 'Turbo', 'Mega', 'Sohan', 'Rakib', 'Fahim', 'Nabil', 'Arif'];
      const suffixes = ['_X', 'X', '_Pro', '77', '_Elite', 'Boss', '_99', 'King', '_Master', '007', '_Sniper', '_Arena'];
      const games = ['Fortune Spin', 'GameX Sniper'];
      
      const user = prefixes[Math.floor(Math.random() * prefixes.length)] + 
                   suffixes[Math.floor(Math.random() * suffixes.length)];
      
      const game = games[Math.floor(Math.random() * games.length)];
      const mult = (1.5 + Math.random() * 10).toFixed(1);
      const amount = (mult * (2 + Math.random() * 5)).toFixed(2);
      
      const newWin = {
        id: Date.now() + Math.random(),
        user,
        game,
        amount,
        multiplier: mult + 'x',
        color: ['text-yellow-500', 'text-blue-500', 'text-[#3bc117]', 'text-purple-500', 'text-orange-500'][Math.floor(Math.random() * 5)]
      };

      setWins(prev => [newWin, ...prev.slice(0, 9)]);
      
      // Schedule next win at a random interval between 5-15 seconds (less frequent if fake)
      const nextTime = 5000 + Math.random() * 10000;
      timeoutRef.current = setTimeout(generateWin, nextTime);
    };

    timeoutRef.current = setTimeout(generateWin, 3000);

    return () => {
        clearTimeout(timeoutRef.current);
        if (socket) socket.off('live_win');
    };
  }, [socket]);

  return (
    <div className="w-full bg-[#1a2c38]/30 backdrop-blur-md border-y border-gray-800 overflow-hidden py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Live Wins
            </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
                {wins.slice(0, 4).map((win) => (
                    <motion.div
                        key={win.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-[#1a2c38] p-4 rounded-2xl border border-gray-800 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                                <Trophy className={`w-4 h-4 ${win.color}`} />
                            </div>
                            <div>
                                <div className="text-xs font-black text-white truncate max-w-[80px]">{win.user}</div>
                                <div className="text-[9px] text-gray-500 font-bold uppercase">{win.game}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-xs font-black ${win.color}`}>+{win.amount} TRX</div>
                            <div className="text-[9px] text-gray-600 font-bold">{win.multiplier}</div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LiveWins;