class AudioManager {
  private muted: boolean = true;
  private audioCtx: AudioContext | null = null;

  private initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (!this.muted) {
      this.initContext();
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      this.playBeep(440, 0.1);
    }
    return !this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public playTransformSound(delta: number) {
    if (this.muted) return;
    this.initContext();
    if (!this.audioCtx) return;

    const freq = 120 + Math.abs(delta) * 1000;
    this.playBeep(freq, 0.05);
  }

  private playBeep(freq: number, duration: number) {
    if (this.muted || !this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // AudioContext policy restrictions handled gracefully
    }
  }
}

export const audioManager = new AudioManager();