import { StorageService } from '../services/StorageService.js';

export class useSettings {
  constructor() {
    this.storageService = new StorageService();
    this.defaultSettings = {
      defaultDuration: 300, // 5 minutes in seconds
      soundEnabled: true,
      theme: 'dark'
    };
    this.settings = this.load();
    this.listeners = [];
  }

  load() {
    const saved = this.storageService.loadSettings();
    return saved ? { ...this.defaultSettings, ...saved } : this.defaultSettings;
  }

  update(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.storageService.saveSettings(this.settings);
    this.notifyListeners();
  }

  getSettings() {
    return { ...this.settings };
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.getSettings()));
  }
}