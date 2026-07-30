import { ActivityLog } from '../types';
import { StorageService } from './StorageService';
import { TaskService } from './TaskService';

export class AnalyticsService {
  private static STORAGE_KEY = 'activity_logs';

  static getLogs(): ActivityLog[] {
    const today = new Date().toISOString().split('T')[0];
    const defaultLogs: ActivityLog[] = [
      {
        date: today,
        tasksCompleted: 3,
        pomodorosCompleted: 6,
        focusMinutes: 150
      }
    ];
    return StorageService.get<ActivityLog[]>(this.STORAGE_KEY, defaultLogs);
  }

  static recordFocusSession(minutes: number): void {
    const logs = this.getLogs();
    const today = new Date().toISOString().split('T')[0];
    const existingIndex = logs.findIndex(l => l.date === today);

    if (existingIndex >= 0) {
      logs[existingIndex].focusMinutes += minutes;
      logs[existingIndex].pomodorosCompleted += 1;
    } else {
      logs.push({
        date: today,
        tasksCompleted: 0,
        pomodorosCompleted: 1,
        focusMinutes: minutes
      });
    }

    StorageService.set(this.STORAGE_KEY, logs);
  }

  static getStats() {
    const tasks = TaskService.getTasks();
    const logs = this.getLogs();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalPomodoros = tasks.reduce((acc, t) => acc + t.completedPomodoros, 0);
    const totalFocusMinutes = logs.reduce((acc, l) => acc + l.focusMinutes, 0);

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      totalPomodoros,
      totalFocusMinutes,
      completionRate,
      logs
    };
  }
}