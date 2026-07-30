import { useState, useCallback } from 'react';
import { Task } from '../types';
import { TaskService } from '../services/TaskService';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => TaskService.getTasks());

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'completedPomodoros' | 'status'>) => {
    const updated = TaskService.addTask(taskData);
    setTasks(TaskService.getTasks());
    return updated;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    const updated = TaskService.updateTask(id, updates);
    setTasks(updated);
  }, []);

  const deleteTask = useCallback((id: string) => {
    const updated = TaskService.deleteTask(id);
    setTasks(updated);
  }, []);

  const toggleTaskCompletion = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const updated = TaskService.updateTask(id, { completed: !task.completed });
      setTasks(updated);
    }
  }, [tasks]);

  const incrementTaskPomodoro = useCallback((id: string) => {
    const updated = TaskService.incrementPomodoro(id);
    setTasks(updated);
  }, []);

  const refreshTasks = useCallback(() => {
    setTasks(TaskService.getTasks());
  }, []);

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    incrementTaskPomodoro,
    refreshTasks
  };
}