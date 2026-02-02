import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  RefreshCw, 
  Hash, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { spinAPI } from '../services/api';

const ProvablyFairSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seeds, setSeeds] = useState({
    serverSeedHash: '',
    clientSeed: '',
    nonce: 0
  });
  const [newClientSeed, setNewClientSeed] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  
  // Verification states
  const [verifyData, setVerifyData] = useState({ serverSeed: '', clientSeed: '', nonce: 0 });
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    fetchSeeds();
  }, []);

  const fetchSeeds = async () => {
    try {
      const res = await spinAPI.initialize();
      setSeeds({
        serverSeedHash: res.data.serverSeedHash,
        clientSeed: res.data.clientSeed,
        nonce: res.data.nonce
      });
      setNewClientSeed(res.data.clientSeed);
    } catch (err) {
      console.error('Failed to fetch seeds');
    }
  };

  const handleUpdateSeed = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await spinAPI.updateClientSeed(newClientSeed);
      setSeeds(prev => ({ ...prev, clientSeed: res.data.clientSeed, nonce: 0 }));
      setStatus({ type: 'success', message: 'Client seed updated!' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Update failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleRotate = async () => {
    if (!window.confirm('This will reveal your current server seed and start a new one. Continue?')) return;
    setLoading(true);
    try {
      const res = await spinAPI.rotateSeed();
      setSeeds(prev => ({ ...prev, serverSeedHash: res.data.newServerSeedHash, nonce: 0 }));
      setStatus({ 
        type: 'success', 
        message: `Current Server Seed Revealed: ${res.data.previousServerSeed}. Use this to verify previous games.` 
      });
    } catch (err) {
      setStatus({ type: 'error', message: 'Rotation failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
        const res = await spinAPI.verifyResult(verifyData);
        setVerifyResult(res.data);
    } catch (err) {
        alert('Verification failed. Check your parameters.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mt-8">
      <div className="bg-[#1a2c38] border border-gray-800 rounded-[2rem] overflow-hidden">
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className="w-full p-6 sm:p-8 flex items-center justify-between hover:bg-white/5 transition-all"
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                    <ShieldCheck className="w-6 h-6 text-green-500" />
                </div>
                <div className="text-left">
                    <h3 className="text-lg font-black uppercase tracking-tighter text-white">Provably Fair System</h3>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Verify the integrity of every spin</p>
                </div>
            </div>
            {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </button>

        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-800"
                >
                    <div className="p-6 sm:p-10 space-y-10">
                        {/* Current Seeds */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Active Server Seed (Hashed)</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-black/40 border border-gray-800 p-4 rounded-xl font-mono text-[10px] break-all text-yellow-500">
                                        {seeds.serverSeedHash}
                                    </div>
                                    <button onClick={handleRotate} className="px-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all" title="Rotate Seeds">
                                        <RefreshCw className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                                <p className="text-[9px] text-gray-600 font-bold uppercase">The actual seed is secret until you rotate. The hash proves it doesn&apos;t change during play.</p>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Active Client Seed</label>
                                <form onSubmit={handleUpdateSeed} className="flex gap-2">
                                    <input 
                                        type="text" 
                                        className="flex-1 bg-black/40 border border-gray-800 p-4 rounded-xl font-mono text-[10px] text-white outline-none focus:border-yellow-500"
                                        value={newClientSeed}
                                        onChange={(e) => setNewClientSeed(e.target.value)}
                                    />
                                    <button type="submit" disabled={loading} className="px-6 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-[10px] uppercase rounded-xl transition-all">
                                        Update
                                    </button>
                                </form>
                                <div className="flex justify-between items-center">
                                    <p className="text-[9px] text-gray-600 font-bold uppercase">Current Nonce: <span className="text-white">{seeds.nonce}</span></p>
                                </div>
                            </div>
                        </div>

                        {status.message && (
                            <div className={`p-4 rounded-xl text-[10px] font-black uppercase flex items-center gap-3 ${status.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                {status.message}
                            </div>
                        )}

                        {/* Verification Calculator */}
                        <div className="bg-black/20 p-6 sm:p-8 rounded-3xl border border-gray-800/50">
                            <h4 className="text-md font-black uppercase tracking-tighter text-white mb-6 flex items-center gap-2">
                                <Settings className="w-4 h-4 text-yellow-500" /> Verification Calculator
                            </h4>
                            <form onSubmit={handleVerify} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <input 
                                    placeholder="Server Seed" 
                                    className="bg-black/40 border border-gray-800 p-3 rounded-xl text-[10px] text-white font-mono"
                                    value={verifyData.serverSeed}
                                    onChange={e => setVerifyData({...verifyData, serverSeed: e.target.value})}
                                />
                                <input 
                                    placeholder="Client Seed" 
                                    className="bg-black/40 border border-gray-800 p-3 rounded-xl text-[10px] text-white font-mono"
                                    value={verifyData.clientSeed}
                                    onChange={e => setVerifyData({...verifyData, clientSeed: e.target.value})}
                                />
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        placeholder="Nonce" 
                                        className="flex-1 bg-black/40 border border-gray-800 p-3 rounded-xl text-[10px] text-white font-mono"
                                        value={verifyData.nonce}
                                        onChange={e => setVerifyData({...verifyData, nonce: parseInt(e.target.value)})}
                                    />
                                    <button type="submit" className="bg-white text-black px-4 rounded-xl font-black text-[10px] uppercase">Verify</button>
                                </div>
                            </form>

                            {verifyResult && (
                                <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-4">
                                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl space-y-2">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase">Calculated HMAC-SHA256:</p>
                                        <p className="font-mono text-[9px] break-all text-white">{verifyResult.hash}</p>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase">Winning Prize:</p>
                                            <p className="text-xl font-black text-white">{verifyResult.prize.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase">Decimal Value:</p>
                                            <p className="text-sm font-black text-green-500">{verifyResult.decimal.toFixed(10)}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProvablyFairSettings;
