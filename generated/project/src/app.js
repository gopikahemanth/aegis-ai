import { StorageService } from './services/StorageService.js';
import { TimerService } from './services/TimerService.js';

class App {
    constructor() {
        this.storage = new StorageService();
        this.timer = new TimerService();
        this.settings = this.storage.getSettings();
        this.presets = this.storage.getPresets();

        this.initDOM();
        this.initEvents();
        this.applySettings();
        
        this.timer.subscribe((state) => this.renderTimer(state));
        this.timer.subscribe({
            onComplete: () => this.handleComplete()
        });

        this.timer.setDuration(0, 5, 0);
    }

    initDOM() {
        this.views = document.querySelectorAll('.view');
        this.navBtns = document.querySelectorAll('.nav-btn');
        
        this.hoursDisplay = document.getElementById('hours-display');
        this.minutesDisplay = document.getElementById('minutes-display');
        this.secondsDisplay = document.getElementById('seconds-display');
        
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        
        this.eventTitleDisplay = document.getElementById('event-title-display');
        this.progressRingIndicator = document.getElementById('progress-ring-indicator');
        
        this.presetsGrid = document.getElementById('presets-grid');
        this.presetNameInput = document.getElementById('preset-name');
        this.presetHoursInput = document.getElementById('preset-hours');
        this.presetMinutesInput = document.getElementById('preset-minutes');
        this.presetSecondsInput = document.getElementById('preset-seconds');
        this.savePresetBtn = document.getElementById('save-preset-btn');
        
        this.settingTargetName = document.getElementById('setting-target-name');
        this.settingSound = document.getElementById('setting-sound');
        this.settingNotifications = document.getElementById('setting-notifications');
        this.settingDarkMode = document.getElementById('setting-dark-mode');
        this.saveSettingsBtn = document.getElementById('save-settings-btn');
        
        this.adjustBtns = document.querySelectorAll('.btn-adjust');
    }

    initEvents() {
        this.navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.target.getAttribute('data-target');
                this.switchView(targetId);
            });
        });

        this.startBtn.addEventListener('click', () => this.timer.start());
        this.pauseBtn.addEventListener('click', () => this.timer.pause());
        this.resetBtn.addEventListener('click', () => this.timer.reset());

        this.adjustBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const secs = parseInt(e.target.getAttribute('data-seconds'), 10);
                this.timer.addSeconds(secs);
            });
        });

        this.savePresetBtn.addEventListener('click', () => this.saveCustomPreset());
        this.saveSettingsBtn.addEventListener('click', () => this.saveUserSettings());

        this.renderPresets();
    }

    switchView(targetId) {
        this.views.forEach(view => {
            if (view.id === targetId) {
                view.classList.add('active');
            } else {
                view.classList.remove('active');
            }
        });

        this.navBtns.forEach(btn => {
            if (btn.getAttribute('data-target') === targetId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    renderTimer(state) {
        this.hoursDisplay.textContent = String(state.hours).padStart(2, '0');
        this.minutesDisplay.textContent = String(state.minutes).padStart(2, '0');
        this.secondsDisplay.textContent = String(state.seconds).padStart(2, '0');

        this.startBtn.disabled = state.isRunning || state.remainingSeconds <= 0;
        this.pauseBtn.disabled = !state.isRunning;

        const circumference = 753.98;
        const offset = circumference - (state.progress * circumference);
        this.progressRingIndicator.style.strokeDashoffset = offset;

        document.title = `${this.hoursDisplay.textContent}:${this.minutesDisplay.textContent}:${this.secondsDisplay.textContent} - Aegis Timer`;
    }

    handleComplete() {
        this.timer.playAlarm(this.settings.sound);
        if (this.settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Countdown Complete!', {
                body: `${this.settings.targetName} has finished.`
            });
        }
    }

    renderPresets() {
        this.presetsGrid.innerHTML = '';
        this.presets.forEach(preset => {
            const card = document.createElement('div');
            card.className = 'preset-card';
            card.innerHTML = `
                <div class="preset-title">${preset.name}</div>
                <div class="preset-time">${String(preset.hours).padStart(2, '0')}:${String(preset.minutes).padStart(2, '0')}:${String(preset.seconds).padStart(2, '0')}</div>
            `;
            card.addEventListener('click', () => {
                this.timer.setDuration(preset.hours, preset.minutes, preset.seconds);
                this.switchView('timer-view');
            });
            this.presetsGrid.appendChild(card);
        });
    }

    saveCustomPreset() {
        const name = this.presetNameInput.value.trim() || 'Custom';
        const hours = parseInt(this.presetHoursInput.value, 10) || 0;
        const minutes = parseInt(this.presetMinutesInput.value, 10) || 0;
        const seconds = parseInt(this.presetSecondsInput.value, 10) || 0;

        if (hours === 0 && minutes === 0 && seconds === 0) return;

        const newPreset = {
            id: Date.now().toString(),
            name,
            hours,
            minutes,
            seconds
        };

        this.presets.push(newPreset);
        this.storage.savePresets(this.presets);
        this.renderPresets();

        this.presetNameInput.value = '';
        this.presetHoursInput.value = '0';
        this.presetMinutesInput.value = '25';
        this.presetSecondsInput.value = '0';
    }

    applySettings() {
        this.eventTitleDisplay.textContent = this.settings.targetName;
        this.settingTargetName.value = this.settings.targetName;
        this.settingSound.value = this.settings.sound;
        this.settingNotifications.checked = this.settings.notifications;
        this.settingDarkMode.checked = this.settings.darkMode;

        if (this.settings.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        if (this.settings.notifications && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    saveUserSettings() {
        this.settings.targetName = this.settingTargetName.value.trim() || 'Countdown Event';
        this.settings.sound = this.settingSound.value;
        this.settings.notifications = this.settingNotifications.checked;
        this.settings.darkMode = this.settingDarkMode.checked;

        this.storage.saveSettings(this.settings);
        this.applySettings();
        this.switchView('timer-view');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new App();
});