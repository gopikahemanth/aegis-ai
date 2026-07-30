import { ContactMessage } from '../types/portfolio';

const STORAGE_KEYS = {
  CONTACT_MESSAGES: 'alex_morgan_portfolio_messages',
  THEME_PREFERENCE: 'alex_morgan_portfolio_theme'
};

export const storageService = {
  saveContactMessage(message: Omit<ContactMessage, 'id' | 'createdAt'>): ContactMessage {
    const messages = this.getContactMessages();
    const newMessage: ContactMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };
    messages.unshift(newMessage);
    localStorage.setItem(STORAGE_KEYS.CONTACT_MESSAGES, JSON.stringify(messages));
    return newMessage;
  },

  getContactMessages(): ContactMessage[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONTACT_MESSAGES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  getThemePreference(): 'dark' | 'light' {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE);
      return stored === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  },

  setThemePreference(theme: 'dark' | 'light'): void {
    localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, theme);
  }
};