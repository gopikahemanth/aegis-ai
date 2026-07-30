import React from 'react';
import { BarChart3, TrendingUp, Clock, PieChart as PieIcon, Award, Zap } from 'lucide-react';
import { StudySession, Subject } from '../types';

interface AnalyticsChartsProps {
  sessions: StudySession[];
  subjects: Subject[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ sessions, subjects }) => {
  const focusSessions = sessions.filter((s) => s.type === 'focus');
  const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + s.duration, 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

  // Last 7 days breakdown with full detail
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const dateStr = d.toDateString();
    const daySessions = focusSessions.filter((s) => new Date(s.timestamp).toDateString() === dateStr);
    const mins = daySessions.reduce((acc, s) => acc + s.duration, 0);
    return {
      dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
      dateStr: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      minutes: mins,
      sessionsCount: daySessions.length,
    };
  });

  const maxMinutes = Math.max(...last7Days.map((d) => d.minutes), 60);

  // Subject breakdown with accurate calculations
  const subjectStats = subjects.map((sub) => {
    const subSessions = focusSessions.filter((s) => s.subjectId === sub.id);
    const mins = subSessions.reduce((acc, s) => acc + s.duration, 0);
    return {
      ...sub,
      minutes: mins,
      sessionCount: subSessions.length,
      percentage: totalFocusMinutes > 0 ? Math.round((mins / totalFocusMinutes) * 100) : 0,
    };
  }).sort((a, b) => b.minutes - a.minutes);

  const bestDay = last7Days.reduce((max, current) => (current.minutes > max.minutes ? current : max), last7Days[0]);
  const mostProductiveSubject = subjectStats.length > 0 ? subjectStats[0] : null;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5" /> Productivity Intelligence
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Study Analytics & Insights</h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Review your weekly focus distribution, subject dedication ratios, and overall deep work velocity.
          </p>
        </div>
      </div>

      {/* High-level KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Focus Time</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white font-mono mb-1">{totalFocusHours} <span className="text-lg font-sans text-slate-400">hrs</span></div>
            <p className="text-xs text-slate-500">{totalFocusMinutes} total minutes recorded across all sessions.</p>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completed Sessions</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white font-mono mb-1">{focusSessions.length}</div>
            <p className="text-xs text-slate-500">Total completed Pomodoro focus blocks.</p>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Top Subject</span>
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-white truncate mb-1">
              {mostProductiveSubject ? mostProductiveSubject.name : 'None'}
            </div>
            <p className="text-xs text-slate-500">
              {mostProductiveSubject ? `${mostProductiveSubject.minutes} mins invested` : 'No study data'}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Best Day (7 Days)</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-white truncate mb-1">{bestDay ? bestDay.dayName : 'N/A'}</div>
            <p className="text-xs text-slate-500">{bestDay ? `${bestDay.minutes} mins focused (${bestDay.dateStr})` : '0 mins'}</p>
          </div>
        </div>
      </div>

      {/* Detailed Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Bar Chart */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Weekly Focus Trend
              </h3>
              <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full">Last 7 Days</span>
            </div>
            <p className="text-xs text-slate-400 mb-8">Daily focus duration in minutes visualized as bar metrics.</p>
          </div>

          <div className="h-64 flex items-end justify-between gap-3 pt-4 border-b border-slate-800/80 pb-3">
            {last7Days.map((day, idx) => {
              const heightPercent = maxMinutes > 0 ? (day.minutes / maxMinutes) * 100 : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[11px] font-mono font-semibold text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 px-1.5 py-0.5 rounded shadow">
                    {day.minutes}m
                  </span>
                  <div className="w-full max-w-[48px] bg-slate-950/60 rounded-2xl overflow-hidden h-48 flex items-end p-1 border border-slate-800/50">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-600 via-purple-600 to-pink-500 rounded-xl transition-all duration-700 group-hover:brightness-125 shadow-lg shadow-indigo-500/20"
                      style={{ height: `${Math.max(heightPercent, 6)}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-white block">{day.dayName}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">{day.dateStr}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
            <span>Average: {Math.round(last7Days.reduce((acc, d) => acc + d.minutes, 0) / 7)} mins/day</span>
            <span className="font-mono text-indigo-400">{last7Days.reduce((acc, d) => acc + d.minutes, 0)}m total this week</span>
          </div>
        </div>

        {/* Subject Breakdown Progress Bars */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-indigo-400" />
                Subject Investment Breakdown
              </h3>
              <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full">{subjects.length} Subjects</span>
            </div>
            <p className="text-xs text-slate-400 mb-8">Proportional time distribution across your study subjects.</p>
          </div>

          <div className="space-y-5">
            {subjectStats.map((sub) => (
              <div key={sub.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-white flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: sub.color }} />
                    {sub.name}
                  </span>
                  <span className="text-slate-300 font-mono text-xs bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
                    {sub.minutes} mins <span className="text-slate-500">({sub.percentage}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-950/80 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800/60">
                  <div
                    className="h-full rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${sub.percentage}%`, backgroundColor: sub.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-4 h-4 text-indigo-400" /> Total Tracked Focus
            </span>
            <span className="font-mono font-bold text-white">{totalFocusMinutes} minutes ({totalFocusHours}h)</span>
          </div>
        </div>
      </div>
    </div>
  );
};