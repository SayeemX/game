import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
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
  History,
  Gift,
  Copy,
  CheckCircle2,
  Share2,
  ShoppingBag
} from 'lucide-react';

const Profile = () => {
  const { user, wallet, stats } = useSelector(state => state.user);
  const [copied, setCopied] = useState({ code: false, link: false });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <p className="text-white font-black uppercase tracking-widest">Loading Elite Profile...</p>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/register?ref=${user.referralCode}`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [type]: true });
    setTimeout(() => setCopied({ ...copied, [type]: false }), 2000);
  };

  const statCards = [
    { label: 'Total Wins', value: stats.totalWins || 0, icon: Trophy, color: 'text-yellow-500' },
    { label: 'Biggest Win', value: `${(stats.biggestWin || 0).toFixed(2)} TRX`, icon: Zap, color: 'text-blue-500' },
    { label: 'Total Spins', value: stats.totalSpins || 0, icon: TrendingUp, color: 'text-green-500' },
    { label: 'Main Balance', value: `${(wallet.mainBalance || 0).toFixed(2)} TRX`, icon: Wallet, color: 'text-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pt-8 sm:pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header Section */}
        <div className="relative mb-8 sm:mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent blur-3xl -z-10"></div>
          <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 p-6 sm:p-10 bg-[#1a2c38] border border-gray-800 rounded-[2rem] sm:rounded-[3rem]">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-black text-3xl sm:text-4xl font-black shadow-2xl">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 sm:gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter">{user.username}</h1>
                <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                  <span className="text-[8px] sm:text-[10px] font-black text-yellow-500 uppercase tracking-widest">ELITE LEVEL</span>
                </div>
              </div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] sm:text-sm flex items-center justify-center md:justify-start gap-2">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4" /> Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest">
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" /> Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {statCards.map((stat, index) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#1a2c38] border border-gray-800 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] hover:border-gray-700 transition-all group"
            >
              <stat.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${stat.color} mb-4 sm:mb-6 group-hover:scale-110 transition-transform`} />
              <p className="text-gray-500 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tighter">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
          {/* Wallet Breakdown */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <div className="bg-[#1a2c38] border border-gray-800 rounded-[2rem] sm:rounded-[3rem] overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" /> Wallet Overview
                </h2>
                <button className="text-yellow-500 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] hover:underline">Transaction History</button>
              </div>
              <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
                <div className="space-y-4 sm:space-y-6 text-center sm:text-left">
                  <div>
                    <p className="text-gray-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-2">Main Balance</p>
                    <p className="text-3xl sm:text-4xl font-black text-white">{wallet.mainBalance.toFixed(2)} TRX</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-2">Bonus Balance</p>
                    <p className="text-xl sm:text-2xl font-black text-gray-300">{wallet.bonusBalance.toFixed(2)} TRX</p>
                  </div>
                </div>
                <div className="flex flex-col justify-end gap-3 sm:gap-4">
                  <button className="w-full py-3 sm:py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl sm:rounded-2xl uppercase tracking-widest shadow-xl shadow-yellow-500/10 transition-all text-xs sm:text-sm">Deposit Funds</button>
                  <button className="w-full py-3 sm:py-4 bg-black border border-gray-800 hover:border-gray-700 text-white font-black rounded-xl sm:rounded-2xl uppercase tracking-widest transition-all text-xs sm:text-sm">Withdraw</button>
                </div>
              </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="bg-[#1a2c38] border border-gray-800 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8">
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tighter flex items-center gap-3 mb-6 sm:mb-8">
                <History className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" /> Recent Games
              </h2>
              <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-center border-2 border-dashed border-gray-800 rounded-2xl sm:rounded-3xl">
                <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-gray-700 mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] sm:text-sm px-4">No recent game history found</p>
                <button className="mt-4 text-yellow-500 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Start playing now</button>
              </div>
            </div>

            {/* Elite Inventory */}
            <div className="bg-[#1a2c38] border border-gray-800 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" /> Elite Inventory
                </h2>
                <Link to="/store" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all">Buy More</Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ammo Status */}
                <div className="bg-black/20 border border-gray-800 p-6 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Zap className="w-6 h-6 text-orange-500" />
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ammunition</p>
                      <p className="font-black text-white uppercase">{user.inventory?.items?.find(i => i.itemKey === 'arrow')?.amount || 0} Arrows</p>
                    </div>
                  </div>
                </div>
                <div className="bg-black/20 border border-gray-800 p-6 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Target className="w-6 h-6 text-[#3bc117]" />
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Equipped</p>
                      <p className="font-black text-white uppercase">{user.inventory?.equippedWeapon?.replace(/_/g, ' ') || 'Basic Bow'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side Info */}
          <div className="space-y-6 sm:space-y-8">
            {/* Referral Card */}
            <div className="bg-[#1a2c38] border border-gray-800 rounded-[2rem] p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3bc117]/10 rounded-xl flex items-center justify-center border border-[#3bc117]/20">
                  <Share2 className="w-5 h-5 text-[#3bc117]" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Referral Arena</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Your Referral Code</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-black/40 border border-gray-800 rounded-xl px-4 py-3 font-black text-lg tracking-widest text-[#3bc117]">
                      {user.referralCode}
                    </div>
                    <button 
                      onClick={() => copyToClipboard(user.referralCode, 'code')}
                      className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all"
                    >
                      {copied.code ? <CheckCircle2 className="w-5 h-5 text-[#3bc117]" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Invitation Link</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-black/40 border border-gray-800 rounded-xl px-4 py-3 font-bold text-xs truncate text-gray-400">
                      {referralLink}
                    </div>
                    <button 
                      onClick={() => copyToClipboard(referralLink, 'link')}
                      className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all"
                    >
                      {copied.link ? <CheckCircle2 className="w-5 h-5 text-[#3bc117]" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase">
                  Invite your friends and earn <span className="text-yellow-500">10% commission</span> on every win they make in the GameX Arena.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-10 text-black">
              <Gift className="w-10 h-10 sm:w-12 sm:h-12 mb-4 sm:mb-6" />
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter mb-4">GameX GIFT Program</h3>
              <p className="font-bold text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8 opacity-90">Unlock exclusive rewards, daily bonuses, and higher multipliers by reaching the next Elite level.</p>
              <button className="w-full py-3 sm:py-4 bg-black text-white font-black rounded-xl sm:rounded-2xl uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm">
                View Rewards <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
