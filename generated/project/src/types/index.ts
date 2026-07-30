export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type Category = 'Work' | 'Personal' | 'Study' | 'Health' | 'Finance';

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  dueDate: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  createdAt: string;
}

export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export interface TimerSettings {
  pomodoro: number;
  shortBreak: number;
  longBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export interface ActivityLog {
  date: string;
  tasksCompleted: number;
  pomodorosCompleted: number;
  focusMinutes: number;
}

export interface UserSettings {
  userName: string;
  theme: 'dark' | 'midnight';
  timerSettings: TimerSettings;
  dailyGoalPomodoros: number;
}