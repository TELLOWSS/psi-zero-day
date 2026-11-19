import type { OmegaStrikerId, OmegaStyleTier } from '../domain/omega-protocol-zero-signal';

type BgmIntensity = 'calm' | 'battle' | 'boss';

const D_MINOR_BASS = [73.42, 73.42, 87.31, 73.42, 110.0, 98.0, 87.31, 82.41];
const BOSS_ARP = [293.66, 349.23, 440.0, 523.25, 440.0, 349.23, 587.33, 440.0];

/**
 * Pure Web Audio API real-time procedural combat SFX + adaptive cyberpunk synthwave BGM.
 * Safely degrades to zero-allocation no-ops in headless Node/jsdom or before user interaction.
 */
export class OmegaProceduralAudio {
 private ctx: AudioContext | null = null;
 private noiseBuffer: AudioBuffer | null = null;
 private muted = false;
 private bgmTimer: number | null = null;
 private bgmActive = false;
 private bgmIntensity: BgmIntensity = 'battle';
 private bgmStep = 0;
 private lastShotAt = 0;

 isMuted(): boolean {
  return this.muted;
 }

 setMuted(muted: boolean): void {
  this.muted = muted;
  if (muted) {
   this.stopBgmTimer();
  } else if (this.bgmActive) {
   this.startBgmTimer();
  }
 }

