import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { redeemAPI } from '../services/api';
import { setUserData } from '../redux/slices/userSlice';

const RedeemCodeSection = ({ isCompact = false }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const dispatch = useDispatch();

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await redeemAPI.redeem(code);
      setStatus({ type: 'success', message: response.data.message });
      setCode('');
      
      dispatch({ type: 'user/updateWallet', payload: response.data.wallet });
      
      // Clear status after 5 seconds if compact
      if (isCompact) {
          setTimeout(() => setStatus({ type: '', message: '' }), 5000);
      }
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to redeem' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (isCompact) {
      return (
        <div className="w-full">
            <form onSubmit={handleRedeem} className="relative group">
                <input
                    type="text"
                    placeholder="ENTER GIFT CODE"
                    className="w-full px-8 py-5 bg-white/5 hover:bg-white/10 border-2 border-white/10 focus:border-yellow-500/50 rounded-3xl text-white placeholder:text-gray-600 font-black text-sm uppercase tracking-[0.3em] outline-none transition-all backdrop-blur-xl"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !code.trim()}
                    className="absolute right-2 top-2 bottom-2 px-8 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-800 text-black font-black rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-yellow-500/20"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                </button>
            </form>
            <AnimatePresence>
                {status.message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`mt-4 p-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest backdrop-blur-md ${
                        status.type === 'success' 
                            ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                            : 'bg-red-500/20 border border-red-500/30 text-red-400'
                        }`}
                    >
                        {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {status.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mt-12">
      <div className="relative bg-[#1a2c38] border border-gray-800 rounded-[2.5rem] overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Gift className="w-32 h-32 text-yellow-500" />
        </div>
        
        <div className="p-10 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-widest mb-4">
                <Gift className="w-3 h-3" /> Exclusive Bonus
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Have a Redeem Code?</h2>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Enter your SayeemX GIFT code below to claim your rewards.</p>
            </div>

            <div className="w-full md:w-auto">
              <form onSubmit={handleRedeem} className="flex flex-col gap-4">
                <div className="relative min-w-[300px]">
                  <input
                    type="text"
                    placeholder="ENTER CODE (e.g. SAYEEMX2026)"
                    className="w-full px-6 py-4 bg-black border border-gray-800 rounded-2xl text-white placeholder:text-gray-700 font-black text-sm uppercase tracking-widest focus:border-yellow-500 outline-none transition-all"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !code.trim()}
                    className="absolute right-2 top-2 bottom-2 px-6 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-800 text-black font-black rounded-xl transition-all flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <AnimatePresence>
            {status.message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`mt-6 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm uppercase tracking-widest ${
                  status.type === 'success' 
                    ? 'bg-green-500/10 border border-green-500/20 text-green-500' 
                    : 'bg-red-500/10 border border-red-500/20 text-red-500'
                }`}
              >
                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {status.message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default RedeemCodeSection;
