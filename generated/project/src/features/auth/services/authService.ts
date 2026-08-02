import { User } from '../../../entities/User';

export const authService = {
  getCurrentUser(): User | null {
    const raw = localStorage.getItem('ai_study_current_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null): void {
    if (!user) {
      localStorage.removeItem('ai_study_current_user');
    } else {
      localStorage.setItem('ai_study_current_user', JSON.stringify(user));
    }
  },

  async login(email: string, pass: string): Promise<User> {
    if (!email || !pass) {
      throw new Error('Email and password are required');
    }
    const user: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email,
      name: email.split('@')[0],
      createdAt: new Date().toISOString(),
      studyStreak: 5,
      totalStudyHours: 12,
      preferredAiProvider: 'openai',
    };
    this.setCurrentUser(user);
    return user;
  },

  async register(email: string, pass: string, name: string): Promise<User> {
    if (!email || !pass || !name) {
      throw new Error('All registration fields are required');
    }
    const user: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email,
      name,
      createdAt: new Date().toISOString(),
      studyStreak: 1,
      totalStudyHours: 1,
      preferredAiProvider: 'openai',
    };
    this.setCurrentUser(user);
    return user;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('ai_study_current_user');
  },

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const current = this.getCurrentUser();
    if (!current || current.id !== userId) {
      throw new Error('Not authenticated');
    }
    const updated: User = { ...current, ...data };
    this.setCurrentUser(updated);
    return updated;
  }
};