import React from 'react';
import { Flame, Check, Plus, Trash2 } from 'lucide-react';
import { Habit } from '../types';

interface HabitTrackerProps {
  habits: Habit[];
  onToggleHabit: (id: string, dateStr: string) => void;
  onAddHabit: (title: string) => void;
  onDeleteHabit: (id: string) => void;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({
  habits,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
}) => {
  const [newHabitTitle, setNewHabitTitle] = React.useState('');

  // Generate last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      dateStr: d.toISOString().split('T')[0],
      label: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    onAddHabit(newHabitTitle.trim());
    setNewHabitTitle('');
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-400" />
            Daily Study Habits
          </h3>
          <p className="text-slate-400 text-xs">Build consistent daily rituals for peak performance.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          placeholder="New habit (e.g. Reviewed notes, Read 10 pages)"
          value={newHabitTitle}
          onChange={(e) => setNewHabitTitle(e.target.value)}
          className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          required
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-xl shadow-lg shadow-amber-500/25 hover:opacity-95 transition-all flex items-center gap-1.5 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Habit
        </button>
      </form>

      <div className="overflow-x-auto">
        {habits.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>No study habits configured. Add one above!</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-medium text-slate-400 uppercase tracking-wider">
                <th className="pb-3 px-3">Habit</th>
                <th className="pb-3 px-3 text-center">Streak</th>
                {last7Days.map((day) => (
                  <th key={day.dateStr} className="pb-3 px-2 text-center">
                    {day.label}
                  </th>
                ))}
                <th className="pb-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {habits.map((habit) => (
                <tr key={habit.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 px-3 font-medium text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    {habit.title}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                      <Flame className="w-3.5 h-3.5" /> {habit.streak}d
                    </span>
                  </td>
                  {last7Days.map((day) => {
                    const isCompleted = habit.completedDates.includes(day.dateStr);
                    return (
                      <td key={day.dateStr} className="py-3 px-2 text-center">
                        <button
                          onClick={() => onToggleHabit(habit.id, day.dateStr)}
                          className={`w-8 h-8 rounded-xl mx-auto flex items-center justify-center transition-all ${
                            isCompleted
                              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                              : 'bg-slate-950/80 border border-slate-800 text-slate-700 hover:border-slate-700'
                          }`}
                        >
                          <Check className={`w-4 h-4 ${isCompleted ? 'opacity-100' : 'opacity-0'}`} />
                        </button>
                      </td>
                    );
                  })}
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};