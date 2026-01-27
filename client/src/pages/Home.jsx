import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Gamepad2, 
  Trophy, 
  Zap, 
  Gift, 
  ShieldCheck, 
  TrendingUp, 
  Users,
  Play,
  ArrowRight,
  Crown,
  Target,
  ChevronRight
} from 'lucide-react';
import LiveWins from '../components/LiveWins';

const GameCard = ({ title, description, path, icon: Icon, color, players }) => (
  <motion.div 
    whileHover={{ y: -5, scale: 1.02 }}
    className="relative group overflow-hidden bg-[#1a2c38] rounded-3xl border border-gray-800 hover:border-yellow-500/50 transition-all duration-300"
  >
    <Link to={path} className="block p-8">
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">{title}</h3>
      <p className="text-gray-500 text-sm font-medium leading-relaxed mb-6">{description}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-[#1a2c38] bg-gray-700"></div>
                ))}
            </div>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{players} PLAYING</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-black shadow-xl opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
            <Play className="w-5 h-5 fill-current" />
        </div>
      </div>
    </Link>
  </motion.div>
);

const Home = () => {
  const { isAuthenticated } = useSelector(state => state.user);
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Live Wins Banner */}
      <LiveWins />

      {/* Hero Section - SayeemX GIFT */}
      <section className="relative pt-12 pb-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-yellow-500/20 to-transparent blur-3xl rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8"
            >
              <Gift className="w-4 h-4" />
              SayeemX GIFT • EXCLUSIVE ARENA REWARDS
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter uppercase leading-[0.9]"
            >
                Win Big in the <span className="text-yellow-500">Ultimate</span> Arena.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-500 text-lg md:text-xl font-bold uppercase tracking-wide mb-12 max-w-2xl mx-auto"
            >
                Join SayeemX for a premium, provably fair gaming experience with instant rewards and elite challenges.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {isAuthenticated ? (
                <Link to="/spin" className="group px-10 py-5 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl shadow-2xl transition-all flex items-center gap-3 uppercase tracking-widest text-lg">
                    Enter the Arena
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                    <Link to="/register" className="group px-10 py-5 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl shadow-2xl transition-all flex items-center gap-3 uppercase tracking-widest text-lg">
                        Create Elite Account
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link to="/login" className="px-10 py-5 bg-gray-900 hover:bg-gray-800 text-white font-black rounded-2xl border border-gray-800 transition-all uppercase tracking-widest text-lg">
                        Sign In
                    </Link>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Game Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-32">
        <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Featured Games</h2>
            <div className="flex gap-2">
                {['all', 'original', 'slots'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-yellow-500 text-black' : 'bg-gray-900 text-gray-500 border border-gray-800 hover:border-gray-700'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <GameCard 
                title="Fortune Spin"
                description="The ultimate prize wheel. Spin for a chance to win massive rewards and exclusive SayeemX GIFT bonuses."
                path="/spin"
                icon={Sparkles}
                color="from-yellow-500 to-orange-500"
                players="1.2k"
            />
            <GameCard 
                title="Bird Shoot"
                description="Test your precision in this fast-paced challenge. High accuracy earns legendary SayeemX multipliers."
                path="/bird-shooting"
                icon={Target}
                color="from-blue-500 to-cyan-500"
                players="450"
            />
            <motion.div 
                className="relative bg-[#1a2c38] rounded-3xl border border-gray-800/50 p-8 flex flex-col items-center justify-center text-center opacity-60"
            >
                <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mb-6">
                    <Crown className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-400 mb-2 uppercase tracking-tighter">New Game</h3>
                <p className="text-gray-600 text-sm font-bold uppercase tracking-widest">Coming Soon to SayeemX</p>
            </motion.div>
        </div>
      </section>

      {/* Trust & Features */}
      <section className="bg-black py-32 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="p-8 rounded-3xl bg-[#1a2c38]/30 border border-gray-800">
                    <ShieldCheck className="w-10 h-10 text-yellow-500 mb-6" />
                    <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Provably Fair</h3>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-loose">Cryptographic verification for every result. 100% Transparent.</p>
                </div>
                <div className="p-8 rounded-3xl bg-[#1a2c38]/30 border border-gray-800">
                    <Zap className="w-10 h-10 text-yellow-500 mb-6" />
                    <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Instant Payout</h3>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-loose">Winnings are credited to your SayeemX wallet instantly after every win.</p>
                </div>
                <div className="p-8 rounded-3xl bg-[#1a2c38]/30 border border-gray-800">
                    <Users className="w-10 h-10 text-yellow-500 mb-6" />
                    <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Elite Club</h3>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-loose">Join high-stakes tournaments and exclusive SayeemX GIFT drops.</p>
                </div>
                <div className="p-8 rounded-3xl bg-[#1a2c38]/30 border border-gray-800">
                    <TrendingUp className="w-10 h-10 text-yellow-500 mb-6" />
                    <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">High Volatility</h3>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-loose">Games designed for massive multipliers. Win up to 5000x your wager.</p>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
};

export default Home;