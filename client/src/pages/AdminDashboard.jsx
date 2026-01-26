import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Users, Ticket, Activity, Plus, Trash2, CheckCircle } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [codes, setCodes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [newCode, setNewCode] = useState({ code: '', rewardType: 'SPIN_CREDIT', rewardValue: 5, maxRedemptions: 10 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [s, c, t] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/codes'),
        axios.get('/api/admin/transactions')
      ]);
      setStats(s.data);
      setCodes(c.data);
      setTransactions(t.data);
      setLoading(false);
    } catch (err) {
      console.error("Admin fetch error", err);
    }
  };

  const handleCreateCode = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/codes', newCode);
      setNewCode({ code: '', rewardType: 'SPIN_CREDIT', rewardValue: 5, maxRedemptions: 10 });
      fetchData();
    } catch (err) {
      alert("Failed to create code");
    }
  };

  if (user?.role !== 'admin') return <div className="p-20 text-center">Unauthorized Access</div>;
  if (loading) return <div className="p-20 text-center">Loading Admin Panel...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-10">
      
      <header className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-black text-white">COMMAND CENTER</h1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Platform Administration</p>
        </div>
        <div className="bg-game-accent/10 text-game-accent px-4 py-2 rounded-full border border-game-accent/20 text-xs font-bold">
            MASTER ADMIN: {user.username}
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatItem icon={<Users />} label="Total Registered" value={stats.totalUsers} />
        <StatItem icon={<Activity />} label="Total Transactions" value={stats.totalTransactions} />
        <StatItem icon={<CheckCircle />} label="Global Liquidity" value={`${stats.totalPlatformBalance} COINS`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        
        {/* Code Management */}
        <section className="bg-gray-900/40 border border-white/5 rounded-3xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Ticket className="text-game-accent" size={20}/> REDEEM CODES
            </h2>
            
            <form onSubmit={handleCreateCode} className="grid grid-cols-2 gap-3 mb-8 bg-black/20 p-4 rounded-2xl">
                <input 
                    className="col-span-2 bg-gray-800 border-none rounded-xl px-4 py-2 text-sm"
                    placeholder="CODE STRING (e.g. MEGA50)"
                    value={newCode.code}
                    onChange={e => setNewCode({...newCode, code: e.target.value})}
                    required
                />
                <select 
                    className="bg-gray-800 border-none rounded-xl px-4 py-2 text-sm"
                    value={newCode.rewardType}
                    onChange={e => setNewCode({...newCode, rewardType: e.target.value})}
                >
                    <option value="SPIN_CREDIT">SPIN CREDITS</option>
                    <option value="BALANCE">COIN BALANCE</option>
                </select>
                <input 
                    type="number"
                    className="bg-gray-800 border-none rounded-xl px-4 py-2 text-sm"
                    placeholder="VALUE"
                    value={newCode.rewardValue}
                    onChange={e => setNewCode({...newCode, rewardValue: parseInt(e.target.value)})}
                />
                <button className="col-span-2 bg-game-accent text-white font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-2">
                    <Plus size={16}/> GENERATE CODE
                </button>
            </form>

            <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {codes.map(c => (
                    <div key={c._id} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                        <div>
                            <p className="font-black text-white tracking-tighter">{c.code}</p>
                            <p className="text-[10px] text-gray-500 uppercase">{c.rewardValue} {c.rewardType} • {c.currentRedemptions}/{c.maxRedemptions} USES</p>
                        </div>
                        <div className={`text-[10px] font-bold px-2 py-1 rounded ${c.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {c.isActive ? 'ACTIVE' : 'EXPIRED'}
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Transaction Ledger */}
        <section className="bg-gray-900/40 border border-white/5 rounded-3xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Activity className="text-game-secondary" size={20}/> LIVE LEDGER
            </h2>
            <div className="space-y-3 overflow-y-auto max-h-[550px] pr-2 custom-scrollbar">
                {transactions.map(t => (
                    <div key={t._id} className="flex justify-between items-center bg-black/20 p-4 rounded-xl text-sm border-l-4 border-game-secondary">
                        <div>
                            <p className="text-white font-bold">{t.userId?.username || 'Unknown'}</p>
                            <p className="text-[10px] text-gray-500 uppercase">{t.description}</p>
                        </div>
                        <div className="text-right">
                            <p className={`font-black ${t.type === 'DEPOSIT' || t.type === 'PRIZE_WIN' ? 'text-green-400' : 'text-red-400'}`}>
                                {t.type === 'DEPOSIT' || t.type === 'PRIZE_WIN' ? '+' : '-'}{t.amount}
                            </p>
                            <p className="text-[9px] text-gray-600">{new Date(t.createdAt).toLocaleTimeString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>

      </div>
    </div>
  );
};

const StatItem = ({ icon, label, value }) => (
    <div className="bg-gray-800/40 p-6 rounded-3xl border border-white/5 flex items-center gap-6">
        <div className="p-4 bg-game-dark rounded-2xl text-game-accent shadow-xl">{icon}</div>
        <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-black text-white tracking-tighter">{value}</p>
        </div>
    </div>
);

export default AdminDashboard;
