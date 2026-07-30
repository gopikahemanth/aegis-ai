import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { NotificationService } from '../services/NotificationService';

export const SettingsPage: React.FC = () => {
  const [userName, setUserName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@aegisflow.io');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    NotificationService.addNotification('Settings Updated', 'Your profile preferences were successfully saved.', 'success');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-2xl animate-fadeIn">
      <div>
        <h2 className="text-xl font-extrabold text-slate-100">Workspace Settings</h2>
        <p className="text-xs text-slate-400 mt-1">Configure your personal profile, notification permissions, and workspace defaults.</p>
      </div>

      <form onSubmit={handleSave} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
        <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-4">Personal Profile</h3>

        <div className="space-y-4">
          <Input
            label="Full Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="border-t border-slate-800 pt-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-200">Notifications & Permissions</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-200">Browser Push Notifications</p>
              <p className="text-[11px] text-slate-400">Enable desktop alerts when pomodoro timers complete.</p>
            </div>
            <Button
              variant="secondary"
              type="button"
              size="sm"
              onClick={() => NotificationService.requestBrowserPermission()}
            >
              Request Permission
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-xs text-emerald-400 font-medium">
            {saved ? '✓ Changes saved successfully' : ''}
          </span>
          <Button variant="primary" type="submit">
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
};