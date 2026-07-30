import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, Coffee, Flame, CheckCircle } from 'lucide-react';
import { TimerMode, Subject, Task } from '../types';

interface PomodoroTimerProps {
  mode: TimerMode;
  timeLeft: number;
  totalDuration: number;
  isRunning: boolean;
  pomodoroCount: number;
  subjects: Subject[];
  activeSubjectId: string;
  setActiveSubjectId: (id: string) => void;
  tasks: Task[];
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
  onSwitchMode: (mode: TimerMode) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  mode,
  timeLeft,
  totalDuration,
  isRunning,
  pomodoroCount,
  subjects,
  activeSubjectId,
  setActiveSubjectId,
  tasks,
  activeTaskId,
  setActiveTaskId,
  onSwitchMode,
  onStart,
  onPause,
  onReset,
  onSkip,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const activeSubject = subjects.find((s) => s.id === activeSubjectId) || subjects[0];
  const activeTask = tasks.find((t) => t.id === activeTaskId);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Mode Switcher */}
      <div className="flex justify-center">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-1.5 rounded-2xl flex gap-2 shadow-xl">
          <button
            onClick={() => onSwitchMode('pomodoro')}
            className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
              mode === 'pomodoro'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Flame className="w-4 h-4" /> Pomodoro
          </button>
          <button
            onClick={() => onSwitchMode('shortBreak')}
            className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
              mode === 'shortBreak'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Coffee className="w-4 h-4" /> Short Break
          </button>
          <button
            onClick={() => onSwitchMode('longBreak')}
            className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
              mode === 'longBreak'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Coffee className="w-4 h-4" /> Long Break
          </button>
        </div>
      </div>

      {/* Timer Circle & Controls */}
      <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Circular Countdown */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center my-6">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              className="stroke-slate-800"
              strokeWidth="12"
              fill="transparent"
            />
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              className={`transition-all duration-1000 ${
                mode === 'pomodoro' ? 'stroke-indigo-500' : mode === 'shortBreak' ? 'stroke-emerald-500' : 'stroke-cyan-500'
              }`}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tight">
              {formatTime(timeLeft)}
            </span>
            <span className="text-sm font-medium text-slate-400 mt-2 uppercase tracking-wider">
              {mode === 'pomodoro' ? 'Focus Time' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
            </span>
            <span className="text-xs text-indigo-400 font-medium mt-1">
              Completed Today: {pomodoroCount} Pomodoros
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={isRunning ? onPause : onStart}
            className={`px-8 py-4 rounded-2xl font-bold text-lg shadow-xl flex items-center gap-3 transition-all transform active:scale-95 ${
              isRunning
                ? 'bg-amber-600 text-white shadow-amber-600/30 hover:bg-amber-500'
                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-indigo-500/30 hover:opacity-95'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-6 h-6" /> Pause
              </>
            ) : (
              <>
                <Play className="w-6 h-6 fill-current" /> Start Focus
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl text-slate-300 hover:text-white transition-all shadow-lg"
            title="Reset Timer"
          >
            <RotateCcw className="w-6 h-6" />
          </button>

          <button
            onClick={onSkip}
            className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl text-slate-300 hover:text-white transition-all shadow-lg"
            title="Skip Session"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Selectors: Subject & Active Task */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject Selector */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Current Subject</h3>
          <div className="flex flex-wrap gap-2">
            {subjects.map((sub) => {
              const isSelected = sub.id === activeSubjectId;
              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubjectId(sub.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all border ${
                    isSelected
                      ? 'bg-slate-800 border-indigo-500/50 text-white shadow-lg'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sub.color }} />
                  {sub.name}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-4">Sessions will be logged under: <span className="text-white font-medium">{activeSubject?.name}</span></p>
        </div>

        {/* Task Selector */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Active Task Focus</h3>
            {tasks.filter((t) => !t.completed).length === 0 ? (
              <p className="text-xs text-slate-500 italic">No pending tasks. Add some in the dashboard or task manager.</p>
            ) : (
              <select
                value={activeTaskId || ''}
                onChange={(e) => setActiveTaskId(e.target.value || null)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">-- No specific task selected --</option>
                {tasks
                  .filter((t) => !t.completed)
                  .map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title} ({task.completedPomodoros}/{task.estimatedPomodoros} Pomodoros)
                    </option>
                  ))}
              </select>
            )}
          </div>
          {activeTask && (
            <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-300 text-xs">
                <CheckCircle className="w-4 h-4 text-indigo-400" />
                Working on: <span className="font-semibold text-white">{activeTask.title}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};