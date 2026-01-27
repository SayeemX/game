import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Sparkles } from 'lucide-react';

const LiveWins = () => {
  const [wins, setWins] = useState([
    { id: 1, user: 'Sayeem_Elite', game: 'Fortune Spin', amount: '250.00', multiplier: '25x', color: 'text-yellow-500' },
    { id: 2, user: 'Alpha_Gx', game: 'Bird Shoot', amount: '45.20', multiplier: '4.5x', color: 'text-blue-500' },
    { id: 3, user: 'CryptoKing', game: 'Fortune Spin', amount: '1,200.00', multiplier: '120x', color: 'text-green-500' },
    { id: 4, user: 'ZeroCool', game: 'Fortune Spin', amount: '80.00', multiplier: '8x', color: 'text-purple-500' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const games = ['Fortune Spin', 'Bird Shoot'];
      const users = ['Sayeem_X', 'Player_99', 'Winner_Pro', 'Lucky_One', 'Sayeem_Fan', 'Ghost_Rider'];
      const amounts = [10.50, 50.00, 120.00, 500.00, 1500.00, 5.00];
      
      const newWin = {
        id: Date.now(),
        user: users[Math.floor(Math.random() * users.length)],
        game: games[Math.floor(Math.random() * games.length)],
        amount: amounts[Math.floor(Math.random() * amounts.length)].toFixed(2),
        multiplier: (Math.random() * 50).toFixed(1) + 'x',
        color: ['text-yellow-500', 'text-blue-500', 'text-green-500', 'text-purple-500'][Math.floor(Math.random() * 4)]
      };

      setWins(prev => [newWin, ...prev.slice(0, 9)]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

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
                            <div className={`text-xs font-black ${win.color}`}>+${win.amount}</div>
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