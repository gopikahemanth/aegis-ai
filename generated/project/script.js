/**
 * ChronoPulse - Production Ready Countdown Timer
 */

class AudioService {
  constructor() {
    this.audioCtx = null;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playAlarm(type = 'chime') {
    this.init();
    if (!this.audioCtx) return;

    try {
      if (type === 'beep') {
        this.playBeepSequence();
      } else if (type === 'bell') {
        this.playBellSequence();
      } else {
        this.playChimeSequence();
      }
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  }

  playChimeSequence() {
    const now = this.audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.15);
      
      gain.gain.setValueAtTime(0, now + index * 0.15);
      gain.gain.linearRampToValueAtTime(0.3, now + index * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.15 + 0.6);
      
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      
      osc.start(now + index * 0.15);
      osc.stop(now + index * 0.15 + 0.7);
    });
  }

  playBeepSequence() {
    const now = this.audioCtx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now + i * 0.2);
      
      gain.gain.setValueAtTime(0.15, now + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.15);
      
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.18);
    }
  }

  playBellSequence() {
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
    
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 2.1);
  }
}

class StorageService {
  constructor() {
    this.storageKey = 'chronopulse_settings_v1';
    this.presetsKey = 'chronopulse_presets_v1';
  }

  getSettings() {
    const defaultSettings = {
      soundEnabled: true,
      soundType: 'chime',
      notificationsEnabled: false,
      titleTimerEnabled: true,
      theme: 'dark'
    };
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch (e) {
      return defaultSettings;
    }
  }

  saveSettings(settings) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save settings", e);
    }
  }

  getPresets() {
    const defaultPresets = [
      { id: 'p1', name: 'Focus Session', duration: 1500, category: 'work' },
      { id: 'p2', name: 'Short Break', duration: 300, category: 'break' },
      { id: 'p3', name: 'Long Break', duration: 900, category: 'break' },
      { id: 'p4', name: 'HIIT Interval', duration: 45, category: 'fitness' },
      { id: 'p5', name: 'Quick Nap', duration: 600, category: 'work' }
    ];
    try {
      const stored = localStorage.getItem(this.presetsKey);
      return stored ? JSON.parse(stored) : defaultPresets;
    } catch (e) {
      return defaultPresets;
    }
  }

  savePresets(presets) {
    try {
      localStorage.setItem(this.presetsKey, JSON.stringify(presets));
    } catch (e) {
      console.error("Failed to save presets", e);
    }
  }
}

class TimerApp {
  constructor() {
    this.storage = new StorageService();
    this.audio = new AudioService();
    
    this.settings = this.storage.getSettings();
    this.presets = this.storage.getPresets();
    
    this.totalDuration = 300; // 5 minutes default
    this.remainingTime = 300;
    this.timerLabel = 'Focus Session';
    this.isRunning = false;
    this.timerInterval = null;
    this.activeCategory = 'all';

    this.initDOM();
    this.initListeners();
    this.applyTheme();
    this.renderPresets();
    this.updateDisplay();
  }

  initDOM() {
    this.timeText = document.getElementById('timeText');
    this.timerLabelDisplay = document.getElementById('timerLabelDisplay');
    this.progressRing = document.getElementById('progressRing');
    this.startPauseBtn = document.getElementById('startPauseBtn');
    this.startPauseIcon = document.getElementById('startPauseIcon');
    this.startPauseText = document.getElementById('startPauseText');
    this.resetBtn = document.getElementById('resetBtn');
    this.addTimeBtn = document.getElementById('addTimeBtn');
    
    this.timerDisplayView = document.getElementById('timerDisplayView');
    this.timerEditView = document.getElementById('timerEditView');
    this.editHours = document.getElementById('editHours');
    this.editMinutes = document.getElementById('editMinutes');
    this.editSeconds = document.getElementById('editSeconds');
    this.editLabel = document.getElementById('editLabel');
    this.saveEditBtn = document.getElementById('saveEditBtn');
    this.cancelEditBtn = document.getElementById('cancelEditBtn');

    this.presetContainer = document.getElementById('presetContainer');
    this.presetCategoryTabs = document.getElementById('presetCategoryTabs');
    this.saveAsPresetBtn = document.getElementById('saveAsPresetBtn');

    this.themeToggleBtn = document.getElementById('themeToggleBtn');
    this.themeIcon = document.getElementById('themeIcon');
    
    this.settingsBtn = document.getElementById('settingsBtn');
    this.settingsModal = document.getElementById('settingsModal');
    this.settingsModalContent = document.getElementById('settingsModalContent');
    this.closeSettingsModal = document.getElementById('closeSettingsModal');
    this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
    this.settingSoundToggle = document.getElementById('settingSoundToggle');
    this.settingSoundType = document.getElementById('settingSoundType');
    this.settingNotifToggle = document.getElementById('settingNotifToggle');
    this.settingTitleToggle = document.getElementById('settingTitleToggle');

    this.notificationBanner = document.getElementById('notificationBanner');
    this.notificationTitle = document.getElementById('notificationTitle');
    this.notificationMessage = document.getElementById('notificationMessage');
    this.dismissNotification = document.getElementById('dismissNotification');
  }

