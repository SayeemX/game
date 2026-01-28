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
import RedeemCodeSection from '../components/RedeemCodeSection';

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
  const { isAuthenticated, user, wallet } = useSelector(state => state.user);
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Live Wins Banner */}
      <LiveWins />

      {/* Hero Section - GameX GIFT */}
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
              {isAuthenticated ? `WELCOME BACK, ${user?.username} • ELITE STATUS ACTIVE` : 'GameX GIFT • EXCLUSIVE ARENA REWARDS'}
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-9xl font-black text-white mb-8 tracking-tighter uppercase leading-[0.8] relative"
            >
                {isAuthenticated ? (
                    <div className="flex flex-col items-center">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-gradient-x">ARENA READY.</span>
                        <div className="mt-6 w-full max-w-lg">
                            <RedeemCodeSection isCompact={true} />
                        </div>
                    </div>
                ) : (
                    <>Win Big in the <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-green-500">Ultimate</span> Arena.</>
                )}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-lg md:text-xl font-bold uppercase tracking-[0.3em] mb-12 max-w-3xl mx-auto drop-shadow-lg"
            >
                {isAuthenticated 
                    ? "Your multipliers are primed for legendary wins. Use your secret gift codes above to boost your arsenal."
                    : "Join GameX for a premium, provably fair gaming experience with instant rewards and elite challenges."
                }
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              {isAuthenticated ? (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <Link to="/spin" className="group relative px-12 py-6 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-black font-black rounded-[2rem] shadow-[0_0_40px_rgba(245,158,11,0.3)] transition-all flex items-center gap-3 uppercase tracking-[0.2em] text-xl overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                        <Sparkles className="w-6 h-6 animate-pulse" />
                        Enter Fortune Arena
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </Link>
                    <Link to="/profile" className="px-12 py-6 bg-gray-900/50 hover:bg-gray-800 text-white font-black rounded-[2rem] border-2 border-gray-800 hover:border-yellow-500/50 transition-all uppercase tracking-[0.2em] text-xl backdrop-blur-xl">
                        Elite Profile
                    </Link>
                </div>
              ) : (
                <>
                    <Link to="/register" className="group relative px-12 py-6 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-[2rem] shadow-[0_0_30px_rgba(234,179,8,0.2)] transition-all flex items-center gap-3 uppercase tracking-[0.2em] text-xl overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                        Create Elite Account
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </Link>
                    <Link to="/login" className="px-12 py-6 bg-gray-900/50 hover:bg-gray-800 text-white font-black rounded-[2rem] border-2 border-gray-800 transition-all uppercase tracking-[0.2em] text-xl backdrop-blur-xl">
                        Sign In
                    </Link>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Game Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-32 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
            <h2 className="text-5xl font-black text-white uppercase tracking-tighter">
                <span className="text-yellow-500">Premium</span> Game Floor
            </h2>
            <div className="flex p-2 bg-gray-900/50 rounded-2xl border border-gray-800 backdrop-blur-lg">
                {['all', 'original', 'slots'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-gray-500 hover:text-white'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <GameCard 
                title="Fortune Spin"
                description="The ultimate prize wheel. Spin for a chance to win massive rewards and exclusive GameX GIFT bonuses."
                path="/spin"
                icon={Sparkles}
                color="from-yellow-400 via-orange-500 to-red-600"
                players="4.8k"
            />
            <GameCard 
                title="GameX Sniper"
                description="Test your precision in this fast-paced challenge. High accuracy earns legendary GameX multipliers."
                path="/bird-shooting"
                icon={Target}
                color="from-cyan-400 via-blue-500 to-indigo-600"
                players="2.1k"
            />
            <motion.div 
                whileHover={{ y: -5 }}
                className="relative group bg-gradient-to-br from-gray-900 to-black rounded-[3rem] border-2 border-dashed border-gray-800 p-12 flex flex-col items-center justify-center text-center overflow-hidden"
            >
                <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-24 h-24 rounded-[2rem] bg-gray-800/50 flex items-center justify-center mb-8 border border-gray-700 group-hover:scale-110 transition-transform duration-500">
                    <Crown className="w-12 h-12 text-gray-600 group-hover:text-yellow-500 transition-colors" />
                </div>
                <h3 className="text-3xl font-black text-gray-500 mb-4 uppercase tracking-tighter">VIP Arena</h3>
                <p className="text-gray-600 text-xs font-black uppercase tracking-[0.2em] mb-4">Unlocking Soon</p>
                <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-gray-800 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
                    ))}
                </div>
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
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-loose">Winnings are credited to your GameX wallet instantly after every win.</p>
                </div>
                <div className="p-8 rounded-3xl bg-[#1a2c38]/30 border border-gray-800">
                    <Users className="w-10 h-10 text-yellow-500 mb-6" />
                    <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Elite Club</h3>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-loose">Join high-stakes tournaments and exclusive GameX GIFT drops.</p>
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