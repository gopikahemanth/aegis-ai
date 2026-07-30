import React from 'react';
import { Currency } from '../types/finance';
import { NotificationDropdown } from './NotificationDropdown';
import { Plus, Search, ShieldCheck } from 'lucide-react';

interface TopbarHeaderProps {
  currentCurrency: Currency;
  onCurrencyChange: (c: Currency) => void;
  onOpenAddModal: () => void;
}

const currencies: Currency[] = ['USD', 'EUR', 'GBP', 'JPY', 'CAD'];

export const TopbarHeader: React.FC<TopbarHeaderProps> = ({
  currentCurrency,
  onCurrencyChange,
  onOpenAddModal,
}) => {
  return (
    <header className="h-20 bg-slate-950/70 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-30 px-6 sm:px-8 flex items-center justify-between gap-4">
      {/* Mobile Brand / Global Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="flex lg:hidden items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-slate-100 text-sm">AEGIS</span>
        </div>

        <div className="relative hidden sm:block flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search accounts, stocks, transactions..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
          />
        </div>
      </div>

      {/* Actions & Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Currency Switcher */}
        <div className="relative">
          <select
            value={currentCurrency}
            onChange={(e) => onCurrencyChange(e.target.value as Currency)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-md"
          >
            {currencies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Notification bell */}
        <NotificationDropdown />

        {/* Quick Add Button */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:scale-[1.02] active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Transaction</span>
        </button>
      </div>
    </header>
  );
};