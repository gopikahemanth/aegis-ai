import React, { useState, useRef, useEffect } from 'react';
import { NotificationService } from '../services/NotificationService';
import { NotificationItem } from '../types';
import { useClickOutside } from '../hooks/useClickOutside';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => NotificationService.getNotifications());
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setIsOpen(false));

  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(NotificationService.getNotifications());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAll = () => {
    setNotifications(NotificationService.markAllAsRead());
  };

  const handleClear = () => {
    NotificationService.clearAll();
    setNotifications([]);
  };

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all focus:outline-none"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-rose-500/50">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-3 z-50 animate-fadeIn">
          <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-800">
            <h4 className="font-bold text-sm text-slate-100">Notifications</h4>
            <div className="flex items-center gap-2">
              <button onClick={handleMarkAll} className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300">
                Mark all read
              </button>
              <span className="text-slate-700">|</span>
              <button onClick={handleClear} className="text-[11px] font-medium text-slate-400 hover:text-rose-400">
                Clear
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No notifications right now
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-4 transition-colors ${n.read ? 'bg-slate-900/40 opacity-75' : 'bg-slate-900/90'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-xs text-slate-200">{n.title}</p>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};