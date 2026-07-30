export class TimerService {
  constructor(initialDurationInSeconds = 300, onTick = () => {}, onComplete = () => {}) {
    this.initialDuration = initialDurationInSeconds;
    this.remainingSeconds = initialDurationInSeconds;
    this.onTick = onTick;
    this.onComplete = onComplete;
    this.timerId = null;
    this.isRunning = false;
  }

  setDuration(durationInSeconds) {
    this.initialDuration = durationInSeconds;
    this.remainingSeconds = durationInSeconds;
    this.onTick(this.remainingSeconds);
  }

  start() {
    if (this.isRunning || this.remainingSeconds <= 0) return;
    this.isRunning = true;

    this.timerId = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds -= 1;
        this.onTick(this.remainingSeconds);
      }

      if (this.remainingSeconds <= 0) {
        this.stop();
        this.onComplete();
      }
    }, 1000);
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    clearInterval(this.timerId);
    this.timerId = null;
  }

  reset() {
    this.pause();
    this.remainingSeconds = this.initialDuration;
    this.onTick(this.remainingSeconds);
  }

  getRemainingTime() {
    const hours = Math.floor(this.remainingSeconds / 3600);
    const minutes = Math.floor((this.remainingSeconds % 3600) / 60);
    const seconds = this.remainingSeconds % 60;
    return { hours, minutes, seconds, total: this.remainingSeconds };
  }
}