export class CountdownForm {
  constructor(containerElement, countdownHook) {
    this.container = containerElement;
    this.countdown = countdownHook;
    this.unsubscribe = null;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="countdown-form">
        <div class="input-group" id="form-inputs">
          <div class="input-field">
            <label for="input-hours">Hours</label>
            <input type="number" id="input-hours" min="0" max="99" value="0">
          </div>
          <div class="input-field">
            <label for="input-minutes">Minutes</label>
            <input type="number" id="input-minutes" min="0" max="59" value="5">
          </div>
          <div class="input-field">
            <label for="input-seconds">Seconds</label>
            <input type="number" id="input-seconds" min="0" max="59" value="0">
          </div>
        </div>
        <div class="btn-group">
          <button id="btn-start" class="btn btn-primary">Start</button>
          <button id="btn-pause" class="btn btn-secondary" style="display: none;">Pause</button>
          <button id="btn-reset" class="btn btn-danger">Reset</button>
        </div>
      </div>
    `;

    this.inputsContainer = this.container.querySelector('#form-inputs');
    this.hoursInput = this.container.querySelector('#input-hours');
    this.minutesInput = this.container.querySelector('#input-minutes');
    this.secondsInput = this.container.querySelector('#input-seconds');
    this.startBtn = this.container.querySelector('#btn-start');
    this.pauseBtn = this.container.querySelector('#btn-pause');
    this.resetBtn = this.container.querySelector('#btn-reset');

    this.bindEvents();
    this.unsubscribe = this.countdown.subscribe(state => this.updateState(state));
  }

  bindEvents() {
    this.startBtn.addEventListener('click', () => {
      const state = this.countdown.getState();
      if (state.remainingSeconds === 0 || state.hours !== '00' || state.minutes !== '05' || state.seconds !== '00') {
        const h = parseInt(this.hoursInput.value) || 0;
        const m = parseInt(this.minutesInput.value) || 0;
        const s = parseInt(this.secondsInput.value) || 0;
        const totalSecs = (h * 3600) + (m * 60) + s;
        if (totalSecs > 0) {
          this.countdown.reset(totalSecs);
        }
      }
      this.countdown.start();
    });

    this.pauseBtn.addEventListener('click', () => {
      this.countdown.pause();
    });

    this.resetBtn.addEventListener('click', () => {
      const h = parseInt(this.hoursInput.value) || 0;
      const m = parseInt(this.minutesInput.value) || 0;
      const s = parseInt(this.secondsInput.value) || 0;
      const totalSecs = (h * 3600) + (m * 60) + s;
      this.countdown.reset(totalSecs > 0 ? totalSecs : 300);
    });
  }

  updateState(state) {
    if (state.isRunning) {
      this.startBtn.style.display = 'none';
      this.pauseBtn.style.display = 'block';
      this.inputsContainer.style.opacity = '0.5';
      this.inputsContainer.style.pointerEvents = 'none';
    } else {
      this.startBtn.style.display = 'block';
      this.pauseBtn.style.display = 'none';
      this.inputsContainer.style.opacity = '1';
      this.inputsContainer.style.pointerEvents = 'auto';
      this.startBtn.textContent = state.remainingSeconds === 0 ? 'Restart' : 'Start';
    }
  }

  setInitialInputs(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    this.hoursInput.value = h;
    this.minutesInput.value = m;
    this.secondsInput.value = s;
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}