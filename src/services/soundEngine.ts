/**
 * Sound & Audio Synthesis Engine
 * Provides haptic clicks for the rotary turn wheel, soothing ambient sleep sounds,
 * and graceful volume fade-out before timer completion.
 */

class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientSourceNodes: AudioNode[] = [];
  private currentAmbientId: string | null = null;
  private isAudioFading = false;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Generates a crisp, subtle tactile tick when rotating the dial wheel
   */
  public playTick(pitchMultiplier = 1.0) {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Sharp, subtle click sound
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 * pitchMultiplier, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.015);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.Q.setValueAtTime(2.5, ctx.currentTime);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.025);
    } catch {
      // AudioContext might be blocked until first touch
    }

    // Also trigger light haptic vibration if supported
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Play completion/sleep chime
   */
  public playCompletionTone() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const notes = [440, 392, 329.63, 261.63]; // A4, G4, E4, C4 peaceful descent

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.18);

        gain.gain.setValueAtTime(0, now + idx * 0.18);
        gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.18 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.18 + 0.7);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.18);
        osc.stop(now + idx * 0.18 + 0.75);
      });
    } catch {
      // ignore
    }

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([40, 80, 40]);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Starts synthesizing soothing ambient sleep audio (Rain, Brown noise, Waves, Night Drone)
   */
  public playAmbient(id: string, initialVolume = 0.5) {
    this.stopAmbient();
    const ctx = this.getContext();
    this.currentAmbientId = id;
    this.isAudioFading = false;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(initialVolume, ctx.currentTime);
    masterGain.connect(ctx.destination);
    this.ambientGain = masterGain;

    if (id === 'rain') {
      // Synthesize rain using filtered noise + crackles
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(900, ctx.currentTime);
      bandpass.Q.setValueAtTime(0.8, ctx.currentTime);

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(3200, ctx.currentTime);

      whiteNoise.connect(bandpass);
      bandpass.connect(lowpass);
      lowpass.connect(masterGain);

      whiteNoise.start();
      this.ambientSourceNodes.push(whiteNoise);
    } else if (id === 'brown_noise') {
      // Brown noise (deep relaxing rumble)
      const bufferSize = ctx.sampleRate * 3;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Gain compensation
      }

      const brownSource = ctx.createBufferSource();
      brownSource.buffer = noiseBuffer;
      brownSource.loop = true;

      const lowFilter = ctx.createBiquadFilter();
      lowFilter.type = 'lowpass';
      lowFilter.frequency.setValueAtTime(450, ctx.currentTime);

      brownSource.connect(lowFilter);
      lowFilter.connect(masterGain);

      brownSource.start();
      this.ambientSourceNodes.push(brownSource);
    } else if (id === 'waves') {
      // Ocean wave simulator: brown noise with slow LFO gain modulation
      const bufferSize = ctx.sampleRate * 4;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.0;
      }

      const waveSource = ctx.createBufferSource();
      waveSource.buffer = noiseBuffer;
      waveSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, ctx.currentTime);

      // LFO for surf swell
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8.3 second cycle

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.3, ctx.currentTime);

      const waveGain = ctx.createGain();
      waveGain.gain.setValueAtTime(0.5, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(waveGain.gain);

      waveSource.connect(filter);
      filter.connect(waveGain);
      waveGain.connect(masterGain);

      lfo.start();
      waveSource.start();
      this.ambientSourceNodes.push(waveSource, lfo);
    } else if (id === 'drone') {
      // Deep 432Hz harmonic sleep drone
      const baseFreq = 108; // 432 / 4
      [baseFreq, baseFreq * 1.5, baseFreq * 2, 216].forEach((freq) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        oscGain.gain.setValueAtTime(0.08, ctx.currentTime);

        osc.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start();
        this.ambientSourceNodes.push(osc);
      });
    }

    // Set MediaSession metadata so Android lock screen and notification show active player
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `Suara Tidur: ${id.replace('_', ' ').toUpperCase()}`,
        artist: 'Somno Sleep Timer',
        album: 'Android 15 Night Soundscape',
      });
      navigator.mediaSession.playbackState = 'playing';
      navigator.mediaSession.setActionHandler('pause', () => this.stopAmbient());
    }
  }

  public setVolume(vol: number) {
    if (this.ambientGain && this.audioCtx && !this.isAudioFading) {
      const clamped = Math.max(0, Math.min(1, vol));
      this.ambientGain.gain.setValueAtTime(clamped, this.audioCtx.currentTime);
    }
  }

  /**
   * Smoothly fades out ambient audio over durationSeconds down to 0
   */
  public fadeAudioOut(fadeSeconds = 30): Promise<void> {
    return new Promise((resolve) => {
      if (!this.ambientGain || !this.audioCtx) {
        resolve();
        return;
      }
      this.isAudioFading = true;
      const ctx = this.audioCtx;
      const currentVal = Math.max(0.001, this.ambientGain.gain.value);
      this.ambientGain.gain.setValueAtTime(currentVal, ctx.currentTime);
      this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + Math.max(1, fadeSeconds));

      setTimeout(() => {
        this.stopAmbient();
        this.isAudioFading = false;
        resolve();
      }, Math.max(1000, fadeSeconds * 1000));
    });
  }

  public stopAmbient() {
    this.ambientSourceNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
        node.disconnect();
      } catch {
        // ignore
      }
    });
    this.ambientSourceNodes = [];
    if (this.ambientGain) {
      try {
        this.ambientGain.disconnect();
      } catch {
        // ignore
      }
      this.ambientGain = null;
    }
    this.currentAmbientId = null;

    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
    }
  }

  public getCurrentAmbientId(): string | null {
    return this.currentAmbientId;
  }
}

export const soundEngine = new SoundEngine();
