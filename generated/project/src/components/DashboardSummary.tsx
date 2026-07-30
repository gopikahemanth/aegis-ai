import React from 'react';
import { Clock, CheckCircle, Flame, Target, Trophy, ArrowUpRight } from 'lucide-react';
import { StudySession, Task, Habit } from '../types';

interface DashboardSummaryProps {
  sessions: StudySession[];
  tasks: Task[];
  habits: Habit[];
  dailyGoalMinutes: number;
  userName: string;
  onNavigatePomodoro: () => void;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  sessions,
  tasks,
  habits,
  dailyGoalMinutes,
  userName,
  onNavigatePomodoro,
}) => {
  const today = new Date().toDateString();
  const todaySessions = sessions.filter((s) => new Date(s.timestamp).toDateString() === today && s.type === 'focus');
  const todayFocusMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);
  const goalProgress = Math.min(100, Math.round((todayFocusMinutes / dailyGoalMinutes) * 100));

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const completedHabitsToday = habits.filter((h) => h.completedDates.includes(todayStr)).length;
  const totalHabits = habits.length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 top-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5" /> Welcome back, {userName}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to crush your goals today?
            </h1>
            <p className="text-slate-300 max-w-xl text-sm sm:text-base">
              You have completed <span className="text-indigo-400 font-semibold">{todayFocusMinutes} minutes</span> of focus out of your {dailyGoalMinutes}m daily target.
            </p>
          </div>

          <button
            onClick={onNavigatePomodoro}
            className="self-start md:self-auto px-6 py-3.5 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-500/25 hover:opacity-95 transition-all flex items-center gap-2 group"
          >
            Start Focus Session
            <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Focus Time */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today's Focus</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white font-mono mb-1">{todayFocusMinutes} <span className="text-lg text-slate-400 font-sans">mins</span></div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{goalProgress}% of daily {dailyGoalMinutes}m goal</p>
          </div>
        </div>

        {/* Card 2: Tasks Completed */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tasks Completed</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white font-mono mb-1">{completedTasks} <span className="text-lg text-slate-400 font-sans">/ {totalTasks}</span></div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${taskProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{taskProgress}% tasks checked off</p>
          </div>
        </div>

        {/* Card 3: Habits */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Study Habits</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white font-mono mb-1">{completedHabitsToday} <span className="text-lg text-slate-400 font-sans">/ {totalHabits}</span></div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${totalHabits > 0 ? (completedHabitsToday / totalHabits) * 100 : 0}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Habits completed today</p>
          </div>
        </div>

        {/* Card 4: Daily Goal Status */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Goal Status</span>
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white font-mono mb-1">
              {goalProgress >= 100 ? 'Goal Reached! 🎉' : `${dailyGoalMinutes - todayFocusMinutes}m left`}
            </div>
            <p className="text-xs text-slate-400 mt-3">
              {goalProgress >= 100 ? 'Fantastic work today. Keep the momentum going!' : 'Stay consistent with your Pomodoros.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};