import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { adminAPI } from '../services/api';

const CurrencyConfigManager = ({ configs, onSave }) => {
  const [localConfigs, setLocalConfigs] = useState(configs);
  const [formLoading, setFormLoading] = useState(false);
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });

  const handleConfigChange = (currency, field, value) => {
    const newConfigs = localConfigs.map(c => 
      c.currency === currency 
        ? { ...c, [field]: value }
        : c
    );
    setLocalConfigs(newConfigs);
  };

  const handleSaveConfig = async (config) => {
    setFormLoading(true);
    try {
      await adminAPI.updateCurrencyConfig(config);
      setFormStatus({ type: 'success', message: `${config.currency} config saved!` });
      onSave();
    } catch (err) {
      setFormStatus({ type: 'error', message: 'Update failed' });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="bg-[#1a2c38] border border-gray-800 rounded-[2.5rem] p-8 mt-8">
      <h2 className="text-xl font-black uppercase tracking-tighter mb-6">Currency Settings</h2>
      <div className="space-y-6">
        {localConfigs.map(config => (
          <div key={config.currency} className="p-4 bg-black/40 border border-gray-800 rounded-2xl space-y-4">
            <h3 className="text-lg font-black uppercase text-yellow-500">{config.currency}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Min Deposit</label>
                <input 
                  type="number"
                  className="w-full p-3 bg-black border border-gray-800 rounded-xl text-sm font-bold"
                  value={config.minDeposit}
                  onChange={e => handleConfigChange(config.currency, 'minDeposit', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Max Deposit</label>
                <input
                  type="number"
                  className="w-full p-3 bg-black border border-gray-800 rounded-xl text-sm font-bold"
                  value={config.maxDeposit}
                  onChange={e => handleConfigChange(config.currency, 'maxDeposit', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Min Withdrawal</label>
                <input
                  type="number"
                  className="w-full p-3 bg-black border border-gray-800 rounded-xl text-sm font-bold"
                  value={config.minWithdrawal}
                  onChange={e => handleConfigChange(config.currency, 'minWithdrawal', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Max Withdrawal</label>
                <input
                  type="number"
                  className="w-full p-3 bg-black border border-gray-800 rounded-xl text-sm font-bold"
                  value={config.maxWithdrawal}
                  onChange={e => handleConfigChange(config.currency, 'maxWithdrawal', parseFloat(e.target.value))}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.allowDeposit}
                  onChange={e => handleConfigChange(config.currency, 'allowDeposit', e.target.checked)}
                />
                <label className="text-sm font-bold ml-2">Allow Deposits</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.allowWithdrawal}
                  onChange={e => handleConfigChange(config.currency, 'allowWithdrawal', e.target.checked)}
                />
                <label className="text-sm font-bold ml-2">Allow Withdrawals</label>
              </div>
            </div>
            <button
              onClick={() => handleSaveConfig(config)}
              disabled={formLoading}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl uppercase tracking-widest text-[10px] transition-all"
            >
              {formLoading ? <Loader2 className="animate-spin mx-auto w-4 h-4" /> : `Save ${config.currency} Config`}
            </button>
          </div>
        ))}
        {formStatus.message && (
          <p className={`text-[10px] font-black uppercase text-center ${formStatus.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>{formStatus.message}</p>
        )}
      </div>
    </div>
  );
};

export default CurrencyConfigManager;