 unlock(): boolean {
  if (typeof window === 'undefined') return false;
  const Ctor =
   window.AudioContext ??
   (window as unknown as { readonly webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return false;
  if (!this.ctx) {
   try {
    this.ctx = new Ctor();
    const sr = this.ctx.sampleRate || 44100;
    const len = Math.floor(sr * 0.25);
    const buf = this.ctx.createBuffer(1, len, sr);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
     ch[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buf;
   } catch {
    this.ctx = null;
    return false;
   }
  }
  if (this.ctx.state === 'suspended') {
   void this.ctx.resume().catch(() => {});
  }
  if (this.bgmActive && !this.muted) {
   this.startBgmTimer();
  }
  return true;
 }

 private readyCtx(): AudioContext | null {
  if (this.muted || !this.ctx || this.ctx.state === 'suspended') return null;
  return this.ctx;
 }

 private tone(
  freqStart: number,
  freqEnd: number,
  duration: number,
  type: OscillatorType,
  gainPeak: number,
  delay = 0,
 ): void {
  const ctx = this.readyCtx();
  if (!ctx) return;
  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(20, freqStart), now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(gainPeak, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
 }

 private noiseBurst(filterFreq: number, q: number, duration: number, gainPeak: number, delay = 0): void {
  const ctx = this.readyCtx();
  if (!ctx || !this.noiseBuffer) return;
  const now = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = this.noiseBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(filterFreq, now);
  filter.Q.setValueAtTime(q, now);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainPeak, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(now);
  src.stop(now + duration + 0.01);
 }

 playGunshot(overclocked = false): void {
  const nowMs = Date.now();
  if (nowMs - this.lastShotAt < 55) return;
  this.lastShotAt = nowMs;
  this.tone(overclocked ? 310 : 185, 48, 0.09, 'sawtooth', overclocked ? 0.14 : 0.09);
  this.noiseBurst(overclocked ? 3600 : 2100, 1.8, 0.06, 0.11);
 }

 playBladeSlash(combo: 1 | 2 | 3): void {
  const base = combo === 3 ? 1150 : combo === 2 ? 880 : 720;
  this.noiseBurst(base * 2.1, 2.4, 0.14, 0.16);
  this.tone(base, base * 0.35, 0.15, 'triangle', 0.11);
  if (combo === 3) {
   this.tone(1320, 440, 0.22, 'sine', 0.09, 0.02);
  }
 }

 playDetonation(stacks: number): void {
  const boost = Math.min(1.4, 0.8 + stacks * 0.2);
  this.tone(125, 30, 0.32, 'sawtooth', 0.22 * boost);
  this.noiseBurst(950, 0.8, 0.24, 0.18 * boost);
  this.tone(440 * boost, 880 * boost, 0.18, 'triangle', 0.10, 0.02);
 }

 playPhantomDodge(): void {
  this.tone(440, 78, 0.38, 'sawtooth', 0.18);
  this.tone(1760, 1320, 0.24, 'sine', 0.11, 0.03);
 }

 playStriker(id: OmegaStrikerId): void {
  if (id === 'm01_snipe') {
   this.tone(1800, 180, 0.28, 'sawtooth', 0.20);
   this.noiseBurst(4200, 2.2, 0.18, 0.16);
  } else if (id === 'guard_sentry') {
   this.tone(240, 620, 0.14, 'square', 0.11);
   this.tone(880, 1320, 0.14, 'triangle', 0.10, 0.08);
  } else if (id === 'breaker_emp') {
   this.tone(140, 28, 0.45, 'sawtooth', 0.24);
   this.noiseBurst(1600, 1.1, 0.34, 0.20);
  } else {
   this.tone(330, 440, 0.26, 'sine', 0.13);
   this.tone(495, 660, 0.30, 'triangle', 0.11, 0.05);
  }
 }

 playRankUp(rank: OmegaStyleTier): void {
  const high = rank === 'S' || rank === 'SS' || rank === 'OMEGA';
  const root = high ? 587.33 : 440;
  this.tone(root, root, 0.12, 'triangle', 0.12, 0);
  this.tone(root * 1.25, root * 1.25, 0.12, 'triangle', 0.12, 0.07);
  this.tone(root * 1.5, root * 1.5, 0.20, 'sine', 0.14, 0.14);
 }

 playPickup(): void {
  this.tone(880, 1320, 0.09, 'sine', 0.08);
 }

 playShieldBreak(): void {
  this.tone(620, 130, 0.28, 'sawtooth', 0.15);
  this.noiseBurst(2800, 3.0, 0.14, 0.12);
 }

 playEvoUnlock(): void {
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
   this.tone(freq, freq * 1.02, 0.20, 'triangle', 0.13, i * 0.06);
  });
 }

 setBgmState(active: boolean, intensity: BgmIntensity): void {
  this.bgmActive = active;
  this.bgmIntensity = intensity;
  if (!active || this.muted) {
   this.stopBgmTimer();
   return;
  }
  if (this.ctx && this.ctx.state !== 'suspended') {
   this.startBgmTimer();
  }
 }

 private stopBgmTimer(): void {
  if (this.bgmTimer !== null && typeof window !== 'undefined') {
   window.clearInterval(this.bgmTimer);
   this.bgmTimer = null;
  }
 }

 private startBgmTimer(): void {
  if (typeof window === 'undefined' || this.bgmTimer !== null) return;
  this.bgmTimer = window.setInterval(() => {
   const ctx = this.readyCtx();
   if (!ctx || !this.bgmActive) return;
   const step = this.bgmStep++ % 16;
   const bassHz = D_MINOR_BASS[step % D_MINOR_BASS.length]!;

   // Pulse dark analog synth bass on 8th notes.
   if (step % 2 === 0) {
    this.tone(bassHz, bassHz * 0.98, 0.15, 'sawtooth', this.bgmIntensity === 'calm' ? 0.025 : 0.042);
   }
   // Industrial kick & crisp hat during battle & boss.
   if (this.bgmIntensity !== 'calm') {
    if (step % 4 === 0) {
     this.tone(110, 38, 0.11, 'sine', 0.075);
    }
    if (step % 4 === 2) {
     this.noiseBurst(6400, 3.2, 0.035, 0.026);
    }
   }
   // Dramatic minor arpeggio lead during Boss & high tension.
   if (this.bgmIntensity === 'boss' && step % 2 === 1) {
    const arp = BOSS_ARP[(step >> 1) % BOSS_ARP.length]!;
    this.tone(arp, arp, 0.13, 'triangle', 0.036);
   }
  }, 135);
 }

 dispose(): void {
  this.bgmActive = false;
  this.stopBgmTimer();
  if (this.ctx) {
   void this.ctx.close().catch(() => {});
   this.ctx = null;
  }
 }
}
