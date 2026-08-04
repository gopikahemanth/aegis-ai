export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = '/api/tasks';
const BACKUP_STORAGE_KEY = 'tasks_offline_backup_v1';

const getBackupTasks = (): Task[] => {
  try {
    const data = localStorage.getItem(BACKUP_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveBackupTasks = (tasks: Task[]): void => {
  try {
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save offline backup:', error);
  }
};

export const tasksApi = {
  async getAll(): Promise<Task[]> {
    try {
      const response = await fetch(API_BASE_URL, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Task[] = await response.json();
      saveBackupTasks(data);
      return data;
    } catch (error) {
      console.warn('Failed to fetch tasks from server, loading backup:', error);
      return getBackupTasks();
    }
  },

  async create(title: string): Promise<Task> {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.statusText}`);
    }

    const newTask: Task = await response.json();
    
    const current = getBackupTasks();
    saveBackupTasks([...current, newTask]);
    
    return newTask;
  },

  async update(id: string, updates: Partial<Pick<Task, 'title' | 'completed'>>): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`Failed to update task: ${response.statusText}`);
    }

    const updatedTask: Task = await response.json();

    const current = getBackupTasks();
    saveBackupTasks(current.map(t => t.id === id ? updatedTask : t));

    return updatedTask;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`Failed to delete task: ${response.statusText}`);
    }

    const current = getBackupTasks();
    saveBackupTasks(current.filter(t => t.id !== id));
  }
};