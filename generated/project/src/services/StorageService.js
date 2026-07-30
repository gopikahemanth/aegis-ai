export class StorageService {
  constructor(storageKey = 'aegis_countdown_settings') {
    this.storageKey = storageKey;
  }

  saveSettings(settings) {
    try {
      const serialized = JSON.stringify(settings);
      localStorage.setItem(this.storageKey, serialized);
      return true;
    } catch (error) {
      console.error('Failed to save settings to localStorage', error);
      return false;
    }
  }

  loadSettings() {
    try {
      const serialized = localStorage.getItem(this.storageKey);
      if (!serialized) {
        return null;
      }
      return JSON.parse(serialized);
    } catch (error) {
      console.error('Failed to load settings from localStorage', error);
      return null;
    }
  }
}