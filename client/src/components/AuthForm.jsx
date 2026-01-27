import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loginUser, registerUser } from '../redux/slices/userSlice';
import { User, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

const AuthForm = ({ mode = 'login' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(state => state.user);
  
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '' 
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const action = isLogin ? loginUser : registerUser;
    const result = await dispatch(action(formData));
    
    if (action.fulfilled.match(result)) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-10 shadow-2xl">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black mb-2 tracking-tighter uppercase">
                {isLogin ? 'Welcome Back' : 'Create Elite Account'}
            </h2>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">
                {isLogin ? 'Enter your credentials to access the arena' : 'Join the world\'s most advanced gaming platform'}
            </p>
          </div>
          
          {error && (
            <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl mb-8 text-center text-sm font-bold"
            >
                {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
              <input
                type="text"
                placeholder="USERNAME"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black border border-gray-800 text-white placeholder:text-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition font-bold text-sm uppercase tracking-wider"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            {!isLogin && (
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                <input
                  type="email"
                  placeholder="EMAIL ADDRESS"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black border border-gray-800 text-white placeholder:text-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition font-bold text-sm uppercase tracking-wider"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            )}
            
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
              <input
                type="password"
                placeholder="PASSWORD"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black border border-gray-800 text-white placeholder:text-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition font-bold text-sm uppercase tracking-wider"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-800 disabled:cursor-not-allowed text-black font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                    {isLogin ? 'Enter Arena' : 'Join Arena'}
                    <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-500 text-xs font-black uppercase tracking-widest hover:text-white transition-colors"
            >
              {isLogin ? "New to SayeemX? Create Account" : "Existing Member? Sign In"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthForm;