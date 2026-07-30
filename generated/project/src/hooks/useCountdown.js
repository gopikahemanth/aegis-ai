import { CountdownService } from '../services/CountdownService.js';

export class useCountdown {
  constructor(initialSeconds = 300) {
    this.countdownService = new CountdownService();
    this.totalSeconds = initialSeconds;
    this.remainingSeconds = initialSeconds;
    this.isRunning = false;
    this.timerId = null;
    this.listeners = [];
  }

  start() {
    if (this.isRunning || this.remainingSeconds <= 0) return;
    this.isRunning = true;
    this.notifyListeners();

    this.timerId = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds -= 1;
        this.notifyListeners();
      }

      if (this.remainingSeconds <= 0) {
        this.stop();
        this.countdownService.playAlarm();
        this.onCompleteCallback && this.onCompleteCallback();
      }
    }, 1000);
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.notifyListeners();
  }

  reset(newSeconds = null) {
    this.pause();
    if (newSeconds !== null) {
      this.totalSeconds = newSeconds;
    }
    this.remainingSeconds = this.totalSeconds;
    this.notifyListeners();
  }

  setOnComplete(callback) {
    this.onCompleteCallback = callback;
  }

  getState() {
    return {
      ...this.countdownService.formatTime(this.remainingSeconds),
      remainingSeconds: this.remainingSeconds,
      isRunning: this.isRunning,
      isFinished: this.remainingSeconds === 0
    };
  }

  subscribe(listener) {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }
}