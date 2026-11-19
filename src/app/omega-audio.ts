/**
 * OMEGA PROTOCOL — Procedural WebAudio Synth & Rain Ambience Engine.
 * Lazy-initializes on first user interaction and safely no-ops in headless/SSR environments.
 */

import type { OmegaAudioCueKind } from '../domain/omega-protocol';

export class OmegaAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted = false;
  private pulseTimer: ReturnType<typeof setInterval> | null = null;
  private pulseStep = 0;
  private combatActive = false;
  private bossMode = false;
  private slowMo = false;

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.72, this.ctx.currentTime, 0.04);
    }
  }

  setSceneState(opts: { combatActive: boolean; bossMode: boolean; slowMo: boolean }): void {
    this.combatActive = opts.combatActive;
    this.bossMode = opts.bossMode;
    this.slowMo = opts.slowMo;
    if (this.rainFilter && this.ctx) {
      const targetFreq = opts.slowMo ? 680 : opts.combatActive ? 1400 : 1050;
      this.rainFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.12);
    }
    if (this.rainGain && this.ctx) {
      const targetGain = opts.combatActive ? 0.095 : 0.055;
      this.rainGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.25);
    }
  }

  unlock(): void {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!this.ctx) {
      try {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : 0.72;
        this.masterGain.connect(this.ctx.destination);
        this.initNoiseAndRain();
        this.startSynthPulse();
      } catch {
        this.ctx = null;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
  }

  private initNoiseAndRain(): void {
    const ctx = this.ctx;
    const master = this.masterGain;
    if (!ctx || !master) return;

    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.04 * white) / 1.04;
      lastOut = data[i]!;
      data[i]! *= 2.4;
    }
    this.noiseBuffer = buffer;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1100;
    filter.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.value = 0.055;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start();

    this.rainFilter = filter;
    this.rainGain = gain;
  }

  private startSynthPulse(): void {
    if (this.pulseTimer) return;
    const bassNotes = [55, 55, 65.41, 55, 73.42, 65.41, 61.74, 55]; // A1 dark industrial cyber progression
    const bossNotes = [55, 82.41, 55, 92.5, 65.41, 98.0, 58.27, 110];
    this.pulseTimer = setInterval(() => {
      if (!this.ctx || !this.masterGain || this.muted || !this.combatActive || this.ctx.state !== 'running') {
        return;
      }
      const seq = this.bossMode ? bossNotes : bassNotes;
      const freq = seq[this.pulseStep % seq.length]!;
      this.pulseStep += 1;
      const pitchShift = this.slowMo ? 0.68 : 1;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();
      osc.type = this.bossMode ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq * pitchShift, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(this.bossMode ? 480 : 280, now);
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(this.bossMode ? 0.08 : 0.055, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.21);
      osc.connect(filter);
      filter.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.22);
    }, 230);
  }

  playCue(kind: OmegaAudioCueKind, pan = 0): void {
    if (this.muted || !this.ctx || !this.masterGain || this.ctx.state !== 'running') return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const output = this.connectPan(pan);

    switch (kind) {
      case 'pulse':
        this.playTone(output, 'sawtooth', 760, 140, 0.09, 0.14, now);
        this.playNoise(output, 1800, 0.05, 0.09, now);
        break;
      case 'scatter':
        this.playTone(output, 'square', 280, 58, 0.16, 0.22, now);
        this.playNoise(output, 950, 0.16, 0.24, now);
        break;
      case 'rail':
        this.playTone(output, 'sawtooth', 1420, 95, 0.28, 0.24, now);
        this.playTone(output, 'sine', 160, 42, 0.3, 0.22, now);
        this.playNoise(output, 2200, 0.18, 0.16, now);
        break;
      case 'hit':
        this.playTone(output, 'triangle', 420, 180, 0.055, 0.09, now);
        break;
      case 'weakpoint':
        this.playTone(output, 'sine', 980, 1520, 0.09, 0.14, now);
        this.playTone(output, 'triangle', 620, 260, 0.07, 0.12, now);
        break;
      case 'ricochet':
        this.playTone(output, 'sine', 1680, 920, 0.08, 0.11, now);
        break;
      case 'barrier_hit':
        this.playTone(output, 'triangle', 140, 62, 0.08, 0.16, now);
        this.playNoise(output, 650, 0.06, 0.11, now);
        break;
      case 'barrier_break':
        this.playTone(output, 'sawtooth', 120, 36, 0.28, 0.25, now);
        this.playNoise(output, 480, 0.26, 0.24, now);
        break;
      case 'sniper_lock':
        this.playTone(output, 'sine', 840, 1260, 0.12, 0.1, now);
        break;
      case 'sniper_fire':
        this.playTone(output, 'sawtooth', 980, 140, 0.18, 0.2, now);
        break;
      case 'counter_break':
        this.playTone(output, 'sine', 740, 1480, 0.16, 0.2, now);
        this.playTone(output, 'sine', 1110, 1860, 0.18, 0.16, now + 0.05);
        break;
      case 'rocket_launch':
        this.playTone(output, 'sawtooth', 190, 410, 0.22, 0.11, now);
        break;
      case 'intercept':
        this.playTone(output, 'sine', 1180, 640, 0.12, 0.16, now);
        this.playNoise(output, 1400, 0.1, 0.13, now);
        break;
      case 'explosion':
        this.playTone(output, 'sawtooth', 135, 34, 0.36, 0.28, now);
        this.playNoise(output, 420, 0.35, 0.28, now);
        break;
      case 'emp':
        this.playTone(output, 'sawtooth', 1100, 180, 0.25, 0.18, now);
        this.playTone(output, 'square', 520, 1280, 0.22, 0.12, now + 0.04);
        break;
      case 'supply':
        this.playTone(output, 'sine', 523.25, 523.25, 0.12, 0.14, now);
        this.playTone(output, 'sine', 659.25, 659.25, 0.12, 0.14, now + 0.07);
        this.playTone(output, 'sine', 783.99, 1046.5, 0.18, 0.15, now + 0.14);
        break;
      case 'dash':
        this.playNoise(output, 1600, 0.14, 0.15, now);
        this.playTone(output, 'sine', 340, 150, 0.11, 0.11, now);
        break;
      case 'perfect_evade':
        this.playTone(output, 'sine', 260, 62, 0.38, 0.26, now);
        this.playTone(output, 'sine', 1046, 1568, 0.24, 0.18, now + 0.03);
        break;
      case 'reload_start':
        this.playTone(output, 'square', 380, 520, 0.045, 0.09, now);
        break;
      case 'reload_perfect':
        this.playTone(output, 'sine', 880, 1320, 0.11, 0.16, now);
        this.playTone(output, 'triangle', 1320, 1760, 0.14, 0.15, now + 0.06);
        break;
      case 'overdrive':
        this.playTone(output, 'sawtooth', 110, 440, 0.52, 0.24, now);
        this.playTone(output, 'sine', 880, 1760, 0.42, 0.2, now + 0.12);
        break;
      case 'boss_warn':
        this.playTone(output, 'sawtooth', 440, 390, 0.24, 0.16, now);
        this.playTone(output, 'sawtooth', 440, 390, 0.28, 0.16, now + 0.3);
        break;
      case 'player_hit':
        this.playTone(output, 'sawtooth', 165, 52, 0.2, 0.26, now);
        this.playNoise(output, 620, 0.14, 0.22, now);
        break;
      case 'sector_clear':
      case 'victory':
        this.playTone(output, 'triangle', 523.25, 523.25, 0.18, 0.16, now);
        this.playTone(output, 'triangle', 659.25, 659.25, 0.18, 0.16, now + 0.11);
        this.playTone(output, 'triangle', 783.99, 783.99, 0.22, 0.18, now + 0.22);
        this.playTone(output, 'sine', 1046.5, 1046.5, 0.42, 0.2, now + 0.34);
        break;
      case 'defeat':
        this.playTone(output, 'sawtooth', 260, 95, 0.45, 0.2, now);
        this.playTone(output, 'sine', 160, 58, 0.55, 0.22, now + 0.18);
        break;
    }
  }

  private connectPan(pan: number): AudioNode {
    const ctx = this.ctx!;
    const master = this.masterGain!;
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.value = Math.max(-0.9, Math.min(0.9, pan));
      panner.connect(master);
      return panner;
    }
    return master;
  }

  private playTone(
    dest: AudioNode,
    type: OscillatorType,
    startFreq: number,
    endFreq: number,
    duration: number,
    volume: number,
    startTime: number,
  ): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(24, startFreq), startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(24, endFreq), startTime + duration);
    g.gain.setValueAtTime(volume, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(g);
    g.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  private playNoise(
    dest: AudioNode,
    cutoff: number,
    duration: number,
    volume: number,
    startTime: number,
  ): void {
    if (!this.noiseBuffer || !this.ctx) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, startTime);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(volume, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(dest);
    src.start(startTime);
    src.stop(startTime + duration + 0.01);
  }

  dispose(): void {
    if (this.pulseTimer) {
      clearInterval(this.pulseTimer);
      this.pulseTimer = null;
    }
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.masterGain = null;
    this.rainGain = null;
    this.rainFilter = null;
    this.noiseBuffer = null;
  }
}
