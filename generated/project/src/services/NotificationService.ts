import { NotificationItem } from '../types';
import { StorageService } from './StorageService';

export class NotificationService {
  private static STORAGE_KEY = 'notifications';

  static getNotifications(): NotificationItem[] {
    return StorageService.get<NotificationItem[]>(this.STORAGE_KEY, []);
  }

  static addNotification(title: string, message: string, type: NotificationItem['type'] = 'info'): NotificationItem {
    const notifications = this.getNotifications();
    const newItem: NotificationItem = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };

    const updated = [newItem, ...notifications].slice(0, 50); // Keep last 50
    StorageService.set(this.STORAGE_KEY, updated);
    return newItem;
  }

  static markAsRead(id: string): NotificationItem[] {
    const notifications = this.getNotifications();
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    StorageService.set(this.STORAGE_KEY, updated);
    return updated;
  }

  static markAllAsRead(): NotificationItem[] {
    const notifications = this.getNotifications();
    const updated = notifications.map(n => ({ ...n, read: true }));
    StorageService.set(this.STORAGE_KEY, updated);
    return updated;
  }

  static clearAll(): void {
    StorageService.set(this.STORAGE_KEY, []);
  }

  static requestBrowserPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  static sendBrowserNotification(title: string, options?: NotificationOptions): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          ...options
        });
      } catch (e) {
        console.error('Failed to send browser notification', e);
      }
    }
  }
}