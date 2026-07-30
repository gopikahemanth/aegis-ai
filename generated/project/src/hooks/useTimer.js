import { TimerService } from '../services/TimerService.js';

export class useTimer {
  constructor(onTickCallback, onCompleteCallback) {
    this.timerService = new TimerService(300, onTickCallback, onCompleteCallback);
  }

  setDurationFromSeconds(seconds) {
    this.timerService.setDuration(seconds);
  }

  start() {
    this.timerService.start();
  }

  pause() {
    this.timerService.pause();
  }

  reset() {
    this.timerService.reset();
  }

  getTime() {
    return this.timerService.getRemainingTime();
  }

  isRunning() {
    return this.timerService.isRunning;
  }
}