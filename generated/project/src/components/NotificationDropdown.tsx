import React, { useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { NotificationItem } from '../types/finance';
import { StoragePersistenceService } from '../services/StoragePersistenceService';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(StoragePersistenceService.getNotifications());

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    StoragePersistenceService.saveNotifications(updated);
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default: return <Info className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors shadow-md"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in duration-200">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <h4 className="font-bold text-slate-100 text-sm">Notifications & Alerts</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No notifications at this time.</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-4 hover:bg-slate-800/40 transition-colors flex gap-3 ${!n.read ? 'bg-indigo-950/20' : ''}`}>
                  <div className="shrink-0 mt-0.5">{getIcon(n.type)}</div>
                  <div className="flex-1">
                    <div className="font-bold text-xs text-slate-200 mb-0.5">{n.title}</div>
                    <div className="text-xs text-slate-400 mb-1 leading-relaxed">{n.message}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{n.timestamp}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};