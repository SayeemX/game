import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
  Gift
} from 'lucide-react';
import { logout } from '../../redux/slices/userSlice';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.user);

  const handleLogout = () => {
    dispatch(logout());
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-[#161b22] border-b border-[#30363d] h-16 sticky top-0 z-50">
      <div className="max-w-[100vw] px-4 md:px-8 h-full">
        <div className="flex items-center justify-between h-full gap-4">
          
          {/* Left Side: Logo & Main Nav */}
          <div className="flex items-center gap-4 flex-1">
            <Link to="/" className="text-white hover:opacity-70 transition-opacity">
              <svg height="32" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="32" data-view-component="true" className="fill-white">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
              </svg>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-4 text-sm font-bold text-white">
              <Link to="/" className="hover:text-[#8b949e]">Pulls</Link>
              <Link to="/" className="hover:text-[#8b949e]">Issues</Link>
              <Link to="/" className="hover:text-[#8b949e]">Codespaces</Link>
              <Link to="/" className="hover:text-[#8b949e]">Marketplace</Link>
              <Link to="/" className="hover:text-[#8b949e]">Explore</Link>
            </div>

            {/* Global Search */}
            <div className="hidden md:flex items-center flex-1 max-w-[280px] relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-[#8b949e]" />
              </div>
              <input
                type="text"
                placeholder="Search or jump to..."
                className="block w-full bg-[#0d1117] border border-[#30363d] rounded-md py-1 pl-10 pr-3 text-sm text-white placeholder-[#8b949e] focus:outline-none focus:ring-1 focus:ring-[#58a6ff] focus:border-[#58a6ff] transition-all"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                <span className="text-[10px] border border-[#30363d] px-1.5 rounded bg-[#161b22] text-[#8b949e]">/</span>
              </div>
            </div>
          </div>

          {/* Right Side: Actions & Profile */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center">
              <button className="p-2 text-[#8b949e] hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="hidden sm:flex items-center gap-1 p-2 text-[#8b949e] hover:text-white transition-colors">
                <Plus className="w-5 h-5" />
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center gap-1">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 overflow-hidden border border-[#30363d]">
                    {/* Placeholder for user avatar */}
                  </div>
                  <ChevronDown className="w-3 h-3 text-[#8b949e]" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl py-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
                    <div className="px-4 py-2 border-b border-[#30363d] mb-2">
                        <p className="text-xs text-[#8b949e]">Signed in as</p>
                        <p className="text-sm font-bold text-white truncate">{user?.username}</p>
                    </div>
                    <Link to="/profile" className="block px-4 py-2 text-sm text-[#c9d1d9] hover:bg-[#0d1117] hover:text-white">Your profile</Link>
                    <Link to="/repositories" className="block px-4 py-2 text-sm text-[#c9d1d9] hover:bg-[#0d1117] hover:text-white">Your repositories</Link>
                    <Link to="/settings" className="block px-4 py-2 text-sm text-[#c9d1d9] hover:bg-[#0d1117] hover:text-white border-t border-[#30363d] mt-2">Settings</Link>
                    <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-[#c9d1d9] hover:bg-[#0d1117] hover:text-white"
                    >
                        Sign out
                    </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-bold text-white hover:text-[#8b949e]">Sign in</Link>
                <Link to="/register" className="text-sm font-bold text-white border border-[#30363d] px-3 py-1.5 rounded-md hover:bg-[#30363d]">Sign up</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-white"
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-[#161b22] border-b border-[#30363d] px-4 py-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e]" />
              <input
                type="text"
                placeholder="Search GitHub"
                className="block w-full bg-[#0d1117] border border-[#30363d] rounded-md py-2 pl-10 pr-3 text-sm text-white"
              />
            </div>
            <div className="flex flex-col gap-3 font-bold text-sm text-white">
                <Link to="/" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                <Link to="/" onClick={() => setIsMenuOpen(false)}>Pull requests</Link>
                <Link to="/" onClick={() => setIsMenuOpen(false)}>Issues</Link>
                <Link to="/" onClick={() => setIsMenuOpen(false)}>Marketplace</Link>
                <Link to="/" onClick={() => setIsMenuOpen(false)}>Explore</Link>
            </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;