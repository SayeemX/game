import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Menu, 
  X,
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Terminal,
  Settings,
  Gift,
  Gamepad2,
  Sparkles,
  Trophy,
  Target,
  ShoppingBag,
  Database,
  Wallet as WalletIcon
} from 'lucide-react';
import { logout } from '../../redux/slices/userSlice';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated, wallet } = useSelector(state => state.user);

  const handleLogout = () => {
    dispatch(logout());
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  return (
    <nav className="bg-[#0f212e] border-b border-gray-800/50 h-20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-full">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform">
                <Gamepad2 className="w-6 h-6 text-black" />
            </div>
            <span className="font-black text-2xl tracking-tighter uppercase text-white">Game<span className="text-yellow-500">X</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {[
                { label: 'Home', path: '/', icon: Gift },
                { label: 'Spin', path: '/spin', icon: Sparkles },
                { label: 'Shoot', path: '/bird-shooting', icon: Target },
                { label: 'Shop', path: '/store', icon: ShoppingBag },
                { label: 'Elite', path: '/', icon: Trophy },
            ].map((item) => (
                <Link 
                    key={item.label}
                    to={item.path} 
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${location.pathname === item.path ? 'text-yellow-500' : 'text-gray-400 hover:text-white'}`}
                >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {/* Wallet */}
                <Link to="/wallet" className="flex items-center gap-2 sm:gap-3 bg-black/40 border border-gray-800 hover:border-yellow-500/50 rounded-2xl p-1 sm:p-1.5 pr-2 sm:pr-4 transition-all">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20">
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[6px] sm:text-[8px] font-black text-gray-500 uppercase tracking-widest">Balance</span>
                        <span className="text-[10px] sm:text-sm font-black text-white whitespace-nowrap">{wallet.mainBalance.toFixed(2)} TRX</span>
                    </div>
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 bg-[#1a2c38] hover:bg-[#223947] border border-gray-800 p-1.5 rounded-2xl transition-all"
                    >
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-black font-black text-xs">
                            {user?.username?.substring(0, 2).toUpperCase()}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isProfileOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute right-0 mt-3 w-64 bg-[#1a2c38] border border-gray-800 rounded-3xl shadow-2xl py-4 z-50 overflow-hidden"
                            >
                                <div className="px-6 py-4 border-b border-gray-800 mb-2">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Elite Member</p>
                                    <p className="text-lg font-black text-white truncate">{user?.username}</p>
                                </div>
                                <div className="px-2">
                                    {user?.role === 'admin' && (
                                        <Link to="/admin" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-xs font-black text-yellow-500 hover:bg-yellow-500/10 rounded-2xl transition-all uppercase tracking-widest">
                                            <Database className="w-4 h-4" /> Command Center
                                        </Link>
                                    )}
                                    <Link to="/wallet" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-xs font-black text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all uppercase tracking-widest">
                                        <WalletIcon className="w-4 h-4" /> My Wallet
                                    </Link>
                                    <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-xs font-black text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all uppercase tracking-widest">
                                        <UserIcon className="w-4 h-4" /> Your Profile
                                    </Link>
                                    <Link to="/settings" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-xs font-black text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all uppercase tracking-widest">
                                        <Settings className="w-4 h-4" /> Settings
                                    </Link>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-red-500 hover:bg-red-500/10 rounded-2xl transition-all uppercase tracking-widest"
                                    >
                                        <LogOut className="w-4 h-4" /> Sign Out
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="hidden sm:block text-[10px] font-black text-gray-400 hover:text-white uppercase tracking-widest transition-colors">Sign In</Link>
                <Link to="/register" className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black text-[10px] font-black rounded-xl shadow-lg shadow-yellow-500/10 transition-all uppercase tracking-widest">Sign Up</Link>
              </div>
            )}
            
            {/* Mobile Menu Toggle */}
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 text-gray-400 hover:text-white"
            >
                {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
            <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden bg-[#0f212e] border-b border-gray-800 overflow-hidden"
            >
                <div className="px-4 py-8 space-y-6">
                    <div className="flex flex-col gap-4">
                        {user?.role === 'admin' && (
                            <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="text-sm font-black text-yellow-500 uppercase tracking-widest">Admin Panel</Link>
                        )}
                        {isAuthenticated && (
                            <Link to="/wallet" onClick={() => setIsMenuOpen(false)} className="text-sm font-black text-gray-400 uppercase tracking-widest">My Wallet</Link>
                        )}
                        <Link to="/store" onClick={() => setIsMenuOpen(false)} className="text-sm font-black text-gray-400 uppercase tracking-widest">Shop</Link>
                        <Link to="/spin" onClick={() => setIsMenuOpen(false)} className="text-sm font-black text-gray-400 uppercase tracking-widest">Spin</Link>
                        <Link to="/bird-shooting" onClick={() => setIsMenuOpen(false)} className="text-sm font-black text-gray-400 uppercase tracking-widest">Shoot</Link>
                        <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-sm font-black text-gray-400 uppercase tracking-widest">Leaderboard</Link>
                        
                        {!isAuthenticated && (
                            <div className="flex flex-col gap-4 pt-4 border-t border-gray-800">
                                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-sm font-black text-gray-400 uppercase tracking-widest">Sign In</Link>
                                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="px-6 py-4 bg-yellow-500 text-black text-sm font-black rounded-xl text-center uppercase tracking-widest">Sign Up</Link>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;