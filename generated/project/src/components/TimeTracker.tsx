import React, { useState, useEffect, useCallback } from 'react';
import { TimerMode } from '../types';
import { Button } from './Button';
import { useMetrics } from '../hooks/useMetrics';
import { NotificationService } from '../services/NotificationService';

export const TimeTracker: React.FC = () => {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const { recordSession } = useMetrics();

  const modeTimes: Record<TimerMode, number> = {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
  };

  const switchMode = useCallback((newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(modeTimes[newMode]);
  }, []);

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    if (mode === 'pomodoro') {
      recordSession(25);
      NotificationService.addNotification('Pomodoro Completed!', 'Take a well-deserved break.', 'success');
      NotificationService.sendBrowserNotification('Pomodoro Completed!', { body: 'Time for a break!' });
    } else {
      NotificationService.addNotification('Break Ended', 'Ready to get back to flow?', 'info');
    }
  }, [mode, recordSession]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, handleTimerComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progress = 100 - (timeLeft / modeTimes[mode]) * 100;

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col items-center justify-between relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/5 rounded-full blur-3xl" />

      <div className="w-full flex items-center justify-between mb-6 relative z-10">
        <h3 className="font-bold text-sm text-slate-200">Pomodoro Focus Timer</h3>
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          {(['pomodoro', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === m
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m === 'pomodoro' ? 'Focus' : m === 'shortBreak' ? 'Short Break' : 'Long Break'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-56 h-56 flex items-center justify-center my-4 relative z-10">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="112"
            cy="112"
            r="96"
            className="stroke-slate-800"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="112"
            cy="112"
            r="96"
            className="stroke-indigo-600 transition-all duration-1000"
            strokeWidth="10"
            strokeDasharray={2 * Math.PI * 96}
            strokeDashoffset={2 * Math.PI * 96 * (1 - progress / 100)}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold text-slate-100 tracking-tight font-mono">{formattedTime}</span>
          <span className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            {mode === 'pomodoro' ? 'Focus Session' : 'Resting'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6 relative z-10">
        <Button
          variant={isRunning ? 'secondary' : 'primary'}
          size="lg"
          onClick={() => setIsRunning(!isRunning)}
          className="w-36"
        >
          {isRunning ? 'Pause' : 'Start Focus'}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            setIsRunning(false);
            setTimeLeft(modeTimes[mode]);
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  );
};