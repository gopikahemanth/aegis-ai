export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export interface Subject {
  id: string;
  name: string;
  color: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  duration: number; // in minutes
  timestamp: number;
  type: 'focus' | 'break';
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  subjectId?: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  priority: 'low' | 'medium' | 'high';
}

export interface Habit {
  id: string;
  title: string;
  streak: number;
  completedDates: string[]; // YYYY-MM-DD
}

export interface UserSettings {
  pomodoroTime: number; // in minutes
  shortBreakTime: number;
  longBreakTime: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  longBreakInterval: number;
  soundEnabled: boolean;
  soundVolume: number;
  dailyGoalMinutes: number;
  userName: string;
}