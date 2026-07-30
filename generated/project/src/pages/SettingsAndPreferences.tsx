import React, { useState } from 'react';
import { Currency } from '../types/finance';
import { StoragePersistenceService } from '../services/StoragePersistenceService';
import { Settings, Shield, Bell, Database, Check } from 'lucide-react';

interface SettingsAndPreferencesProps {
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
}

export const SettingsAndPreferences: React.FC<SettingsAndPreferencesProps> = ({
  currency,
  onCurrencyChange,
}) => {
  const [savedMessage, setSavedMessage] = useState(false);

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all data to default demo values?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-100">Settings & System Preferences</h2>
        <p className="text-xs text-slate-400">Manage global currency, security, and data storage</p>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl max-w-2xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100">General Terminal Preferences</h3>
            <p className="text-xs text-slate-400">Configure base currency and display defaults</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Default Display Currency</label>
            <select
              value={currency}
              onChange={(e) => {
                onCurrencyChange(e.target.value as Currency);
                setSavedMessage(true);
                setTimeout(() => setSavedMessage(false), 2000);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="USD">USD ($ - US Dollar)</option>
              <option value="EUR">EUR (€ - Euro)</option>
              <option value="GBP">GBP (£ - British Pound)</option>
              <option value="JPY">JPY (¥ - Japanese Yen)</option>
              <option value="CAD">CAD (CA$ - Canadian Dollar)</option>
            </select>
          </div>

          {savedMessage && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold animate-in fade-in">
              <Check className="w-4 h-4" /> Preferences saved successfully.
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-slate-800 space-y-4">
          <h4 className="font-bold text-slate-200 text-sm">Data Management</h4>
          <p className="text-xs text-slate-400">Reset local storage back to default demo state.</p>
          <button
            onClick={handleResetData}
            className="px-5 py-2.5 rounded-2xl bg-rose-600/10 border border-rose-500/20 text-rose-400 text-xs font-bold hover:bg-rose-600/20 transition-colors"
          >
            Reset Demo Data
          </button>
        </div>
      </div>
    </div>
  );
};