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

const AdminDashboard = () => {
  const { user } = useSelector(state => state.user);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [codes, setCodes] = useState([]);
  const [spinConfig, setSpinConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [balanceForm, setBalanceForm] = useState({ userId: '', amount: '', type: 'main', description: '' });
  const [codeForm, setCodeForm] = useState({ code: '', rewardType: 'BALANCE', rewardValue: '', maxRedemptions: 1, expiresAt: '' });
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
      } else if (activeTab === 'spin') {
        const res = await adminAPI.getSpinConfig();
        setSpinConfig(res.data);
      }
    } catch (err) {
      setError('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSpinPrize = (index, field, value) => {
    const newPrizes = [...spinConfig.prizes];
    newPrizes[index] = { ...newPrizes[index], [field]: field === 'probability' || field === 'value' ? parseFloat(value) : value };
    setSpinConfig({ ...spinConfig, prizes: newPrizes });
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
                {['overview', 'users', 'codes', 'spin'].map(tab => (
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
                {activeTab === 'overview' && stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="text-blue-500" />
                        <StatCard label="Total Economy" value={`$${stats.totalBalance.toFixed(2)}`} icon={DollarSign} color="text-green-500" />
                        <StatCard label="Bonus Pool" value={`$${stats.totalBonus.toFixed(2)}`} icon={Gift} color="text-purple-500" />
                        <StatCard label="Transactions" value={stats.totalTransactions} icon={TrendingUp} color="text-yellow-500" />
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
                                                    <div className="text-sm font-black text-white">${u.wallet.mainBalance.toFixed(2)}</div>
                                                    <div className="text-[10px] text-yellow-500 font-bold">B: ${u.wallet.bonusBalance.toFixed(2)}</div>
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
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Code String</label>
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
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Value</label>
                                        <input 
                                            type="number"
                                            className="w-full p-4 bg-black border border-gray-800 rounded-2xl text-sm font-bold outline-none focus:border-yellow-500"
                                            value={codeForm.rewardValue}
                                            onChange={e => setCodeForm({ ...codeForm, rewardValue: e.target.value })}
                                            placeholder="100"
                                            required
                                        />
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
                                                <td className="px-6 py-4 text-sm font-black">${c.rewardValue} {c.rewardType}</td>
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
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black uppercase tracking-tighter">Wheel Configuration</h2>
                                <button 
                                    onClick={handleSaveSpinConfig} 
                                    disabled={formLoading}
                                    className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl uppercase tracking-widest text-[10px] transition-all"
                                >
                                    {formLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Save Changes'}
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
                                            <th className="px-6 py-4">Probability (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {spinConfig.prizes.map((prize, idx) => (
                                            <tr key={prize.id}>
                                                <td className="px-6 py-4">
                                                    <div className="w-8 h-8 rounded-lg border-2 border-gray-800" style={{ backgroundColor: prize.color }}></div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        type="text" 
                                                        className="bg-black/40 border border-gray-800 rounded-lg px-3 py-1.5 text-xs font-bold w-full"
                                                        value={prize.name}
                                                        onChange={(e) => handleUpdateSpinPrize(idx, 'name', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select 
                                                        className="bg-black/40 border border-gray-800 rounded-lg px-3 py-1.5 text-xs font-bold"
                                                        value={prize.type}
                                                        onChange={(e) => handleUpdateSpinPrize(idx, 'type', e.target.value)}
                                                    >
                                                        <option value="balance">Balance</option>
                                                        <option value="bonus">Bonus</option>
                                                        <option value="spins">Spins</option>
                                                        <option value="badluck">Badluck</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        type="number" 
                                                        className="bg-black/40 border border-gray-800 rounded-lg px-3 py-1.5 text-xs font-bold w-24"
                                                        value={prize.value}
                                                        onChange={(e) => handleUpdateSpinPrize(idx, 'value', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        type="number" 
                                                        className="bg-black/40 border border-gray-800 rounded-lg px-3 py-1.5 text-xs font-bold w-24"
                                                        value={prize.probability}
                                                        onChange={(e) => handleUpdateSpinPrize(idx, 'probability', e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">
                                Total Probability: {spinConfig.prizes.reduce((acc, p) => acc + (parseFloat(p.probability) || 0), 0).toFixed(2)}%
                            </p>
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