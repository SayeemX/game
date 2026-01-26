import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Home, 
  Gamepad2, 
  Wallet, 
  Trophy, 
  User,
  LogOut,
  Menu,
  X,
  Coins,
  Sparkles
} from 'lucide-react';
import { logout } from '../../redux/slices/userSlice';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, wallet, isAuthenticated } = useSelector(state => state.user);

  const navItems = [
    { path: '/', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { path: '/spin', label: 'Spin', icon: <Sparkles className="w-5 h-5" /> },
    { path: '/bird-shooting', label: 'Bird Shooting', icon: <Gamepad2 className="w-5 h-5" /> },
    { path: '/leaderboard', label: 'Leaderboard', icon: <Trophy className="w-5 h-5" /> },
  ];

  const handleLogout = () => {
    dispatch(logout());
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                KhelaZone
              </h1>
              <p className="text-xs text-gray-400">Win Real Prizes</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  location.pathname === item.path
                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Wallet & User */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-800 px-4 py-2 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="font-bold text-white">${wallet.mainBalance}</span>
                    </div>
                    <div className="text-xs text-gray-400 text-center">Balance</div>
                  </div>
                  <div className="bg-gray-800 px-4 py-2 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-white">{wallet.spinCredits}</span>
                    </div>
                    <div className="text-xs text-gray-400 text-center">Spins</div>
                  </div>
                </div>
                
                <div className="relative group">
                  <button className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-xl hover:bg-gray-700">
                    <User className="w-5 h-5" />
                    <span>{user?.username}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all">
                    <Link to="/profile" className="block px-4 py-3 hover:bg-gray-800 rounded-t-xl">
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 hover:bg-red-500/20 text-red-400 rounded-b-xl"
                    >
                      <LogOut className="inline w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex space-x-3">
                <Link
                  to="/login"
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 rounded-xl transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-gray-800 hover:bg-gray-700"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-800">
            <div className="space-y-2 pt-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                    location.pathname === item.path
                      ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-3">
                    <div className="text-gray-400 text-sm mb-2">Balance</div>
                    <div className="flex items-center space-x-2">
                      <Coins className="w-5 h-5 text-yellow-400" />
                      <span className="text-xl font-bold">${wallet.mainBalance}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/20 rounded-lg w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 px-4 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-center"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 rounded-xl text-center"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
