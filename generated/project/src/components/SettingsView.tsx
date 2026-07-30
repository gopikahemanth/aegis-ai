import React, { useState } from 'react';
import { Settings, Volume2, Bell, Target, User, Save, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { UserSettings, Subject } from '../types';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  subjects: Subject[];
  onAddSubject: (subject: Omit<Subject, 'id'>) => void;
  onDeleteSubject: (id: string) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  subjects,
  onAddSubject,
  onDeleteSubject,
  onResetData,
}) => {
  const [form, setForm] = useState<UserSettings>(settings);
  const [saved, setSaved] = useState(false);

  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('#6366f1');

  const handleChange = (key: keyof UserSettings, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    onAddSubject({ name: newSubjectName.trim(), color: newSubjectColor });
    setNewSubjectName('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-400" />
            Settings & Preferences
          </h2>
          <p className="text-slate-400 text-sm">Customize your Pomodoro durations, sound alerts, subjects, and data.</p>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-sm font-medium flex items-center gap-2 animate-fadeIn">
          Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Timer Durations */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            Timer Durations (Minutes)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Pomodoro Focus</label>
              <input
                type="number"
                min="1"
                max="120"
                value={form.pomodoroTime}
                onChange={(e) => handleChange('pomodoroTime', parseInt(e.target.value, 10) || 25)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Short Break</label>
              <input
                type="number"
                min="1"
                max="60"
                value={form.shortBreakTime}
                onChange={(e) => handleChange('shortBreakTime', parseInt(e.target.value, 10) || 5)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Long Break</label>
              <input
                type="number"
                min="1"
                max="60"
                value={form.longBreakTime}
                onChange={(e) => handleChange('longBreakTime', parseInt(e.target.value, 10) || 15)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                required
              />
            </div>
          </div>
        </div>

        {/* Automation & Goals */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            Automation & Daily Goals
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Daily Goal (Minutes)</label>
              <input
                type="number"
                min="10"
                max="1440"
                value={form.dailyGoalMinutes}
                onChange={(e) => handleChange('dailyGoalMinutes', parseInt(e.target.value, 10) || 120)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Long Break Interval</label>
              <input
                type="number"
                min="1"
                max="10"
                value={form.longBreakInterval}
                onChange={(e) => handleChange('longBreakInterval', parseInt(e.target.value, 10) || 4)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoStartBreaks}
                onChange={(e) => handleChange('autoStartBreaks', e.target.checked)}
                className="w-5 h-5 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-300">Auto-start breaks when timer completes</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoStartPomodoros}
                onChange={(e) => handleChange('autoStartPomodoros', e.target.checked)}
                className="w-5 h-5 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-300">Auto-start pomodoros when breaks complete</span>
            </label>
          </div>
        </div>

        {/* Sound & Profile */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-indigo-400" />
            Sound & Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">User Name</label>
              <div className="relative">
                <User className="absolute left-4 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={form.userName}
                  onChange={(e) => handleChange('userName', e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-12 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Audio Alerts</label>
              <label className="flex items-center gap-3 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={form.soundEnabled}
                  onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                  className="w-5 h-5 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-300">Enable notification sounds & clicks</span>
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all flex items-center gap-2"
        >
          <Save className="w-5 h-5" /> Save Changes
        </button>
      </form>

      {/* Subject Management */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-400" />
          Manage Subjects
        </h3>

        <form onSubmit={handleAddSub} className="flex gap-3">
          <input
            type="text"
            placeholder="New Subject Name"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            required
          />
          <input
            type="color"
            value={newSubjectColor}
            onChange={(e) => setNewSubjectColor(e.target.value)}
            className="w-12 h-11 bg-slate-950 border border-slate-800 rounded-xl p-1 cursor-pointer"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all flex items-center gap-1.5 text-sm"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((sub) => (
            <div key={sub.id} className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: sub.color }} />
                <span className="font-medium text-white text-sm">{sub.name}</span>
              </div>
              {subjects.length > 1 && (
                <button
                  onClick={() => onDeleteSubject(sub.id)}
                  className="p-1 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-red-400" />
          Data Management
        </h3>
        <p className="text-xs text-slate-400">Reset all application data, sessions, tasks, and habits back to default state.</p>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
              onResetData();
            }
          }}
          className="px-5 py-2.5 bg-red-600/10 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white font-medium rounded-xl transition-all text-sm flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Reset All Application Data
        </button>
      </div>
    </div>
  );
};