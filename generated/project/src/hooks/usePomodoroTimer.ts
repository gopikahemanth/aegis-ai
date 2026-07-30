import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerMode, UserSettings, StudySession } from '../types';
import { audioService } from '../utils/sound';

interface UsePomodoroTimerProps {
  settings: UserSettings;
  onSessionComplete: (session: Omit<StudySession, 'id'>) => void;
  activeSubjectId: string;
}

export function usePomodoroTimer({ settings, onSessionComplete, activeSubjectId }: UsePomodoroTimerProps) {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState<number>(settings.pomodoroTime * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [pomodoroCount, setPomodoroCount] = useState<number>(0);

  const timerRef = useRef<number | null>(null);

  const getDurationForMode = useCallback((m: TimerMode) => {
    switch (m) {
      case 'pomodoro':
        return settings.pomodoroTime * 60;
      case 'shortBreak':
        return settings.shortBreakTime * 60;
      case 'longBreak':
        return settings.longBreakTime * 60;
    }
  }, [settings]);

  // Sync timer length if settings change and timer is not running
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(getDurationForMode(mode));
    }
  }, [settings, mode, isRunning, getDurationForMode]);

  const switchMode = useCallback((newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(getDurationForMode(newMode));
    audioService.playClick(settings.soundEnabled, settings.soundVolume);
  }, [getDurationForMode, settings.soundEnabled, settings.soundVolume]);

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    audioService.playAlarm(settings.soundEnabled, settings.soundVolume);

    if (mode === 'pomodoro') {
      const nextCount = pomodoroCount + 1;
      setPomodoroCount(nextCount);

      onSessionComplete({
        subjectId: activeSubjectId,
        duration: settings.pomodoroTime,
        timestamp: Date.now(),
        type: 'focus',
      });

      if (nextCount % settings.longBreakInterval === 0) {
        setMode('longBreak');
        setTimeLeft(settings.longBreakTime * 60);
        if (settings.autoStartBreaks) setIsRunning(true);
      } else {
        setMode('shortBreak');
        setTimeLeft(settings.shortBreakTime * 60);
        if (settings.autoStartBreaks) setIsRunning(true);
      }
    } else {
      onSessionComplete({
        subjectId: activeSubjectId,
        duration: mode === 'shortBreak' ? settings.shortBreakTime : settings.longBreakTime,
        timestamp: Date.now(),
        type: 'break',
      });

      setMode('pomodoro');
      setTimeLeft(settings.pomodoroTime * 60);
      if (settings.autoStartPomodoros) setIsRunning(true);
    }
  }, [mode, pomodoroCount, settings, activeSubjectId, onSessionComplete]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    }
  }, [timeLeft, isRunning, handleTimerComplete]);

  const startTimer = () => {
    setIsRunning(true);
    audioService.playClick(settings.soundEnabled, settings.soundVolume);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    audioService.playClick(settings.soundEnabled, settings.soundVolume);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDurationForMode(mode));
    audioService.playClick(settings.soundEnabled, settings.soundVolume);
  };

  const skipTimer = () => {
    if (mode === 'pomodoro') {
      switchMode('shortBreak');
    } else {
      switchMode('pomodoro');
    }
  };

  return {
    mode,
    timeLeft,
    isRunning,
    pomodoroCount,
    switchMode,
    startTimer,
    pauseTimer,
    resetTimer,
    skipTimer,
    totalDuration: getDurationForMode(mode),
  };
}