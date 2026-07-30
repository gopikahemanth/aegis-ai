export class TimerDisplay {
  constructor(containerElement, countdownHook) {
    this.container = containerElement;
    this.countdown = countdownHook;
    this.unsubscribe = null;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="timer-display">
        <div class="time-segment">
          <span id="display-hours" class="time-value">00</span>
          <span class="time-label">Hours</span>
        </div>
        <span class="time-separator">:</span>
        <div class="time-segment">
          <span id="display-minutes" class="time-value">00</span>
          <span class="time-label">Minutes</span>
        </div>
        <span class="time-separator">:</span>
        <div class="time-segment">
          <span id="display-seconds" class="time-value">00</span>
          <span class="time-label">Seconds</span>
        </div>
      </div>
    `;

    this.hoursEl = this.container.querySelector('#display-hours');
    this.minutesEl = this.container.querySelector('#display-minutes');
    this.secondsEl = this.container.querySelector('#display-seconds');

    this.unsubscribe = this.countdown.subscribe(state => this.update(state));
  }

  update(state) {
    this.hoursEl.textContent = state.hours;
    this.minutesEl.textContent = state.minutes;
    this.secondsEl.textContent = state.seconds;
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}