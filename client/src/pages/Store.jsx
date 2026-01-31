import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Zap, 
  Target, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Coins,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { shopAPI } from '../services/api';
import { updateWallet, setUserData } from '../redux/slices/userSlice';

const Store = () => {
  const dispatch = useDispatch();
  const { wallet, isAuthenticated } = useSelector(state => state.user);
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null); // ID of item being bought
  const [status, setStatus] = useState({ type: '', message: '' });

  const [selectedTier, setSelectedTier] = useState('BRONZE');

  const WHEEL_TIERS = {
    BRONZE: { label: 'Bronze', cost: 1, color: '#cd7f32' },
    SILVER: { label: 'Silver', cost: 10, color: '#c0c0c0' },
    GOLD: { label: 'Gold', cost: 100, color: '#ffd700' },
    DIAMOND: { label: 'Diamond', cost: 1000, color: '#b9f2ff' }
  };

  useEffect(() => {
    if (isAuthenticated) {
        fetchItems();
    } else {
        setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchItems = async () => {
    try {
      const res = await shopAPI.getItems();
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (itemId) => {
    setBuying(itemId);
    setStatus({ type: '', message: '' });
    try {
      const res = await shopAPI.buyItem(itemId);
      dispatch(updateWallet(res.data.wallet));
      // Optionally update full user data to sync inventory
      setStatus({ type: 'success', message: res.data.message });
      fetchItems();
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Purchase failed' });
    } finally {
      setBuying(null);
    }
  };

  const handleEquip = async (itemKey) => {
    try {
      const res = await shopAPI.equipItem(itemKey);
      setStatus({ type: 'success', message: res.data.message });
      fetchItems();
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to equip' });
    }
  };

  const handleBuySpins = async (amount) => {
    setBuying(`spins-${amount}`);
    setStatus({ type: '', message: '' });
    try {
      const res = await shopAPI.buySpins(amount, selectedTier);
      dispatch(updateWallet(res.data.wallet));
      setStatus({ type: 'success', message: res.data.message });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Purchase failed' });
    } finally {
      setBuying(null);
    }
  };

  const handleBuyAmmo = async (itemKey) => {
    setBuying(itemKey);
    setStatus({ type: '', message: '' });
    try {
        const res = await shopAPI.buyAmmo(itemKey);
        dispatch(updateWallet(res.data.wallet));
        setStatus({ type: 'success', message: res.data.message });
    } catch (err) {
        setStatus({ type: 'error', message: err.response?.data?.error || 'Ammo purchase failed' });
    } finally {
        setBuying(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="bg-[#1a2c38] border border-gray-800 rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 mb-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <ShoppingBag className="w-64 h-64 text-[#3bc117]" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left">
                    <div className="flex items-center gap-4 mb-4 justify-center md:justify-start">
                        <div className="w-12 h-12 bg-[#3bc117]/10 rounded-2xl flex items-center justify-center border border-[#3bc117]/20">
                            <ShoppingBag className="w-6 h-6 text-[#3bc117]" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter italic">Armory <span className="text-[#3bc117]">Store</span></h1>
                    </div>
                    <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-xs">Upgrade your arsenal for legendary precision</p>
                </div>
                <div className="bg-black/40 border border-gray-800 p-6 rounded-3xl backdrop-blur-xl min-w-[200px] text-center md:text-right">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Available Balance</p>
                    <p className="text-3xl font-black text-[#3bc117]">{wallet.mainBalance.toFixed(2)} TRX</p>
                </div>
            </div>
        </div>

        {/* Spin Credits Section */}
        <div className="bg-[#1a2c38] border border-gray-800 rounded-[2rem] p-8 mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Spins */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b lg:border-b-0 lg:border-r border-gray-800 pb-8 lg:pb-0 lg:pr-8">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20">
                                <Coins className="w-6 h-6 text-yellow-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter">Spin <span className="text-yellow-500">Credits</span></h2>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{WHEEL_TIERS[selectedTier].cost} TRX = 1 {selectedTier} Spin</p>
                            </div>
                        </div>
                        
                        {/* Tier Selector */}
                        <div className="flex bg-black/40 p-1 rounded-xl border border-gray-800 w-fit">
                            {Object.keys(WHEEL_TIERS).map(tier => (
                                <button
                                    key={tier}
                                    onClick={() => setSelectedTier(tier)}
                                    className={`px-4 py-2 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all ${selectedTier === tier ? 'bg-[#1a2c38] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                    style={{ borderBottom: selectedTier === tier ? `2px solid ${WHEEL_TIERS[tier].color}` : 'none' }}
                                >
                                    {tier}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[150px]">
                        {[10, 50, 100].map(amount => {
                            const totalCost = amount * WHEEL_TIERS[selectedTier].cost;
                            return (
                                <button 
                                    key={amount}
                                    onClick={() => handleBuySpins(amount)}
                                    disabled={buying === `spins-${amount}` || wallet.mainBalance < totalCost}
                                    className="flex items-center justify-between px-4 py-3 bg-black/40 border border-gray-800 hover:border-yellow-500/50 rounded-xl transition-all disabled:opacity-50 group"
                                >
                                    <span className="font-black text-[10px] uppercase tracking-widest text-gray-400 group-hover:text-white">{amount} SPINS</span>
                                    <span className="font-black text-[10px] text-yellow-500">{totalCost} TRX</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Ammo */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20">
                            <Zap className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Combat <span className="text-orange-500">Ammo</span></h2>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Stock up for GameX Sniper</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => handleBuyAmmo('arrow')}
                            disabled={buying === 'arrow' || wallet.mainBalance < 5}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-gray-800 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex flex-col items-center gap-1"
                        >
                            {buying === 'arrow' ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>
                                    <span>50x Arrows</span>
                                    <span className="text-orange-500">5 TRX</span>
                                </>
                            )}
                        </button>
                        <button 
                            onClick={() => handleBuyAmmo('pellet')}
                            disabled={buying === 'pellet' || wallet.mainBalance < 5}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-gray-800 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex flex-col items-center gap-1"
                        >
                            {buying === 'pellet' ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>
                                    <span>100x Pellets</span>
                                    <span className="text-orange-500">5 TRX</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Store Grid */}
        {loading ? (
            <div className="flex justify-center py-20">
                <Loader2 className="w-12 h-12 text-[#3bc117] animate-spin" />
            </div>
        ) : !isAuthenticated ? (
            <div className="bg-[#1a2c38] border border-gray-800 rounded-[3rem] p-20 text-center">
                <Lock className="w-16 h-16 text-gray-700 mx-auto mb-6" />
                <h2 className="text-3xl font-black uppercase mb-4">Access Restricted</h2>
                <p className="text-gray-500 font-bold mb-8 max-w-md mx-auto">You must be an authorized member to access the Elite Armory and purchase legendary gear.</p>
                <div className="flex justify-center gap-4">
                    <Link to="/login" className="px-10 py-4 bg-yellow-500 text-black font-black rounded-2xl uppercase tracking-widest hover:scale-105 transition-transform">Sign In</Link>
                    <Link to="/register" className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl uppercase tracking-widest transition-colors">Join Elite</Link>
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnimatePresence>
                    {items.map((item, idx) => (
                        <motion.div 
                            key={item._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`bg-[#1a2c38] border-2 rounded-[2rem] p-6 flex flex-col transition-all ${item.isEquipped ? 'border-[#3bc117] shadow-[0_0_30px_rgba(59,193,23,0.1)]' : 'border-gray-800'}`}
                        >
                            <div className="relative mb-6">
                                <div className={`aspect-square rounded-2xl bg-black/40 flex items-center justify-center border border-gray-800/50 group overflow-hidden`}>
                                    <Target className={`w-16 h-16 transition-transform duration-500 ${item.isEquipped ? 'text-[#3bc117] scale-110' : 'text-gray-700'}`} />
                                    {item.isOwned && !item.isEquipped && (
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button onClick={() => handleEquip(item.key)} className="px-6 py-2 bg-white text-black font-black rounded-xl text-xs uppercase tracking-widest">Equip Now</button>
                                        </div>
                                    )}
                                </div>
                                {item.isEquipped && (
                                    <div className="absolute top-2 right-2 px-3 py-1 bg-[#3bc117] text-black font-black text-[8px] rounded-lg uppercase tracking-widest">Active</div>
                                )}
                            </div>

                            <div className="flex-1 mb-6">
                                <h3 className="text-xl font-black uppercase tracking-tighter mb-2">{item.name}</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">{item.type}</p>
                                
                                <div className="space-y-3">
                                    <StatRow label="Damage" value={item.damage} max={3} color="bg-red-500" />
                                    <StatRow label="Accuracy" value={item.accuracy * 100 + '%'} max={100} color="bg-[#3bc117]" />
                                    <StatRow label="Reload" value={item.fireRate + 'ms'} max={1000} reverse color="bg-blue-500" />
                                </div>
                            </div>

                            {item.isOwned ? (
                                <button 
                                    disabled={item.isEquipped}
                                    onClick={() => handleEquip(item.key)}
                                    className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${item.isEquipped ? 'bg-gray-800 text-gray-500' : 'bg-white text-black hover:bg-gray-200'}`}
                                >
                                    {item.isEquipped ? 'Equipped' : 'Select Gear'}
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleBuy(item._id)}
                                    disabled={buying === item._id || wallet.mainBalance < item.price}
                                    className="w-full py-4 bg-[#3bc117] hover:bg-[#45d61d] disabled:bg-gray-800 disabled:text-gray-500 text-black font-black rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    {buying === item._id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                        <>Buy for {item.price} TRX <Sparkles className="w-4 h-4" /></>
                                    )}
                                </button>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        )}

        {status.message && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className={`fixed bottom-8 left-1/2 -translate-x-1/2 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm uppercase tracking-widest shadow-2xl z-50 ${status.type === 'success' ? 'bg-[#3bc117] text-black' : 'bg-red-500 text-white'}`}>
                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {status.message}
            </motion.div>
        )}

      </div>
    </div>
  );
};

const StatRow = ({ label, value, max, color, reverse = false }) => {
    const percentage = typeof value === 'string' ? parseInt(value) : (value / max) * 100;
    return (
        <div>
            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest mb-1.5 text-gray-500">
                <span>{label}</span>
                <span className="text-white">{value}</span>
            </div>
            <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${reverse ? 100 - (percentage/max*100) : percentage}%` }}></div>
            </div>
        </div>
    );
};

export default Store;
