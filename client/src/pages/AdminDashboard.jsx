import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Gift, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Search, 
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Database
} from 'lucide-react';
import { adminAPI } from '../services/api';
import CurrencyConfigManager from '../components/CurrencyConfigManager';

const AdminDashboard = () => {
  const { user } = useSelector(state => state.user);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [codes, setCodes] = useState([]);
  const [shopItems, setShopItems] = useState([]);
  const [spinConfig, setSpinConfig] = useState(null);
  const [birdConfig, setBirdConfig] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [currencyConfigs, setCurrencyConfigs] = useState([]);
  const [pendingTxs, setPendingTxs] = useState([]);
  const [selectedTier, setSelectedTier] = useState('BRONZE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [balanceForm, setBalanceForm] = useState({ userId: '', amount: '', type: 'main', description: '' });
  const [codeForm, setCodeForm] = useState({ code: '', rewardType: 'SPIN_CREDIT', rewardValue: '', maxRedemptions: 1, expiresAt: '' });
  const [shopForm, setShopForm] = useState({ name: '', key: '', type: 'bow', damage: 1, fireRate: 500, accuracy: 1.0, price: 0 });
  const [paymentForm, setPaymentConfigForm] = useState({ 
      bkash: { number: '', active: true },
      nagad: { number: '', active: true },
      trx: { address: '', active: true },
      conversionRate: 15
  });
  const [editingItem, setEditingItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await adminAPI.getStats();
        setStats(res.data);
      } else if (activeTab === 'users') {
        const res = await adminAPI.getUsers();
        setUsers(res.data);
      } else if (activeTab === 'codes') {
        const res = await adminAPI.getCodes();
        setCodes(res.data);
      } else if (activeTab === 'shop') {
        const res = await adminAPI.getShopItems();
        setShopItems(res.data);
      } else if (activeTab === 'spin') {
        const res = await adminAPI.getSpinConfig();
        setSpinConfig(res.data);
      } else if (activeTab === 'bird') {
        const res = await adminAPI.getBirdConfig();
        setBirdConfig(res.data);
      } else if (activeTab === 'finance') {
        const configRes = await adminAPI.getPaymentConfig();
        const txRes = await adminAPI.getPendingTransactions();
        const currencyRes = await adminAPI.getCurrencyConfigs();
        setPaymentConfig(configRes.data);
        setPaymentConfigForm(configRes.data);
        setPendingTxs(txRes.data);
        setCurrencyConfigs(currencyRes.data);
      }
    } catch (err) {
      setError('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessTx = async (txId, action) => {
      const reason = action === 'reject' ? window.prompt('Reason for rejection:') : null;
      if (action === 'reject' && reason === null) return;

      setFormLoading(true);
      try {
          await adminAPI.processTransaction({ txId, action, reason });
          setFormStatus({ type: 'success', message: `Transaction ${action}ed!` });
          fetchData();
      } catch (err) {
          setFormStatus({ type: 'error', message: 'Failed to process' });
      } finally {
          setFormLoading(false);
      }
  };

  const handleSavePaymentConfig = async () => {
      setFormLoading(true);
      try {
          await adminAPI.updatePaymentConfig(paymentForm);
          setFormStatus({ type: 'success', message: 'Payment config saved!' });
          fetchData();
      } catch (err) {
          setFormStatus({ type: 'error', message: 'Update failed' });
      } finally {
          setFormLoading(false);
      }
  };

  const handleUpdateSpinPrize = (index, field, value) => {
    const newTiers = { ...spinConfig.tiers };
    const newPrizes = [...newTiers[selectedTier].prizes];
    newPrizes[index] = { 
        ...newPrizes[index], 
        [field]: field === 'probability' || field === 'value' ? parseFloat(value) : value 
    };
    newTiers[selectedTier] = { ...newTiers[selectedTier], prizes: newPrizes };
    setSpinConfig({ ...spinConfig, tiers: newTiers });
  };

  const handleSaveSpinConfig = async () => {
    setFormLoading(true);
    try {
        await adminAPI.updateSpinConfig(spinConfig);
        setFormStatus({ type: 'success', message: 'Spin configuration saved!' });
    } catch (err) {
        setFormStatus({ type: 'error', message: 'Failed to save configuration' });
    } finally {
        setFormLoading(false);
    }
  };

  const handleSaveBirdConfig = async () => {
    setFormLoading(true);
    try {
        await adminAPI.updateBirdConfig(birdConfig);
        setFormStatus({ type: 'success', message: 'Bird configuration saved!' });
    } catch (err) {
        setFormStatus({ type: 'error', message: 'Failed to save configuration' });
    } finally {
        setFormLoading(false);
    }
  };

  const handleUpdateConsumable = (key, field, value) => {
    const consumables = birdConfig.consumables || [
        { itemKey: 'arrow', name: 'Arrows', amount: 50, price: 5, active: true },
        { itemKey: 'pellet', name: 'Pellets', amount: 100, price: 5, active: true }
    ];
    const index = consumables.findIndex(c => c.itemKey === key);
    if (index > -1) {
        consumables[index] = { ...consumables[index], [field]: parseFloat(value) };
    } else {
        consumables.push({ itemKey: key, name: key === 'arrow' ? 'Arrows' : 'Pellets', [field]: parseFloat(value), active: true });
    }
    setBirdConfig({ ...birdConfig, consumables });
  };

  const handleSaveConsumables = async () => {
    setFormLoading(true);
    try {
        await adminAPI.updateBirdConfig(birdConfig);
        setFormStatus({ type: 'success', message: 'Consumables updated!' });
    } catch (err) {
        setFormStatus({ type: 'error', message: 'Update failed' });
    } finally {
        setFormLoading(false);
    }
  };

  const handleUpdateBalance = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormStatus({ type: '', message: '' });
    try {
      await adminAPI.updateBalance(balanceForm);
      setFormStatus({ type: 'success', message: 'Balance updated successfully!' });
      setBalanceForm({ userId: '', amount: '', type: 'main', description: '' });
      if (activeTab === 'users') fetchData();
    } catch (err) {
      setFormStatus({ type: 'error', message: err.response?.data?.message || 'Update failed' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateCode = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormStatus({ type: '', message: '' });
    try {
      await adminAPI.createCode(codeForm);
      setFormStatus({ type: 'success', message: 'Redeem code created!' });
      setCodeForm({ code: '', rewardType: 'BALANCE', rewardValue: '', maxRedemptions: 1, expiresAt: '' });
      if (activeTab === 'codes') fetchData();
    } catch (err) {
      setFormStatus({ type: 'error', message: err.response?.data?.message || 'Creation failed' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleShopSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
        if (editingItem) {
            await adminAPI.updateShopItem(editingItem._id, shopForm);
            setFormStatus({ type: 'success', message: 'Item updated!' });
        } else {
            await adminAPI.createShopItem(shopForm);
            setFormStatus({ type: 'success', message: 'Item created!' });
        }
        setShopForm({ name: '', key: '', type: 'bow', damage: 1, fireRate: 500, accuracy: 1.0, price: 0 });
        setEditingItem(null);
        fetchData();
    } catch (err) {
        setFormStatus({ type: 'error', message: 'Operation failed' });
    } finally {
        setFormLoading(false);
    }
  };

  const handleDeleteItem = async (id) => {
      if (!window.confirm('Delete this item?')) return;
      try {
          await adminAPI.deleteShopItem(id);
          fetchData();
      } catch (err) {
          alert('Delete failed');
      }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117] text-white p-4">
        <div className="text-center">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-black uppercase tracking-tighter">Access Denied</h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">You do not have administrative privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
                    <Database className="w-8 h-8 text-yellow-500" /> Admin Command Center
                </h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mt-1">Manage users, codes, and platform economy</p>
            </div>
            
            <div className="flex bg-[#1a2c38] p-1.5 rounded-2xl border border-gray-800">
                {['overview', 'users', 'codes', 'shop', 'spin', 'bird', 'finance'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-yellow-500 text-black' : 'text-gray-500 hover:text-white'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        {loading ? (
            <div className="flex justify-center py-20">
                <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
            </div>
        ) : (
            <div className="space-y-8">
                {activeTab === 'finance' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Pending Transactions */}
                        <div className="lg:col-span-2 bg-[#1a2c38] border border-gray-800 rounded-[2.5rem] overflow-hidden">
                            <div className="p-6 border-b border-gray-800 bg-black/20 flex items-center justify-between">
                                <h2 className="font-black uppercase tracking-tighter">Pending Requests</h2>
                                <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-[10px] font-black">{pendingTxs.length} Waiting</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800">
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-6 py-4">Type/Method</th>
                                            <th className="px-6 py-4">Amount</th>
                                            <th className="px-6 py-4">Details</th>
                                            <th className="px-6 py-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {pendingTxs.length === 0 ? (
                                            <tr><td colSpan="5" className="p-10 text-center text-gray-500 font-black uppercase text-xs">No pending requests</td></tr>
                                        ) : pendingTxs.map(tx => (
                                            <tr key={tx._id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-black uppercase">{tx.userId?.username}</div>
                                                    <div className="text-[8px] text-gray-500 font-bold">{tx.userId?.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`text-[10px] font-black uppercase ${tx.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>{tx.type}</div>
                                                    <div className="text-[8px] font-bold text-gray-400 uppercase">{tx.paymentMethod}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-black">{tx.amount} TRX</div>
                                                    <div className="text-[8px] text-yellow-500 font-bold">~ {tx.metadata?.bdtAmount || (tx.amount * (paymentConfig?.conversionRate || 15)).toFixed(2)} BDT</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-[10px] font-bold truncate max-w-[150px]">
                                                        {tx.type === 'deposit' ? `TXID: ${tx.transactionId}` : `ACC: ${tx.metadata?.accountDetails}`}
                                                    </div>
                                                    <div className="text-[8px] text-gray-500">{new Date(tx.createdAt).toLocaleString()}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    {tx.type === 'withdrawal' && (
                                                        <>
                                                            <button 
                                                                onClick={() => handleProcessTx(tx._id, 'approve')}
                                                                className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg text-[8px] font-black uppercase hover:bg-green-500 hover:text-black transition-all"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button 
                                                                onClick={() => handleProcessTx(tx._id, 'reject')}
                                                                className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-[8px] font-black uppercase hover:bg-red-500 hover:text-black transition-all"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {tx.type === 'deposit' && (
                                                         <button 
                                                            onClick={() => handleProcessTx(tx._id, 'reject')}
                                                            className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-[8px] font-black uppercase hover:bg-red-500 hover:text-black transition-all"
                                                        >
                                                            Reject
                                                        </button>
                                                    )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Payment Config */}
                        <div className="space-y-8">
                            <div className="bg-[#1a2c38] border border-gray-800 rounded-[2.5rem] p-8 h-fit">
                                <h2 className="text-xl font-black uppercase tracking-tighter mb-6">Payment Gateway</h2>
                                <div className="space-y-6">
                                    <div className="p-4 bg-black/40 border border-gray-800 rounded-2xl space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-gray-500">bKash Number</span>
                                            <input type="checkbox" checked={paymentForm.bkash.active} onChange={e => setPaymentConfigForm({...paymentForm, bkash: {...paymentForm.bkash, active: e.target.checked}})} />
                                        </div>
                                        <input 
                                            type="text" 
                                            className="w-full p-3 bg-black border border-gray-800 rounded-xl text-sm font-bold"
                                            value={paymentForm.bkash.number}
                                            onChange={e => setPaymentConfigForm({...paymentForm, bkash: {...paymentForm.bkash, number: e.target.value}})}
                                        />
                                    </div>

                                    <div className="p-4 bg-black/40 border border-gray-800 rounded-2xl space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-gray-500">TRX (TRC20) Address</span>
                                            <input type="checkbox" checked={paymentForm.trx.active} onChange={e => setPaymentConfigForm({...paymentForm, trx: {...paymentForm.trx, active: e.target.checked}})} />
                                        </div>
                                        <input 
                                            type="text" 
                                            className="w-full p-3 bg-black border border-gray-800 rounded-xl text-[10px] font-bold"
                                            value={paymentForm.trx.address}
                                            onChange={e => setPaymentConfigForm({...paymentForm, trx: {...paymentForm.trx, address: e.target.value}})}
                                        />
                                    </div>

                                    <div className="p-4 bg-black/40 border border-gray-800 rounded-2xl space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-500">Conversion Rate (1 TRX = ? BDT)</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-3 bg-black border border-gray-800 rounded-xl text-sm font-bold"
                                            value={paymentForm.conversionRate}
                                            onChange={e => setPaymentConfigForm({...paymentForm, conversionRate: parseFloat(e.target.value)})}
                                        />
                                    </div>

                                    <button 
                                        onClick={handleSavePaymentConfig}
                                        disabled={formLoading}
                                        className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl uppercase tracking-widest transition-all"
                                    >
                                        {formLoading ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : 'Save Gateway Settings'}
                                    </button>
                                </div>
                            </div>
                            <CurrencyConfigManager configs={currencyConfigs} onSave={fetchData} />
                        </div>
                    </div>
                )}
                {activeTab === 'overview' && stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard label="Total Users" value={stats.totalUsers || 0} icon={Users} color="text-blue-500" />
                        <StatCard label="Total Economy" value={`${(stats.totalBalance || 0).toFixed(2)} TRX`} icon={DollarSign} color="text-yellow-500" />
                        <StatCard label="Platform Profit" value={`${(stats.trxPool || 0).toFixed(2)} TRX`} icon={TrendingUp} color="text-[#3bc117]" />
                        <StatCard label="Pending Requests" value={stats.pendingTransactions || 0} icon={AlertCircle} color="text-orange-500" />
                    </div>
                )}

                {activeTab === 'shop' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="bg-[#1a2c38] border border-gray-800 rounded-[2.5rem] p-8 h-fit">
                            <h2 className="text-xl font-black uppercase tracking-tighter mb-6">{editingItem ? 'Edit Item' : 'Add Shop Item'}</h2>
                            <form onSubmit={handleShopSubmit} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Item Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-4 bg-black border border-gray-800 rounded-2xl text-sm font-bold outline-none focus:border-yellow-500"
                                        value={shopForm.name}
                                        onChange={e => setShopForm({ ...shopForm, name: e.target.value })}
                                        placeholder="Elite Airgun"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Key</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-4 bg-black border border-gray-800 rounded-2xl text-sm font-bold outline-none focus:border-yellow-500"
                                            value={shopForm.key}
                                            onChange={e => setShopForm({ ...shopForm, key: e.target.value })}
                                            placeholder="pro_airgun"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Type</label>
                                        <select 
                                            className="w-full p-4 bg-black border border-gray-800 rounded-2xl text-sm font-bold outline-none focus:border-yellow-500"
                                            value={shopForm.type}
                                            onChange={e => setShopForm({ ...shopForm, type: e.target.value })}
                                        >
                                            <option value="bow">Bow</option>
                                            <option value="airgun">Airgun</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Dmg</label>
                                        <input type="number" step="0.1" className="w-full p-4 bg-black border border-gray-800 rounded-2xl text-sm font-bold" value={shopForm.damage} onChange={e => setShopForm({ ...shopForm, damage: parseFloat(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Rate(ms)</label>
                                        <input type="number" className="w-full p-4 bg-black border border-gray-800 rounded-2xl text-sm font-bold" value={shopForm.fireRate} onChange={e => setShopForm({ ...shopForm, fireRate: parseInt(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Price</label>
                                        <input type="number" className="w-full p-4 bg-black border border-gray-800 rounded-2xl text-sm font-bold" value={shopForm.price} onChange={e => setShopForm({ ...shopForm, price: parseFloat(e.target.value) })} />
                                    </div>
                                </div>
                                <button type="submit" disabled={formLoading} className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl uppercase tracking-widest transition-all">
                                    {formLoading ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : (editingItem ? 'Update Item' : 'Create Item')}
                                </button>
                                {editingItem && <button type="button" onClick={() => { setEditingItem(null); setShopForm({ name: '', key: '', type: 'bow', damage: 1, fireRate: 500, accuracy: 1.0, price: 0 }); }} className="w-full text-[10px] font-black uppercase text-gray-500 hover:text-white mt-2">Cancel Edit</button>}
                            </form>

                            <div className="mt-12 pt-12 border-t border-gray-800">
                                <h2 className="text-xl font-black uppercase tracking-tighter mb-6 text-orange-500">Manage Consumables</h2>
                                <div className="space-y-4">
                                    {['arrow', 'pellet'].map(key => {
                                        const config = birdConfig?.consumables?.find(c => c.itemKey === key) || { name: key === 'arrow' ? 'Arrows' : 'Pellets', amount: key === 'arrow' ? 50 : 100, price: 5 };
                                        return (
                                            <div key={key} className="p-4 bg-black/40 border border-gray-800 rounded-2xl">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{config.name}</span>
                                                    <span className="text-[10px] font-black text-orange-500">{config.price} TRX</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input 
                                                        type="number" 
                                                        placeholder="Price"
                                                        className="p-2 bg-black border border-gray-800 rounded-lg text-xs font-bold"
                                                        defaultValue={config.price}
                                                        onChange={(e) => handleUpdateConsumable(key, 'price', e.target.value)}
                                                    />
                                                    <input 
                                                        type="number" 
                                                        placeholder="Amount"
                                                        className="p-2 bg-black border border-gray-800 rounded-lg text-xs font-bold"
                                                        defaultValue={config.amount}
                                                        onChange={(e) => handleUpdateConsumable(key, 'amount', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <button onClick={handleSaveConsumables} className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-black font-black rounded-xl uppercase tracking-widest text-[10px]">Save Consumables</button>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 bg-[#1a2c38] border border-gray-800 rounded-[2.5rem] overflow-hidden">
                            <div className="p-6 border-b border-gray-800 bg-black/20">
                                <h2 className="font-black uppercase tracking-tighter">Shop Inventory</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800">
                                            <th className="px-6 py-4">Item</th>
                                            <th className="px-6 py-4">Stats</th>
                                            <th className="px-6 py-4">Price</th>
                                            <th className="px-6 py-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {shopItems.map(item => (
                                            <tr key={item._id}>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-black uppercase tracking-tighter">{item.name}</div>
                                                    <div className="text-[10px] text-gray-500 font-bold uppercase">{item.key} | {item.type}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-[10px] font-bold">DMG: {item.damage}</div>
                                                    <div className="text-[10px] font-bold">RATE: {item.fireRate}ms</div>
                                                </td>
                                                <td className="px-6 py-4 font-black text-yellow-500">{item.price} TRX</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <button onClick={() => { setEditingItem(item); setShopForm(item); }} className="p-2 hover:bg-white/10 rounded-lg text-blue-500 transition-colors"><Plus className="w-4 h-4 rotate-45" /></button>
                                                        <button onClick={() => handleDeleteItem(item._id)} className="p-2 hover:bg-white/10 rounded-lg text-red-500 transition-colors"><ShieldAlert className="w-4 h-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-[#1a2c38] border border-gray-800 rounded-[2.5rem] overflow-hidden">
                            <div className="p-6 border-b border-gray-800 bg-black/20 flex items-center justify-between">
                                <h2 className="font-black uppercase tracking-tighter">User Directory</h2>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input type="text" placeholder="Search users..." className="pl-10 pr-4 py-2 bg-black border border-gray-800 rounded-xl text-xs uppercase tracking-widest outline-none focus:border-yellow-500 transition-all" />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800">
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-6 py-4">Balance</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {users.map(u => (
                                            <tr key={u._id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setBalanceForm({ ...balanceForm, userId: u._id })}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center font-black text-[10px]">{u.username.substring(0,2).toUpperCase()}</div>
                                                        <div>
                                                            <div className="text-sm font-black uppercase tracking-tighter">{u.username}</div>
                                                            <div className="text-[10px] text-gray-500 font-bold">{u.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-black text-white">{u.wallet.mainBalance.toFixed(2)} TRX</div>
                                                    <div className="text-[10px] text-yellow-500 font-bold">B: {u.wallet.bonusBalance.toFixed(2)} TRX</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-[10px] font-bold text-gray-500">
                                                    {new Date(u.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-[#1a2c38] border border-gray-800 rounded-[2.5rem] p-8 h-fit">
                            <h2 className="text-xl font-black uppercase tracking-tighter mb-6">Update Balance</h2>
                            <form onSubmit={handleUpdateBalance} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">User ID</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-4 bg-black border border-gray-800 rounded-2xl text-sm font-bold outline-none focus:border-yellow-500"
                                        value={balanceForm.userId}
                                        onChange={e => setBalanceForm({ ...balanceForm, userId: e.target.value })}
                                        placeholder="Paste User ID here"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Amount (+/-)</label>
                                        <input 
                                            type="number" step="0.01"
                                            className="w-full p-4 bg-black border border-gray-800 rounded-2xl text-sm font-bold outline-none focus:border-yellow-500"
                                            value={balanceForm.amount}
                                            onChange={e => setBalanceForm({ ...balanceForm, amount: e.target.value })}
                                            placeholder="50.00"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Wallet</label>
                                        <select 
                                            className="w-full p-4 bg-black border border-gray-800 rounded-2xl text-sm font-bold outline-none focus:border-yellow-500"
                                            value={balanceForm.type}
                                            onChange={e => setBalanceForm({ ...balanceForm, type: e.target.value })}
                                        >
                                            <option value="main">Main</option>
                                            <option value="bonus">Bonus</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Description</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-4 bg-black border border-gray-800 rounded-2xl text-sm font-bold outline-none focus:border-yellow-500"
                                        value={balanceForm.description}
                                        onChange={e => setBalanceForm({ ...balanceForm, description: e.target.value })}
                                        placeholder="Reason for update"
                                    />
                                </div>
                                <button type="submit" disabled={formLoading} className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl uppercase tracking-widest transition-all">
                                    {formLoading ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : 'Apply Update'}
                                </button>
                                {formStatus.message && (
                                    <p className={`text-[10px] font-black uppercase text-center ${formStatus.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>{formStatus.message}</p>
                                )}
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'codes' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="bg-[#1a2c38] border border-gray-800 rounded-[2.5rem] p-8 h-fit">
                            <h2 className="text-xl font-black uppercase tracking-tighter mb-6">Create Redeem Code</h2>
                            <form onSubmit={handleCreateCode} className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Code String</label>
                                        <button 
                                            type="button"
                                            onClick={() => setCodeForm({ ...codeForm, code: Math.random().toString(36).substring(2, 10).toUpperCase() })}
                                            className="text-[8px] font-black text-yellow-500 uppercase tracking-widest hover:underline"
                                        >
                                            Generate Random
                                        </button>
                                    </div>
                                    <input 
                                        type="text" 
                                        className="w-full p-4 bg-black border border-gray-800 rounded-2xl text-sm font-black uppercase tracking-widest outline-none focus:border-yellow-500"
                                        value={codeForm.code}
                                        onChange={e => setCodeForm({ ...codeForm, code: e.target.value.toUpperCase() })}
                                        placeholder="ARENA2026"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Reward Type</label>
                                        <select 
                                            className="w-full p-4 bg-black border border-gray-800 rounded-2xl text-sm font-bold outline-none focus:border-yellow-500"
                                            value={codeForm.rewardType}
                                            onChange={e => setCodeForm({ ...codeForm, rewardType: e.target.value })}
                                        >
                                            <option value="SPIN_CREDIT">Free Spins</option>
                                            <option value="BALANCE">Bonus Balance</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Value</label>
                                        <input 
                                            type="number"
                                            className="w-full p-4 bg-black border border-gray-800 rounded-2xl text-sm font-bold outline-none focus:border-yellow-500"
                                            value={codeForm.rewardValue}
                                            onChange={e => setCodeForm({ ...codeForm, rewardValue: e.target.value })}
                                            placeholder="1"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Max Redemptions</label>
                                    <input 
                                        type="number"
                                        className="w-full p-4 bg-black border border-gray-800 rounded-2xl text-sm font-bold outline-none focus:border-yellow-500"
                                        value={codeForm.maxRedemptions}
                                        onChange={e => setCodeForm({ ...codeForm, maxRedemptions: e.target.value })}
                                    />
                                </div>
                                <button type="submit" disabled={formLoading} className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl uppercase tracking-widest transition-all">
                                    {formLoading ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : 'Generate Code'}
                                </button>
                                {formStatus.message && (
                                    <p className={`text-[10px] font-black uppercase text-center ${formStatus.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>{formStatus.message}</p>
                                )}
                            </form>
                        </div>

                        <div className="lg:col-span-2 bg-[#1a2c38] border border-gray-800 rounded-[2.5rem] overflow-hidden">
                            <div className="p-6 border-b border-gray-800 bg-black/20">
                                <h2 className="font-black uppercase tracking-tighter">Active Codes</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800">
                                            <th className="px-6 py-4">Code</th>
                                            <th className="px-6 py-4">Reward</th>
                                            <th className="px-6 py-4">Usage</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {codes.map(c => (
                                            <tr key={c._id}>
                                                <td className="px-6 py-4 font-black uppercase tracking-widest text-yellow-500">{c.code}</td>
                                                <td className="px-6 py-4 text-sm font-black">{c.rewardValue} {c.rewardType === 'BALANCE' ? 'TRX' : c.rewardType}</td>
                                                <td className="px-6 py-4 text-xs font-bold text-gray-400">{c.currentRedemptions} / {c.maxRedemptions}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${c.isActive ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                                        {c.isActive ? 'Active' : 'Ended'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'spin' && spinConfig && (
                    <div className="space-y-8">
                        <div className="bg-[#1a2c38] border border-gray-800 rounded-[2.5rem] p-8">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black uppercase tracking-tighter">Wheel Configuration</h2>
                                    <div className="flex bg-black/40 p-1 rounded-xl border border-gray-800">
                                        {['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setSelectedTier(t)}
                                                className={`px-4 py-2 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all ${selectedTier === t ? 'bg-[#1a2c38] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSaveSpinConfig} 
                                    disabled={formLoading}
                                    className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl uppercase tracking-widest text-[10px] transition-all w-full md:w-auto"
                                >
                                    {formLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Save All Tiers'}
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800">
                                            <th className="px-6 py-4">Segment</th>
                                            <th className="px-6 py-4">Display Name</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">Value</th>
                                            <th className="px-6 py-4">Item Key</th>
                                            <th className="px-6 py-4">Prob (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {(spinConfig.tiers?.[selectedTier]?.prizes || []).map((prize, idx) => (
                                            <tr key={prize.id || idx}>
                                                <td className="px-6 py-4">
                                                    <div className="w-8 h-8 rounded-lg border-2 border-gray-800" style={{ backgroundColor: prize.color }}></div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        type="text" 
                                                        className="bg-black/40 border border-gray-800 rounded-lg px-3 py-1.5 text-xs font-bold w-full"
                                                        value={prize.name || ''}
                                                        onChange={(e) => handleUpdateSpinPrize(idx, 'name', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select 
                                                        className="bg-black/40 border border-gray-800 rounded-lg px-3 py-1.5 text-xs font-bold"
                                                        value={prize.type || 'balance'}
                                                        onChange={(e) => handleUpdateSpinPrize(idx, 'type', e.target.value)}
                                                    >
                                                        <option value="balance">Balance</option>
                                                        <option value="spins">Spins</option>
                                                        <option value="weapon">Weapon</option>
                                                        <option value="item">Item/Ammo</option>
                                                        <option value="crash">Crash</option>
                                                        <option value="jackpot">Jackpot</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        type="number" 
                                                        className="bg-black/40 border border-gray-800 rounded-lg px-3 py-1.5 text-xs font-bold w-20"
                                                        value={prize.value || 0}
                                                        onChange={(e) => handleUpdateSpinPrize(idx, 'value', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        type="text" 
                                                        className="bg-black/40 border border-gray-800 rounded-lg px-3 py-1.5 text-[10px] font-bold w-24"
                                                        value={prize.itemKey || ''}
                                                        placeholder="airgun"
                                                        disabled={prize.type !== 'weapon' && prize.type !== 'item'}
                                                        onChange={(e) => handleUpdateSpinPrize(idx, 'itemKey', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        type="number" 
                                                        className="bg-black/40 border border-gray-800 rounded-lg px-3 py-1.5 text-xs font-bold w-16"
                                                        value={prize.probability || 0}
                                                        onChange={(e) => handleUpdateSpinPrize(idx, 'probability', e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="mt-8 p-4 rounded-2xl bg-black/40 border border-gray-800 space-y-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`px-4 py-2 rounded-xl text-xs font-black ${Math.abs((spinConfig.tiers?.[selectedTier]?.prizes || []).reduce((acc, p) => acc + (parseFloat(p.probability) || 0), 0) - 100) < 0.01 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            TIER TOTAL: {(spinConfig.tiers?.[selectedTier]?.prizes || []).reduce((acc, p) => acc + (parseFloat(p.probability) || 0), 0).toFixed(2)}%
                                        </div>
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Selected tier must equal exactly 100%</p>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <label className="text-[10px] font-black text-gray-500 uppercase">Tier Cost (TRX):</label>
                                        <input 
                                            type="number" 
                                            className="bg-black border border-gray-800 rounded-lg px-3 py-1.5 text-xs font-bold w-24 outline-none focus:border-yellow-500"
                                            value={spinConfig.tiers?.[selectedTier]?.cost || 0}
                                            onChange={(e) => {
                                                const newTiers = { ...spinConfig.tiers };
                                                newTiers[selectedTier] = { ...newTiers[selectedTier], cost: parseFloat(e.target.value) };
                                                setSpinConfig({ ...spinConfig, tiers: newTiers });
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Jackpot Pools (Global)</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        {Object.keys(spinConfig.jackpots || {}).map(j => (
                                            <div key={j} className="space-y-2">
                                                <label className="text-[8px] font-black text-gray-600 uppercase block">{j}</label>
                                                <input 
                                                    type="number" 
                                                    className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-[10px] font-bold outline-none focus:border-yellow-500"
                                                    value={spinConfig.jackpots[j].current}
                                                    onChange={(e) => {
                                                        const newJackpots = { ...spinConfig.jackpots };
                                                        newJackpots[j] = { ...newJackpots[j], current: parseFloat(e.target.value) };
                                                        setSpinConfig({ ...spinConfig, jackpots: newJackpots });
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'bird' && birdConfig && (
                    <div className="max-w-2xl mx-auto space-y-8">
                        <div className="bg-[#1a2c38] border border-gray-800 rounded-[2.5rem] p-8">
                            <h2 className="text-xl font-black uppercase tracking-tighter mb-8">Bird Shooting Global Parameters</h2>
                            
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Base Entry Fee (TRX)</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-4 bg-black border border-gray-800 rounded-2xl text-sm font-bold outline-none focus:border-yellow-500"
                                            value={birdConfig.entryFee}
                                            onChange={(e) => setBirdConfig({ ...birdConfig, entryFee: parseFloat(e.target.value) })}
                                        />
                                        <p className="mt-2 text-[8px] text-gray-500 font-bold uppercase tracking-widest">Fee will be multiplied by Stage Level (1, 2, 3)</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Game Status</label>
                                        <select 
                                            className="w-full p-4 bg-black border border-gray-800 rounded-2xl text-sm font-bold outline-none focus:border-yellow-500"
                                            value={birdConfig.active ? 'true' : 'false'}
                                            onChange={(e) => setBirdConfig({ ...birdConfig, active: e.target.value === 'true' })}
                                        >
                                            <option value="true">Active/Online</option>
                                            <option value="false">Maintenance</option>
                                        </select>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleSaveBirdConfig}
                                    disabled={formLoading}
                                    className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl uppercase tracking-widest transition-all"
                                >
                                    {formLoading ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : 'Save Parameters'}
                                </button>

                                {formStatus.message && (
                                    <p className={`text-[10px] font-black uppercase text-center ${formStatus.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>{formStatus.message}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="bg-[#1a2c38] border border-gray-800 p-8 rounded-[2rem] hover:border-gray-700 transition-all group">
        <Icon className={`w-8 h-8 ${color} mb-6 group-hover:scale-110 transition-transform`} />
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
        <h3 className="text-2xl font-black uppercase tracking-tighter">{value}</h3>
    </div>
);

export default AdminDashboard;