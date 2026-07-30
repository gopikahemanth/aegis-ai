import { useTimer } from './hooks/useTimer.js';
import { useSettings } from './hooks/useSettings.js';
import { useNotification } from './hooks/useNotification.js';

class AppController {
  constructor() {
    this.settingsHook = new useSettings();
    this.notificationHook = new useNotification('notification-alert');
    
    const initialSettings = this.settingsHook.getSettings();
    const initialSeconds = this.settingsHook.convertToSeconds(initialSettings);

    this.timerHook = new useTimer(
      (remainingSeconds) => this.handleTick(remainingSeconds),
      () => this.handleComplete()
    );

    this.timerHook.setDurationFromSeconds(initialSeconds);

    this.initElements();
    this.initNavigation();
    this.initEventListeners();
    this.populateSettingsForm(initialSettings);
    this.updateDisplay();
  }

  initElements() {
    this.hoursEl = document.getElementById('hours');
    this.minutesEl = document.getElementById('minutes');
    this.secondsEl = document.getElementById('seconds');
    
    this.startBtn = document.getElementById('start-btn');
    this.pauseBtn = document.getElementById('pause-btn');
    this.resetBtn = document.getElementById('reset-btn');

    this.settingsForm = document.getElementById('settings-form');
    this.inputHours = document.getElementById('input-hours');
    this.inputMinutes = document.getElementById('input-minutes');
    this.inputSeconds = document.getElementById('input-seconds');
    this.inputSound = document.getElementById('input-sound');
  }

  initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');

    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetId = e.target.getAttribute('data-target');

        navButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        views.forEach(v => {
          v.classList.remove('active');
          if (v.id === targetId) {
            v.classList.add('active');
          }
        });
      });
    });
  }

  initEventListeners() {
    this.startBtn.addEventListener('click', () => {
      this.timerHook.start();
      this.updateControlStates();
    });

    this.pauseBtn.addEventListener('click', () => {
      this.timerHook.pause();
      this.updateControlStates();
    });

    this.resetBtn.addEventListener('click', () => {
      this.timerHook.reset();
      this.updateControlStates();
    });

    this.settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const newSettings = {
        hours: parseInt(this.inputHours.value, 10) || 0,
        minutes: parseInt(this.inputMinutes.value, 10) || 0,
        seconds: parseInt(this.inputSeconds.value, 10) || 0,
        soundEnabled: this.inputSound.checked
      };

      this.settingsHook.saveSettings(newSettings);
      const totalSeconds = this.settingsHook.convertToSeconds(newSettings);
      
      this.timerHook.setDurationFromSeconds(totalSeconds);
      this.updateControlStates();

      // Switch back to timer view
      document.querySelector('[data-target="timer-view"]').click();
      this.notificationHook.notify('Settings saved successfully!', false);
    });
  }

  populateSettingsForm(settings) {
    this.inputHours.value = settings.hours;
    this.inputMinutes.value = settings.minutes;
    this.inputSeconds.value = settings.seconds;
    this.inputSound.checked = settings.soundEnabled;
  }

  handleTick() {
    this.updateDisplay();
  }

  handleComplete() {
    this.updateControlStates();
    const settings = this.settingsHook.getSettings();
    this.notificationHook.notify('Countdown Complete!', settings.soundEnabled);
  }

  updateDisplay() {
    const time = this.timerHook.getTime();
    this.hoursEl.textContent = String(time.hours).padStart(2, '0');
    this.minutesEl.textContent = String(time.minutes).padStart(2, '0');
    this.secondsEl.textContent = String(time.seconds).padStart(2, '0');
  }

  updateControlStates() {
    const isRunning = this.timerHook.isRunning();
    if (isRunning) {
      this.startBtn.disabled = true;
      this.pauseBtn.disabled = false;
      this.inputHours.disabled = true;
      this.inputMinutes.disabled = true;
      this.inputSeconds.disabled = true;
    } else {
      this.startBtn.disabled = false;
      this.pauseBtn.disabled = true;
      this.inputHours.disabled = false;
      this.inputMinutes.disabled = false;
      this.inputSeconds.disabled = false;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AppController();
});