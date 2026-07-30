export class TimerService {
    constructor() {
        this.totalSeconds = 300;
        this.remainingSeconds = 300;
        this.isRunning = false;
        this.timerId = null;
        this.listeners = [];
    }

    setDuration(hours, minutes, seconds) {
        this.totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
        this.remainingSeconds = this.totalSeconds;
        this.notifyListeners();
    }

    addSeconds(seconds) {
        this.remainingSeconds += seconds;
        if (this.remainingSeconds < 0) this.remainingSeconds = 0;
        this.totalSeconds = Math.max(this.totalSeconds, this.remainingSeconds);
        this.notifyListeners();
    }

    start() {
        if (this.isRunning || this.remainingSeconds <= 0) return;
        this.isRunning = true;
        this.timerId = setInterval(() => {
            if (this.remainingSeconds > 0) {
                this.remainingSeconds--;
                this.notifyListeners();
            }
            if (this.remainingSeconds <= 0) {
                this.pause();
                this.notifyComplete();
            }
        }, 1000);
        this.notifyListeners();
    }

    pause() {
        if (!this.isRunning) return;
        this.isRunning = false;
        clearInterval(this.timerId);
        this.timerId = null;
        this.notifyListeners();
    }

    reset() {
        this.pause();
        this.remainingSeconds = this.totalSeconds;
        this.notifyListeners();
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notifyListeners() {
        const state = {
            totalSeconds: this.totalSeconds,
            remainingSeconds: this.remainingSeconds,
            isRunning: this.isRunning,
            hours: Math.floor(this.remainingSeconds / 3600),
            minutes: Math.floor((this.remainingSeconds % 3600) / 60),
            seconds: this.remainingSeconds % 60,
            progress: this.totalSeconds > 0 ? this.remainingSeconds / this.totalSeconds : 0
        };
        this.listeners.forEach(cb => cb(state));
    }

    notifyComplete() {
        this.listeners.forEach(cb => {
            if (cb.onComplete) cb.onComplete();
        });
    }

    playAlarm(soundType) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = soundType === 'digital' ? 'square' : soundType === 'chime' ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(soundType === 'digital' ? 880 : 440, ctx.currentTime);

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 1.5);
        } catch (e) {
            console.error('AudioContext not supported or blocked', e);
        }
    }
}