import React, { useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Neural Authentication Successful for ${email}! Welcome to Aegis Secure Core.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-8 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors cursor-pointer">
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <i className="fa-solid fa-shield-halved text-lg"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Access Aegis Core</h3>
            <p className="text-xs text-slate-400">Secure enterprise authentication portal</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Enterprise Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="engineer@company.com" 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-cyan-500" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Neural Access Key</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••••" 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-cyan-500" 
            />
          </div>
          <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all mt-2 cursor-pointer">
            Authenticate & Enter Grid
          </button>
        </form>
      </div>
    </div>
  );
};