  initListeners() {
    this.startPauseBtn.addEventListener('click', () => this.toggleStartPause());
    this.resetBtn.addEventListener('click', () => this.resetTimer());
    this.addTimeBtn.addEventListener('click', () => this.addOneMinute());

    this.timerDisplayView.addEventListener('click', () => this.openEditView());
    this.saveEditBtn.addEventListener('click', () => this.saveInlineEdit());
    this.cancelEditBtn.addEventListener('click', () => this.closeEditView());

    this.saveAsPresetBtn.addEventListener('click', () => this.saveCurrentAsPreset());

    this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

    this.settingsBtn.addEventListener('click', () => this.openSettingsModal());
    this.closeSettingsModal.addEventListener('click', () => this.closeSettings());
    this.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) this.closeSettings();
    });
    this.saveSettingsBtn.addEventListener('click', () => this.saveSettingsFromModal());

    this.dismissNotification.addEventListener('click', () => this.hideNotification());

    // Category filter tabs
    this.presetCategoryTabs.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.presetCategoryTabs.querySelectorAll('button').forEach(b => {
          b.className = "text-xs px-2.5 py-1 rounded-lg text-slate-400 hover:text-white transition-all";
        });
        e.target.className = "text-xs px-2.5 py-1 rounded-lg bg-indigo-600 text-white transition-all";
        this.activeCategory = e.target.dataset.category;
        this.renderPresets();
      });
    });

    // Request notification permission if toggled
    this.settingNotifToggle.addEventListener('change', (e) => {
      if (e.target.checked && "Notification" in window) {
        Notification.requestPermission().then(permission => {
          if (permission !== 'granted') {
            e.target.checked = false;
          }
        });
      }
    });
  }

  toggleStartPause() {
    this.audio.init();
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  startTimer() {
    if (this.remainingTime <= 0) return;
    this.isRunning = true;
    this.updateControlsUI();
    
    let lastTime = performance.now();
    
    this.timerInterval = setInterval(() => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      
      this.remainingTime -= delta;
      
      if (this.remainingTime <= 0) {
        this.remainingTime = 0;
        this.completeTimer();
      }
      this.updateDisplay();
    }, 100);
  }

  pauseTimer() {
    this.isRunning = false;
    clearInterval(this.timerInterval);
    this.updateControlsUI();
    this.updateDocumentTitle(true);
  }

  resetTimer() {
    this.pauseTimer();
    this.remainingTime = this.totalDuration;
    this.updateDisplay();
    this.hideNotification();
  }

  addOneMinute() {
    this.totalDuration += 60;
    this.remainingTime += 60;
    this.updateDisplay();
  }

  completeTimer() {
    this.pauseTimer();
    this.remainingTime = 0;
    this.updateDisplay();

    if (this.settings.soundEnabled) {
      this.audio.playAlarm(this.settings.soundType);
    }

    if (this.settings.notificationsEnabled && "Notification" in window && Notification.permission === 'granted') {
      new Notification("ChronoPulse Timer Finished", {
        body: `Your timer "${this.timerLabel}" has completed.`,
        icon: "favicon.ico"
      });
    }

    this.showNotification("Timer Completed!", `"${this.timerLabel}" has finished.`);
  }

  setTimerDuration(duration, label) {
    this.pauseTimer();
    this.totalDuration = duration;
    this.remainingTime = duration;
    this.timerLabel = label;
    this.updateDisplay();
    this.hideNotification();
  }

  updateDisplay() {
    const hrs = Math.floor(this.remainingTime / 3600);
    const mins = Math.floor((this.remainingTime % 3600) / 60);
    const secs = Math.floor(this.remainingTime % 60);

    const timeString = `${hrs > 0 ? String(hrs).padStart(2, '0') + ':' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    // If hours is not shown and total duration < 3600, show standard MM:SS or HH:MM:SS format consistently
    const displayStr = this.totalDuration >= 3600 
      ? `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    this.timeText.textContent = displayStr;
    this.timerLabelDisplay.textContent = this.timerLabel;

    // Update Progress Ring
    const circumference = 276.46; // 2 * PI * 44
    const progress = this.totalDuration > 0 ? (this.remainingTime / this.totalDuration) : 0;
    const offset = circumference - (progress * circumference);
    this.progressRing.style.strokeDashoffset = offset;

    this.updateDocumentTitle();
  }

  updateControlsUI() {
    if (this.isRunning) {
      this.startPauseBtn.className = "px-8 py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-xl shadow-amber-600/30 flex items-center space-x-3 transition-all transform active:scale-95";
      this.startPauseText.textContent = "Pause";
      this.startPauseIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>`;
    } else {
      this.startPauseBtn.className = "px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xl shadow-indigo-600/30 flex items-center space-x-3 transition-all transform active:scale-95";
      this.startPauseText.textContent = this.remainingTime < this.totalDuration ? "Resume" : "Start Timer";
      this.startPauseIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>`;
    }
  }

  updateDocumentTitle(forceReset = false) {
    if (!this.settings.titleTimerEnabled || forceReset || !this.isRunning) {
      document.title = "ChronoPulse - Precision Countdown Timer";
      return;
    }
    const mins = Math.floor(this.remainingTime / 60);
    const secs = Math.floor(this.remainingTime % 60);
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    document.title = `(${timeStr}) ChronoPulse`;
  }

  openEditView() {
    if (this.isRunning) return;
    const hrs = Math.floor(this.totalDuration / 3600);
    const mins = Math.floor((this.totalDuration % 3600) / 60);
    const secs = Math.floor(this.totalDuration % 60);

    this.editHours.value = hrs;
    this.editMinutes.value = mins;
    this.editSeconds.value = secs;
    this.editLabel.value = this.timerLabel;

    this.timerDisplayView.classList.add('hidden');
    this.timerEditView.classList.remove('hidden');
  }

  closeEditView() {
    this.timerEditView.classList.add('hidden');
    this.timerDisplayView.classList.remove('hidden');
  }

  saveInlineEdit() {
    const hrs = parseInt(this.editHours.value) || 0;
    const mins = parseInt(this.editMinutes.value) || 0;
    const secs = parseInt(this.editSeconds.value) || 0;
    const label = this.editLabel.value.trim() || 'Custom Timer';

    const newDuration = (hrs * 3600) + (mins * 60) + secs;
    if (newDuration > 0) {
      this.totalDuration = newDuration;
      this.remainingTime = newDuration;
      this.timerLabel = label;
      this.updateDisplay();
    }
    this.closeEditView();
  }

  renderPresets() {
    this.presetContainer.innerHTML = '';
    const filtered = this.activeCategory === 'all' 
      ? this.presets 
      : this.presets.filter(p => p.category === this.activeCategory);

    filtered.forEach(preset => {
      const btn = document.createElement('button');
      btn.className = "flex-shrink-0 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/50 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center space-x-2 shadow-sm";
      
      const mins = Math.floor(preset.duration / 60);
      btn.innerHTML = `
        <span>${preset.name}</span>
        <span class="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-700 text-slate-400 font-mono">${mins}m</span>
      `;
      btn.addEventListener('click', () => this.setTimerDuration(preset.duration, preset.name));
      this.presetContainer.appendChild(btn);
    });
  }

  saveCurrentAsPreset() {
    const name = prompt("Enter a name for this preset:", this.timerLabel);
    if (!name) return;

    const newPreset = {
      id: 'p_' + Date.now(),
      name: name,
      duration: this.totalDuration,
      category: 'work'
    };

    this.presets.push(newPreset);
    this.storage.savePresets(this.presets);
    this.renderPresets();
    this.showNotification("Preset Saved", `"${name}" added to your quick presets.`);
  }

  toggleTheme() {
    this.settings.theme = this.settings.theme === 'dark' ? 'light' : 'dark';
    this.storage.saveSettings(this.settings);
    this.applyTheme();
  }

  applyTheme() {
    if (this.settings.theme === 'light') {
      document.body.classList.add('light');
      this.themeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>`;
    } else {
      document.body.classList.remove('light');
      this.themeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>`;
    }
  }

  openSettingsModal() {
    this.settingSoundToggle.checked = this.settings.soundEnabled;
    this.settingSoundType.value = this.settings.soundType;
    this.settingNotifToggle.checked = this.settings.notificationsEnabled;
    this.settingTitleToggle.checked = this.settings.titleTimerEnabled;

    this.settingsModal.classList.remove('opacity-0', 'pointer-events-none');
    this.settingsModalContent.classList.remove('scale-95');
    this.settingsModalContent.classList.add('scale-100');
  }

  closeSettings() {
    this.settingsModal.classList.add('opacity-0', 'pointer-events-none');
    this.settingsModalContent.classList.remove('scale-100');
    this.settingsModalContent.classList.add('scale-95');
  }

  saveSettingsFromModal() {
    this.settings.soundEnabled = this.settingSoundToggle.checked;
    this.settings.soundType = this.settingSoundType.value;
    this.settings.notificationsEnabled = this.settingNotifToggle.checked;
    this.settings.titleTimerEnabled = this.settingTitleToggle.checked;

    this.storage.saveSettings(this.settings);
    this.closeSettings();
    this.showNotification("Settings Saved", "Your preferences have been updated.");
  }

  showNotification(title, message) {
    this.notificationTitle.textContent = title;
    this.notificationMessage.textContent = message;
    this.notificationBanner.classList.remove('opacity-0', '-translate-y-4', 'pointer-events-none');
  }

  hideNotification() {
    this.notificationBanner.classList.add('opacity-0', '-translate-y-4', 'pointer-events-none');
  }
}

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.timerApp = new TimerApp();
});