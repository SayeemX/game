import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  User, 
  Wallet, 
  Trophy, 
  Zap, 
  Calendar, 
  Shield, 
  TrendingUp, 
  ArrowUpRight,
  Settings,
  History
} from 'lucide-react';

const Profile = () => {
  const { user, wallet, stats } = useSelector(state => state.user);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <p className="text-white font-black uppercase tracking-widest">Loading Elite Profile...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Wins', value: stats.totalWins || 0, icon: Trophy, color: 'text-yellow-500' },
    { label: 'Biggest Win', value: `$${(stats.biggestWin || 0).toFixed(2)}`, icon: Zap, color: 'text-blue-500' },
    { label: 'Total Spins', value: stats.totalSpins || 0, icon: TrendingUp, color: 'text-green-500' },
    { label: 'Main Balance', value: `$${(wallet.mainBalance || 0).toFixed(2)}`, icon: Wallet, color: 'text-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header Section */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent blur-3xl -z-10"></div>
          <div className="flex flex-col md:flex-row items-center gap-8 p-10 bg-[#1a2c38] border border-gray-800 rounded-[3rem]">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-black text-4xl font-black shadow-2xl">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter">{user.username}</h1>
                <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                  <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">ELITE LEVEL</span>
                </div>
              </div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-sm flex items-center justify-center md:justify-start gap-2">
                <Shield className="w-4 h-4" /> Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-4">
              <button className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-2xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                <Settings className="w-4 h-4" /> Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statCards.map((stat, index) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#1a2c38] border border-gray-800 p-8 rounded-[2rem] hover:border-gray-700 transition-all group"
            >
              <stat.icon className={`w-8 h-8 ${stat.color} mb-6 group-hover:scale-110 transition-transform`} />
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black uppercase tracking-tighter">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Wallet Breakdown */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#1a2c38] border border-gray-800 rounded-[3rem] overflow-hidden">
              <div className="p-8 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <Wallet className="w-6 h-6 text-yellow-500" /> Wallet Overview
                </h2>
                <button className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em] hover:underline">Transaction History</button>
              </div>
              <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Main Balance</p>
                    <p className="text-4xl font-black text-white">${wallet.mainBalance.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Bonus Balance</p>
                    <p className="text-2xl font-black text-gray-300">${wallet.bonusBalance.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex flex-col justify-end gap-4">
                  <button className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-yellow-500/10 transition-all">Deposit Funds</button>
                  <button className="w-full py-4 bg-black border border-gray-800 hover:border-gray-700 text-white font-black rounded-2xl uppercase tracking-widest transition-all">Withdraw</button>
                </div>
              </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="bg-[#1a2c38] border border-gray-800 rounded-[3rem] p-8">
              <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 mb-8">
                <History className="w-6 h-6 text-yellow-500" /> Recent Games
              </h2>
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-800 rounded-3xl">
                <TrendingUp className="w-12 h-12 text-gray-700 mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No recent game history found</p>
                <button className="mt-4 text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em]">Start playing now</button>
              </div>
            </div>
          </div>

          {/* Side Info */}
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-[3rem] p-10 text-black">
              <Gift className="w-12 h-12 mb-6" />
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">SayeemX GIFT Program</h3>
              <p className="font-bold text-sm leading-relaxed mb-8 opacity-90">Unlock exclusive rewards, daily bonuses, and higher multipliers by reaching the next Elite level.</p>
              <button className="w-full py-4 bg-black text-white font-black rounded-2xl uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-2">
                View Rewards <ArrowUpRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
