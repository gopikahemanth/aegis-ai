import { Task } from '../types';
import { StorageService } from './StorageService';
import { NotificationService } from './NotificationService';

export class TaskService {
  private static STORAGE_KEY = 'tasks';

  static getTasks(): Task[] {
    const defaultTasks: Task[] = [
      {
        id: 'task-1',
        title: 'Review System Architecture',
        description: 'Analyze the microservices and define clean boundary contexts.',
        completed: false,
        priority: 'high',
        category: 'Work',
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        estimatedPomodoros: 4,
        completedPomodoros: 2,
        createdAt: new Date().toISOString()
      },
      {
        id: 'task-2',
        title: 'Complete Weekly Workout Routine',
        description: 'Cardio session and upper body strength training.',
        completed: true,
        priority: 'medium',
        category: 'Health',
        dueDate: new Date().toISOString().split('T')[0],
        estimatedPomodoros: 2,
        completedPomodoros: 2,
        createdAt: new Date().toISOString()
      },
      {
        id: 'task-3',
        title: 'Read Advanced TypeScript Patterns',
        description: 'Focus on conditional types and template literal types.',
        completed: false,
        priority: 'low',
        category: 'Study',
        dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        estimatedPomodoros: 3,
        completedPomodoros: 0,
        createdAt: new Date().toISOString()
      }
    ];

    return StorageService.get<Task[]>(this.STORAGE_KEY, defaultTasks);
  }

  static saveTasks(tasks: Task[]): void {
    StorageService.set(this.STORAGE_KEY, tasks);
  }

  static addTask(taskData: Omit<Task, 'id' | 'createdAt' | 'completedPomodoros'>): Task {
    const tasks = this.getTasks();
    const newTask: Task = {
      ...taskData,
      id: Math.random().toString(36).substring(2, 9),
      completedPomodoros: 0,
      createdAt: new Date().toISOString()
    };
    
    const updated = [newTask, ...tasks];
    this.saveTasks(updated);
    NotificationService.addNotification('Task Created', `"${newTask.title}" has been added.`, 'success');
    return newTask;
  }

  static updateTask(id: string, updates: Partial<Task>): Task[] {
    const tasks = this.getTasks();
    const updated = tasks.map(task => {
      if (task.id === id) {
        const updatedTask = { ...task, ...updates };
        if (!task.completed && updatedTask.completed) {
          NotificationService.addNotification('Task Completed!', `Great job completing "${task.title}"`, 'success');
        }
        return updatedTask;
      }
      return task;
    });
    this.saveTasks(updated);
    return updated;
  }

  static deleteTask(id: string): Task[] {
    const tasks = this.getTasks();
    const taskToDelete = tasks.find(t => t.id === id);
    const updated = tasks.filter(task => task.id !== id);
    this.saveTasks(updated);
    if (taskToDelete) {
      NotificationService.addNotification('Task Deleted', `"${taskToDelete.title}" was removed.`, 'info');
    }
    return updated;
  }

  static incrementPomodoro(id: string): Task[] {
    const tasks = this.getTasks();
    const updated = tasks.map(task => {
      if (task.id === id) {
        return { ...task, completedPomodoros: task.completedPomodoros + 1 };
      }
      return task;
    });
    this.saveTasks(updated);
    return updated;
  }
}