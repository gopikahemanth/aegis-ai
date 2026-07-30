import { StorageService } from '../services/StorageService.js';

export class useSettings {
  constructor() {
    this.storageService = new StorageService();
    this.defaultSettings = {
      hours: 0,
      minutes: 5,
      seconds: 0,
      soundEnabled: true
    };
  }

  getSettings() {
    const saved = this.storageService.loadSettings();
    return saved ? { ...this.defaultSettings, ...saved } : this.defaultSettings;
  }

  saveSettings(settings) {
    return this.storageService.saveSettings(settings);
  }

  convertToSeconds(settings) {
    const h = parseInt(settings.hours, 10) || 0;
    const m = parseInt(settings.minutes, 10) || 0;
    const s = parseInt(settings.seconds, 10) || 0;
    return (h * 3600) + (m * 60) + s;
  }
}