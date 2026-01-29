import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet as WalletIcon, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  RefreshCw, 
  History, 
  Smartphone, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Copy,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  QrCode
} from 'lucide-react';
import { paymentAPI } from '../services/api';
import { updateWallet } from '../redux/slices/userSlice';

const Wallet = () => {
  const { user, wallet, isAuthenticated } = useSelector(state => state.user);
  const dispatch = useDispatch();
  
  const [activeTab, setActiveTab] = useState('deposit');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Form States
  const [depositData, setDepositData] = useState({ amount: '', method: 'bkash', transactionId: '', senderNumber: '' });
  const [withdrawData, setWithdrawData] = useState({ amount: '', method: 'bkash', accountDetails: '' });
  const [rechargeData, setRechargeData] = useState({ phoneNumber: '', operator: 'Grameenphone', amount: '' });

  useEffect(() => {
    if (isAuthenticated) {
        fetchHistory();
    }
  }, [isAuthenticated]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.history();
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await paymentAPI.deposit(depositData);
      setStatus({ type: 'success', message: res.data.message });
      setDepositData({ amount: '', method: 'bkash', transactionId: '', senderNumber: '' });
      fetchHistory();
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Deposit failed' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await paymentAPI.withdraw(withdrawData);
      dispatch(updateWallet(res.data.wallet));
      setStatus({ type: 'success', message: res.data.message });
      setWithdrawData({ amount: '', method: 'bkash', accountDetails: '' });
      fetchHistory();
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Withdrawal failed' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleRecharge = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await paymentAPI.recharge(rechargeData);
      dispatch(updateWallet(res.data.wallet));
      setStatus({ type: 'success', message: res.data.message });
      setRechargeData({ phoneNumber: '', operator: 'Grameenphone', amount: '' });
      fetchHistory();
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Recharge failed' });
    } finally {
      setFormLoading(false);
    }
  };

  const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text);
      // Optional toast
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Wallet Hero */}
        <div className="bg-[#1a2c38] border border-gray-800 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 mb-8 sm:mb-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none hidden sm:block">
                <WalletIcon className="w-64 h-64 text-yellow-500" />
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 relative z-10">
                <div className="text-center md:text-left">
                    <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                            <WalletIcon className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter">My Wallet</h1>
                    </div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] sm:text-sm">Manage your funds and elite rewards</p>
                </div>
                <div className="flex gap-6 sm:gap-8 w-full sm:w-auto justify-center sm:justify-end">
                    <div className="text-center md:text-right">
                        <p className="text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Main Balance</p>
                        <p className="text-2xl sm:text-4xl font-black text-white">{wallet.mainBalance.toFixed(2)} TRX</p>
                    </div>
                    <div className="text-center md:text-right">
                        <p className="text-[8px] sm:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Bonus Balance</p>
                        <p className="text-xl sm:text-2xl font-black text-yellow-500">{wallet.bonusBalance.toFixed(2)} TRX</p>
                    </div>
                </div>
            </div>
        </div>

        {!isAuthenticated ? (
            <div className="bg-[#1a2c38] border border-gray-800 rounded-[3rem] p-10 sm:p-20 text-center">
                <ShieldCheck className="w-12 h-12 sm:w-16 sm:h-16 text-gray-700 mx-auto mb-6" />
                <h2 className="text-2xl sm:text-3xl font-black uppercase mb-4">Secure Area</h2>
                <p className="text-gray-500 font-bold mb-8 max-w-md mx-auto text-xs sm:text-base">Please authenticate your account to manage your funds, view history, and process withdrawals.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link to="/login" className="px-10 py-4 bg-yellow-500 text-black font-black rounded-2xl uppercase tracking-widest hover:scale-105 transition-transform">Sign In</Link>
                    <Link to="/register" className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl uppercase tracking-widest transition-colors">Join Elite</Link>
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
                {/* Action Panel */}
                <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                    <div className="bg-[#1a2c38] border border-gray-800 rounded-[2rem] sm:rounded-[3rem] overflow-hidden">
                        <div className="flex border-b border-gray-800 overflow-x-auto no-scrollbar">
                            {['deposit', 'withdraw', 'recharge', 'inventory'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setStatus({type:'', message:''}); }}
                                    className={`flex-1 min-w-[100px] py-4 sm:py-6 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-yellow-500 text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 sm:p-10">
                            <AnimatePresence mode="wait">
                                {activeTab === 'inventory' && (
                                    <motion.div key="inventory" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                                        <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                                            <ShoppingBag className="w-6 h-6 text-yellow-500" /> My Arsenal
                                        </h3>
                                        
                                        <div className="space-y-8">
                                            {/* Consumables (Arrows/Pellets) */}
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Consumables</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {(user.inventory?.items || []).length === 0 ? (
                                                        <p className="text-gray-600 text-xs font-bold uppercase py-4 border-2 border-dashed border-gray-800 rounded-2xl text-center">No ammunition in stock</p>
                                                    ) : (
                                                        user.inventory.items.map(item => (
                                                            <div key={item.itemKey} className="bg-black/20 border border-gray-800 p-6 rounded-3xl flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20">
                                                                        <Zap className="w-6 h-6 text-orange-500" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-black uppercase tracking-widest text-sm">{item.itemKey}</p>
                                                                        <p className="text-[10px] text-gray-500 font-bold uppercase">Ready for action</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-2xl font-black text-white">{item.amount}</p>
                                                                    <p className="text-[8px] text-gray-500 font-black uppercase">Units</p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Weapons */}
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Weapons</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="bg-black/20 border-2 border-[#3bc117]/30 p-6 rounded-3xl flex items-center justify-between relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 p-2 bg-[#3bc117] text-black text-[8px] font-black uppercase">Active</div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-[#3bc117]/10 rounded-2xl flex items-center justify-center border border-[#3bc117]/20">
                                                                <Target className="w-6 h-6 text-[#3bc117]" />
                                                            </div>
                                                            <div>
                                                                <p className="font-black uppercase tracking-widest text-sm">{user.inventory?.equippedWeapon?.replace(/_/g, ' ') || 'Basic Bow'}</p>
                                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Main Weapon</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {(user.inventory?.weapons || []).length > 0 && (
                                                        <div className="flex items-center justify-center border-2 border-dashed border-gray-800 rounded-3xl p-6">
                                                            <p className="text-[10px] text-gray-600 font-black uppercase">+ {user.inventory.weapons.length} more in armory</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-10 pt-8 border-t border-gray-800 flex justify-center">
                                            <Link to="/store" className="flex items-center gap-2 text-yellow-500 font-black uppercase tracking-widest text-[10px] hover:underline">
                                                Visit Elite Store to upgrade arsenal <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'deposit' && (
                                    <motion.div key="deposit" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                                        <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                                            <ArrowUpCircle className="w-6 h-6 text-green-500" /> Deposit Funds
                                        </h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                            <div className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${depositData.method === 'bkash' ? 'border-yellow-500 bg-yellow-500/5' : 'border-gray-800 bg-black/20'}`} onClick={() => setDepositData({...depositData, method: 'bkash'})}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="font-black uppercase tracking-widest text-sm">bKash (Manual)</span>
                                                    <div className="w-6 h-6 rounded-full border-2 border-yellow-500 flex items-center justify-center">
                                                        {depositData.method === 'bkash' && <div className="w-3 h-3 bg-yellow-500 rounded-full" />}
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Send money to: 017XXXXXXXX</p>
                                            </div>
                                            <div className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${depositData.method === 'trx' ? 'border-yellow-500 bg-yellow-500/5' : 'border-gray-800 bg-black/20'}`} onClick={() => setDepositData({...depositData, method: 'trx'})}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="font-black uppercase tracking-widest text-sm">TRX (Tron)</span>
                                                    <div className="w-6 h-6 rounded-full border-2 border-yellow-500 flex items-center justify-center">
                                                        {depositData.method === 'trx' && <div className="w-3 h-3 bg-yellow-500 rounded-full" />}
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate">TRC20 Address: TY123...456</p>
                                            </div>
                                        </div>

                                        <form onSubmit={handleDeposit} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block">Amount (TRX)</label>
                                                    <input type="number" required min="0.01" step="0.01" placeholder="50.00" className="w-full p-4 bg-black border border-gray-800 rounded-2xl outline-none focus:border-yellow-500 font-bold" value={depositData.amount} onChange={e => setDepositData({...depositData, amount: e.target.value})} />
                                                    {depositData.amount && (depositData.method === 'bkash' || depositData.method === 'nagad') && (
                                                        <p className="text-[10px] font-black text-yellow-500 mt-2 uppercase tracking-widest">
                                                            Please send: {(parseFloat(depositData.amount) * 15).toFixed(2)} BDT
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block">{depositData.method === 'trx' ? 'Transaction Hash' : 'Transaction ID'}</label>
                                                    <input type="text" required placeholder="Paste TRX ID" className="w-full p-4 bg-black border border-gray-800 rounded-2xl outline-none focus:border-yellow-500 font-bold" value={depositData.transactionId} onChange={e => setDepositData({...depositData, transactionId: e.target.value})} />
                                                </div>
                                            </div>
                                            {depositData.method === 'bkash' && (
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block">Your bKash Number</label>
                                                    <input type="text" required placeholder="01XXXXXXXXX" className="w-full p-4 bg-black border border-gray-800 rounded-2xl outline-none focus:border-yellow-500 font-bold" value={depositData.senderNumber} onChange={e => setDepositData({...depositData, senderNumber: e.target.value})} />
                                                </div>
                                            )}
                                            <button disabled={formLoading} className="w-full py-5 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl uppercase tracking-widest transition-all shadow-xl shadow-yellow-500/10 flex items-center justify-center gap-2">
                                                {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Deposit Request'}
                                            </button>
                                        </form>
                                    </motion.div>
                                )}

                                {activeTab === 'withdraw' && (
                                    <motion.div key="withdraw" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                                        <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                                            <ArrowDownCircle className="w-6 h-6 text-red-500" /> Withdraw Winnings
                                        </h3>
                                        <form onSubmit={handleWithdraw} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block">Amount (TRX)</label>
                                                    <input type="number" required min="0.01" step="0.01" placeholder="100.00" className="w-full p-4 bg-black border border-gray-800 rounded-2xl outline-none focus:border-yellow-500 font-bold" value={withdrawData.amount} onChange={e => setWithdrawData({...withdrawData, amount: e.target.value})} />
                                                    {withdrawData.amount && (withdrawData.method === 'bkash' || withdrawData.method === 'nagad') && (
                                                        <p className="text-[10px] font-black text-yellow-500 mt-2 uppercase tracking-widest">
                                                            Est. Receive: {(parseFloat(withdrawData.amount) * 15).toFixed(2)} BDT
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block">Withdrawal Method</label>
                                                    <select className="w-full p-4 bg-black border border-gray-800 rounded-2xl outline-none focus:border-yellow-500 font-bold" value={withdrawData.method} onChange={e => setWithdrawData({...withdrawData, method: e.target.value})}>
                                                        <option value="bkash">bKash (Personal)</option>
                                                        <option value="nagad">Nagad (Personal)</option>
                                                        <option value="trx">TRX Wallet (TRC20)</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block">Account / Wallet Details</label>
                                                <input type="text" required placeholder="Enter number or wallet address" className="w-full p-4 bg-black border border-gray-800 rounded-2xl outline-none focus:border-yellow-500 font-bold" value={withdrawData.accountDetails} onChange={e => setWithdrawData({...withdrawData, accountDetails: e.target.value})} />
                                            </div>
                                            <button disabled={formLoading} className="w-full py-5 bg-white hover:bg-gray-100 text-black font-black rounded-2xl uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2">
                                                {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Request Withdrawal'}
                                            </button>
                                        </form>
                                    </motion.div>
                                )}

                                {activeTab === 'recharge' && (
                                    <motion.div key="recharge" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                                        <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                                            <Smartphone className="w-6 h-6 text-blue-500" /> Mobile Recharge
                                        </h3>
                                        <form onSubmit={handleRecharge} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block">Phone Number</label>
                                                    <input type="text" required placeholder="01XXXXXXXXX" className="w-full p-4 bg-black border border-gray-800 rounded-2xl outline-none focus:border-yellow-500 font-bold" value={rechargeData.phoneNumber} onChange={e => setRechargeData({...rechargeData, phoneNumber: e.target.value})} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block">Operator</label>
                                                    <select className="w-full p-4 bg-black border border-gray-800 rounded-2xl outline-none focus:border-yellow-500 font-bold" value={rechargeData.operator} onChange={e => setRechargeData({...rechargeData, operator: e.target.value})}>
                                                        <option>Grameenphone</option>
                                                        <option>Robi</option>
                                                        <option>Airtel</option>
                                                        <option>Banglalink</option>
                                                        <option>Teletalk</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block">Amount (TRX)</label>
                                                <input type="number" required min="10" step="1" placeholder="20.00" className="w-full p-4 bg-black border border-gray-800 rounded-2xl outline-none focus:border-yellow-500 font-bold" value={rechargeData.amount} onChange={e => setRechargeData({...rechargeData, amount: e.target.value})} />
                                            </div>
                                            <button disabled={formLoading} className="w-full py-5 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-2xl uppercase tracking-widest transition-all shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2">
                                                {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Perform Recharge'}
                                            </button>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {status.message && (
                                <div className={`mt-8 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm uppercase tracking-widest ${status.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>
                                    {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    {status.message}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-[#1a2c38] border border-gray-800 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10">
                        <h2 className="text-lg sm:text-xl font-black uppercase tracking-tighter mb-6 sm:mb-8 flex items-center gap-3">
                            <History className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" /> Transaction History
                        </h2>
                        {loading ? <Loader2 className="animate-spin w-8 h-8 mx-auto text-gray-600" /> : (
                            <div className="space-y-3 sm:space-y-4">
                                {history.length === 0 ? <p className="text-center text-gray-500 font-bold py-10 uppercase tracking-widest text-[10px]">No transactions yet</p> : (
                                    history.map(tx => (
                                        <div key={tx._id} className="flex items-center justify-between p-4 sm:p-6 bg-black/20 border border-gray-800/50 rounded-2xl">
                                            <div className="flex items-center gap-3 sm:gap-4">
                                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${tx.type === 'deposit' || tx.type === 'spin_win' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {tx.type === 'deposit' || tx.type === 'spin_win' ? <ArrowUpCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : <ArrowDownCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs sm:text-sm font-black uppercase tracking-tighter truncate max-w-[120px] sm:max-w-none">{tx.description || tx.type.replace(/_/g, ' ')}</p>
                                                    <p className="text-[8px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-widest">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm sm:text-lg font-black ${tx.type === 'deposit' || tx.type === 'spin_win' ? 'text-green-500' : 'text-red-500'}`}>
                                                    {tx.type === 'deposit' || tx.type === 'spin_win' ? '+' : '-'}{tx.amount.toFixed(2)} TRX
                                                </p>
                                                <p className={`text-[7px] sm:text-[8px] font-black uppercase tracking-[0.2em] ${tx.status === 'completed' ? 'text-green-500' : tx.status === 'pending' ? 'text-yellow-500' : 'text-red-500'}`}>
                                                    {tx.status}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Side Info */}
                <div className="space-y-8">
                    <div className="bg-yellow-500 rounded-[3rem] p-10 text-black">
                        <Smartphone className="w-12 h-12 mb-6" />
                        <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Mobile Top-up</h3>
                        <p className="font-bold text-sm leading-relaxed mb-8 opacity-90">Instantly recharge any mobile number in Bangladesh using your main balance. Fast, secure, and always active.</p>
                        <button onClick={() => setActiveTab('recharge')} className="w-full py-4 bg-black text-white font-black rounded-2xl uppercase tracking-widest flex items-center justify-center gap-2">
                            Top-up Now <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="bg-[#1a2c38] border border-gray-800 rounded-[3rem] p-10">
                        <ShieldCheck className="w-10 h-10 text-yellow-500 mb-6" />
                        <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Secure Wallet</h3>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-loose">All transactions are encrypted and monitored for your safety. GameX uses bank-grade security protocols.</p>
                    </div>

                    <div className="bg-[#1a2c38] border border-gray-800 rounded-[3rem] p-10">
                        <QrCode className="w-10 h-10 text-yellow-500 mb-6" />
                        <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Crypto Payments</h3>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-loose">We support Tron (TRX) for near-instant, low-fee deposits and withdrawals across the globe.</p>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default Wallet;