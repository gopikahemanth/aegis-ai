export class StorageService {
    constructor() {
        this.STORAGE_KEYS = {
            SETTINGS: 'aegis_timer_settings',
            PRESETS: 'aegis_timer_presets',
            STATE: 'aegis_timer_state'
        };
    }

    getSettings() {
        const defaultSettings = {
            targetName: 'Countdown Event',
            sound: 'bell',
            notifications: false,
            darkMode: false
        };
        const data = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
        return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
    }

    saveSettings(settings) {
        localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }

    getPresets() {
        const defaultPresets = [
            { id: '1', name: 'Pomodoro', hours: 0, minutes: 25, seconds: 0 },
            { id: '2', name: 'Short Break', hours: 0, minutes: 5, seconds: 0 },
            { id: '3', name: 'Long Break', hours: 0, minutes: 15, seconds: 0 },
            { id: '4', name: 'Quick Hour', hours: 1, minutes: 0, seconds: 0 }
        ];
        const data = localStorage.getItem(this.STORAGE_KEYS.PRESETS);
        return data ? JSON.parse(data) : defaultPresets;
    }

    savePresets(presets) {
        localStorage.setItem(this.STORAGE_KEYS.PRESETS, JSON.stringify(presets));
    }

    getState() {
        const data = localStorage.getItem(this.STORAGE_KEYS.STATE);
        return data ? JSON.parse(data) : null;
    }

    saveState(state) {
        localStorage.setItem(this.STORAGE_KEYS.STATE, JSON.stringify(state));
    }

    clearState() {
        localStorage.removeItem(this.STORAGE_KEYS.STATE);
    }
}