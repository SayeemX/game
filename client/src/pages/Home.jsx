import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  TrendingUp, 
  Users, 
  Trophy, 
  Zap, 
  Target,
  Shield,
  Sparkles,
  Gamepad2,
  Clock,
  DollarSign,
  Crown,
  ChevronRight
} from 'lucide-react';

const GameCard = ({ game }) => (
  <Link to={game.path} className={`group relative bg-gray-900 border border-gray-800 rounded-3xl p-6 transition-all duration-300 hover:border-yellow-500/50 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)] overflow-hidden ${game.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${game.color} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`}></div>
    
    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-6 shadow-lg`}>
      <span className="text-white">{game.icon}</span>
    </div>
    
    <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-white">
      {game.name}
      {game.comingSoon && <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">SOON</span>}
    </h3>
    <p className="text-gray-500 text-sm mb-6 leading-relaxed">{game.description}</p>
    
    <div className="flex items-center justify-between mt-auto">
      <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {game.players}</span>
        <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" /> Min ${game.minBet}</span>
      </div>
      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-black transition-colors">
        <ChevronRight className="w-5 h-5" />
      </div>
    </div>
  </Link>
);

const Home = () => {
  const { isAuthenticated } = useSelector(state => state.user);
  const [activePlayers, setActivePlayers] = useState(1247);
  const [totalWinsToday, setTotalWinsToday] = useState(54890);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePlayers(prev => prev + Math.floor(Math.random() * 5) - 2);
      setTotalWinsToday(prev => prev + Math.floor(Math.random() * 50));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const games = [
    {
      id: 1,
      name: 'Fortune Spin',
      description: 'Spin the high-stakes wheel to win balanced prizes and exclusive bonuses.',
      path: '/spin',
      icon: <Sparkles className="w-7 h-7" />,
      color: 'from-yellow-400 to-orange-600',
      players: 542,
      minBet: 1,
      maxWin: 10000
    },
    {
      id: 2,
      name: 'Bird Shooting',
      description: 'Test your reflexes and precision. Higher accuracy means bigger rewards.',
      path: '/bird-shooting',
      icon: <Target className="w-7 h-7" />,
      color: 'from-green-400 to-emerald-600',
      players: 387,
      minBet: 10,
      maxWin: 5000
    },
    {
      id: 3,
      name: 'Carrom Pro',
      description: 'Classic multiplayer board game action. Competitive skill-based matching.',
      path: '#',
      icon: <Gamepad2 className="w-7 h-7" />,
      color: 'from-purple-500 to-pink-600',
      players: 0,
      minBet: 20,
      maxWin: 10000,
      comingSoon: true
    },
    {
      id: 4,
      name: 'Elite Cards',
      description: 'Strategic poker and traditional variants with real-time multiplayer.',
      path: '#',
      icon: <Crown className="w-7 h-7" />,
      color: 'from-blue-500 to-cyan-600',
      players: 0,
      minBet: 50,
      maxWin: 50000,
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-500/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-full mb-8">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-black text-yellow-500 uppercase tracking-widest">Global Rewards Live</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tighter">
              WIN THE <span className="bg-gradient-to-r from-yellow-400 to-orange-600 bg-clip-text text-transparent">FUTURE</span>
              <br />
              OF GAMING
            </h1>
            
            <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              Experience the world's most advanced provably fair gaming platform. 
              Real-time payouts, crypto integration, and elite rewards.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
              <Link
                to="/spin"
                className="px-10 py-5 bg-yellow-500 text-black rounded-2xl text-lg font-black hover:bg-yellow-400 transition-all shadow-[0_0_30px_rgba(234,179,8,0.3)]"
              >
                PLAY NOW
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="px-10 py-5 bg-gray-900 border border-gray-800 rounded-2xl text-lg font-black hover:bg-gray-800 transition-all"
                >
                  GET $10 FREE
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
                <div className="text-center">
                    <div className="text-3xl font-black text-white mb-1">{activePlayers.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Active Players</div>
                </div>
                <div className="text-center border-l border-gray-800">
                    <div className="text-3xl font-black text-yellow-500 mb-1">${totalWinsToday.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Paid Out Today</div>
                </div>
                <div className="text-center border-l border-gray-800">
                    <div className="text-3xl font-black text-white mb-1">99.9%</div>
                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Uptime Proof</div>
                </div>
                <div className="text-center border-l border-gray-800">
                    <div className="text-3xl font-black text-white mb-1">24/7</div>
                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Elite Support</div>
                </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Games Grid */}
      <section className="py-24 bg-gray-950/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
            <div>
                <h2 className="text-4xl font-black mb-4">FEATURED ARENA</h2>
                <p className="text-gray-500">Discover our range of provably fair skill and luck-based games.</p>
            </div>
            <Link to="/games" className="text-yellow-500 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                VIEW ALL GAMES <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust/Features */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-8">
                        <Shield className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-4 uppercase">PROVABLY FAIR</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Every outcome is verifiable on the blockchain. We use industry-standard cryptographic hashes to ensure total transparency.
                    </p>
                </div>
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-8">
                        <Zap className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-4 uppercase">INSTANT PAYOUTS</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        No waiting periods. Your winnings are processed instantly via our automated settlement layer and blockchain bridges.
                    </p>
                </div>
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-8">
                        <TrendingUp className="w-8 h-8 text-yellow-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-4 uppercase">HIGH REWARDS</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        KhelaZone offers the highest RTP in the industry. Our community-first approach ensures more winners, more often.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-24 border-t border-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-black mb-8">JOIN THE REVOLUTION</h2>
            <p className="text-gray-500 mb-12">Start your journey today and claim your welcome bonus package.</p>
            <div className="flex flex-wrap justify-center gap-6 opacity-30">
                <div className="flex items-center gap-2 font-bold text-xs"><Clock className="w-4 h-4" /> 100% SECURE</div>
                <div className="flex items-center gap-2 font-bold text-xs"><DollarSign className="w-4 h-4" /> ZERO FEES</div>
                <div className="flex items-center gap-2 font-bold text-xs"><Users className="w-4 h-4" /> ELITE COMMUNITY</div>
            </div>
        </div>
      </section>
    </div>
  );
};

export default Home;