import type { OmegaStrikerId, OmegaStyleTier } from '../domain/omega-protocol-zero-signal';

export type BgmIntensity = 'calm' | 'battle' | 'surge' | 'boss';
export type OmegaHitMaterial = 'boss' | 'armored' | 'normal';

export const OMEGA_AUDIO_MANIFEST = {
 bgm_calm: '/assets/defense/audio/guard-v1/MUSIC_RAMP01_BED_FULL_MIX_AUDITION.mp3',
 bgm_battle: '/assets/defense/audio/guard-v1/MUSIC_RAMP01_RHYTHM_FULL_MIX_AUDITION.mp3',
 bgm_surge: '/assets/defense/audio/guard-v1/MUSIC_RAMP01_PRESSURE_FULL_MIX_AUDITION.mp3',
 bgm_boss: '/assets/defense/audio/guard-v1/MUSIC_RAMP01_BOSS_FULL_MIX_AUDITION.mp3',
 bgm_coda: '/assets/defense/audio/guard-v1/MUSIC_RAMP01_CODA_FULL_MIX_AUDITION.mp3',

 gun_normal: '/assets/defense/audio/guard-v1/PULSE_FIRE_AUDIO.mp3',
 gun_overclock: '/assets/defense/audio/guard-v1/BURST_FIRE_AUDIO.mp3',
 impact_normal: '/assets/defense/audio/guard-v1/ENEMY_NORMAL_IMPACT_AUDIO.mp3',
 impact_armored: '/assets/defense/audio/guard-v1/ENEMY_ARMORED_IMPACT_AUDIO.mp3',
 impact_boss: '/assets/defense/audio/guard-v1/ENEMY_BOSS_IMPACT_AUDIO.mp3',
 impact_steel_a: '/assets/survivors/impact-sfx-v1/impact_steel_a.wav',
 impact_steel_b: '/assets/survivors/impact-sfx-v1/impact_steel_b.wav',
 impact_steel_c: '/assets/survivors/impact-sfx-v1/impact_steel_c.wav',
 impact_finisher_a: '/assets/survivors/impact-sfx-v1/impact_finisher_a.wav',
 impact_finisher_b: '/assets/survivors/impact-sfx-v1/impact_finisher_b.wav',
 impact_finisher_c: '/assets/survivors/impact-sfx-v1/impact_finisher_c.wav',

 detonation_burst: '/assets/defense/audio/guard-v1/BURST_RESOLVE_AUDIO.mp3',
 phantom_drop: '/assets/episode01/audio/stopwork-silence-drop.ogg',
 striker_snipe: '/assets/defense/audio/guard-v1/CRITICAL_ESTOP_CONFIRMED_AUDIO.mp3',
 striker_sentry: '/assets/survivors/drone-sfx-v3/drone_launch.ogg',
 striker_emp: '/assets/defense/audio/guard-v1/CONTROL_RESOLVE_AUDIO.mp3',
 striker_emp_boom: '/assets/episode01/audio/pump-engine-boom.ogg',
 striker_aegis: '/assets/defense/audio/g8a/support-call.ogg',
 radio_burst: '/assets/episode01/audio/radio-burst.ogg',

 rank_up: '/assets/survivors/score-v2/intervention.ogg',
 evo_unlock: '/assets/survivors/score-v2/evolution.ogg',
 boss_entry: '/assets/defense/audio/guard-v1/CRITICAL_BOSS_ENTRY_AUDIO.mp3',
 boss_alert: '/assets/survivors/score-v2/boss_alert.ogg',
 shield_break: '/assets/defense/audio/g8a/shield-leak.ogg',
 player_hit: '/assets/survivors/sfx-v2/player_hit_a.ogg',
 pickup: '/assets/survivors/sfx-v2/pickup_a.ogg',
 secured: '/assets/survivors/sfx-v2/incident_secured_a.ogg',
 victory: '/assets/survivors/score-v2/success.ogg',
 defeat: '/assets/survivors/score-v2/failure.ogg',
 footstep_a: '/assets/survivors/sfx-v2/footstep_steel_a.ogg',
 footstep_b: '/assets/survivors/sfx-v2/footstep_steel_b.ogg',

 voice_start: '/assets/survivors/voice-player-covert-v1/PSI_V_PLAYER_START_A_v01_covert.wav',
 voice_m01: '/assets/episode01/audio/voice-kang-first-contact.ogg',
 voice_guard: '/assets/survivors/voice-player-engineer-v1/PSI_V_PLAYER_SUPPORT_A_v01_engineer.wav',
 voice_breaker: '/assets/survivors/voice-player-covert-v1/PSI_V_PLAYER_SUPPORT_B_v01_covert.wav',
 voice_site: '/assets/episode01/audio/voice-junho-signal.ogg',
 voice_evo: '/assets/survivors/voice-player-covert-v1/PSI_V_PLAYER_EVOLUTION_A_v01_covert.wav',
 voice_clear: '/assets/survivors/voice-player-covert-v1/PSI_V_PLAYER_CORE_OPEN_A_v01_covert.wav',
 voice_victory: '/assets/survivors/voice-player-covert-v1/PSI_V_PLAYER_FINAL_CLEAR_A_v01_covert.wav',
} as const;

export type OmegaAudioCueKey = keyof typeof OMEGA_AUDIO_MANIFEST;

const PRELOAD_COMBAT_KEYS: readonly OmegaAudioCueKey[] = [
 'gun_normal',
 'gun_overclock',
 'impact_normal',
 'impact_armored',
 'impact_boss',
 'impact_steel_a',
 'impact_steel_b',
 'impact_finisher_a',
 'impact_finisher_b',
 'detonation_burst',
 'phantom_drop',
 'striker_snipe',
 'striker_sentry',
 'striker_emp',
 'striker_aegis',
 'radio_burst',
 'rank_up',
 'evo_unlock',
 'boss_entry',
 'shield_break',
 'pickup',
 'secured',
 'footstep_a',
 'footstep_b',
 'voice_start',
 'voice_m01',
 'voice_guard',
 'voice_breaker',
 'voice_site',
];

const BGM_KEY_BY_INTENSITY: Readonly<Record<BgmIntensity, OmegaAudioCueKey>> = {
 calm: 'bgm_calm',
 battle: 'bgm_battle',
 surge: 'bgm_surge',
 boss: 'bgm_boss',
};

const D_MINOR_BASS = [73.42, 73.42, 87.31, 73.42, 110.0, 98.0, 87.31, 82.41];
const BOSS_ARP = [293.66, 349.23, 440.0, 523.25, 440.0, 349.23, 587.33, 440.0];

/**
 * Track-B Studio Sample Hybrid Audio + Web Audio DSP Engine for 『OMEGA PROTOCOL: ZERO SIGNAL』:
 * combines real Signal Series studio master stems, multi-material weapon/blade impacts,
 * Korean Signal tactical radio voiceovers with auto-ducking, Phantom Dodge low-pass sweep,
 * and adaptive 4-intensity BGM crossfades, with zero-allocation procedural Web Audio fallbacks.
 */
export class OmegaProceduralAudio {
 private ctx: AudioContext | null = null;
 private masterGain: GainNode | null = null;
 private lowpass: BiquadFilterNode | null = null;
 private sfxBus: GainNode | null = null;
 private bgmBus: GainNode | null = null;
 private voiceBus: GainNode | null = null;

 private noiseBuffer: AudioBuffer | null = null;
 private readonly buffers = new Map<OmegaAudioCueKey, AudioBuffer>();
 private readonly loading = new Set<OmegaAudioCueKey>();

 private muted = false;
 private bulletTimeActive = false;
 private bgmActive = false;
 private bgmIntensity: BgmIntensity = 'battle';
 private bgmFadeTimer: number | null = null;
 private readonly bgmTracks = new Map<
  BgmIntensity,
  { el: HTMLAudioElement; gain: GainNode | null; currentVol: number }
 >();
 private synthBgmTimer: number | null = null;
 private bgmStep = 0;

 private activeVoiceSource: AudioBufferSourceNode | null = null;
 private lastVoiceAt = 0;
 private voiceDuckUntil = 0;
 private lastShotAt = 0;
 private lastImpactAt = 0;
 private lastFootstepAt = 0;
 private steelIndex = 0;
 private stepFlip = false;

 isMuted(): boolean {
  return this.muted;
 }

 setMuted(muted: boolean): void {
  this.muted = muted;
  if (muted) {
   this.stopSynthBgmTimer();
   this.stopActiveVoice();
   for (const tr of this.bgmTracks.values()) {
    tr.currentVol = 0;
    this.applyTrackGain(tr, 0);
    if (!tr.el.paused) tr.el.pause();
   }
  } else if (this.bgmActive) {
   this.ensureBgmPlaying();
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
    const ctx = new Ctor();
    this.ctx = ctx;

    // Master DSP chain: [sfxBus + bgmBus] -> lowpass -> compressor -> masterGain -> destination
    const master = ctx.createGain();
    master.gain.value = 0.88;
    master.connect(ctx.destination);
    this.masterGain = master;

    let preMaster: AudioNode = master;
    if (typeof ctx.createDynamicsCompressor === 'function') {
     const comp = ctx.createDynamicsCompressor();
     comp.threshold.value = -14;
     comp.knee.value = 18;
     comp.ratio.value = 4;
     comp.attack.value = 0.004;
     comp.release.value = 0.16;
     comp.connect(master);
     preMaster = comp;
    }

    let sfxTarget: AudioNode = preMaster;
    if (typeof ctx.createBiquadFilter === 'function') {
     const lp = ctx.createBiquadFilter();
     lp.type = 'lowpass';
     lp.frequency.value = this.bulletTimeActive ? 780 : 22000;
     lp.Q.value = this.bulletTimeActive ? 2.4 : 0.7;
     lp.connect(preMaster);
     this.lowpass = lp;
     sfxTarget = lp;
    }

    const sfx = ctx.createGain();
    sfx.gain.value = 0.94;
    sfx.connect(sfxTarget);
    this.sfxBus = sfx;

    const bgm = ctx.createGain();
    bgm.gain.value = 0.36;
    bgm.connect(sfxTarget);
    this.bgmBus = bgm;

    const voice = ctx.createGain();
    voice.gain.value = 0.95;
    voice.connect(preMaster);
    this.voiceBus = voice;

    const sr = ctx.sampleRate || 44100;
    const len = Math.floor(sr * 0.25);
    const buf = ctx.createBuffer(1, len, sr);
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

  this.preloadKeys(PRELOAD_COMBAT_KEYS);
  if (this.bgmActive && !this.muted) {
   this.ensureBgmPlaying();
  }
  return true;
 }

 setBulletTime(active: boolean): void {
  if (this.bulletTimeActive === active) return;
  this.bulletTimeActive = active;
  const ctx = this.ctx;
  const lp = this.lowpass;
  if (!ctx || !lp) return;
  const now = ctx.currentTime;
  try {
   lp.frequency.cancelScheduledValues(now);
   lp.frequency.setValueAtTime(lp.frequency.value, now);
   lp.frequency.exponentialRampToValueAtTime(active ? 780 : 22000, now + (active ? 0.08 : 0.24));
   lp.Q.setValueAtTime(active ? 2.4 : 0.7, now);
  } catch {
   lp.frequency.value = active ? 780 : 22000;
  }
 }

 private readyCtx(): AudioContext | null {
  if (this.muted || !this.ctx || this.ctx.state === 'suspended') return null;
  return this.ctx;
 }

 private preloadKeys(keys: readonly OmegaAudioCueKey[]): void {
  for (const key of keys) {
   this.ensureSampleLoaded(key);
  }
 }

 private ensureSampleLoaded(key: OmegaAudioCueKey): AudioBuffer | null {
  const cached = this.buffers.get(key);
  if (cached) return cached;
  if (
   this.loading.has(key) ||
   !this.ctx ||
   typeof fetch !== 'function' ||
   typeof this.ctx.decodeAudioData !== 'function'
  ) {
   return null;
  }
  this.loading.add(key);
  const url = OMEGA_AUDIO_MANIFEST[key];
  const targetCtx = this.ctx;
  void fetch(url)
   .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error('HTTP ' + res.status))))
   .then((ab) => targetCtx.decodeAudioData(ab))
   .then((decoded) => {
    if (this.ctx === targetCtx) {
     this.buffers.set(key, decoded);
    }
   })
   .catch(() => {})
   .finally(() => {
    this.loading.delete(key);
   });
  return null;
 }

 private playSample(
  key: OmegaAudioCueKey,
  options: Readonly<{ gain?: number; rate?: number; jitter?: number; delay?: number; bus?: 'sfx' | 'voice' }> = {},
 ): boolean {
  const ctx = this.readyCtx();
  if (!ctx) return false;
  const buf = this.ensureSampleLoaded(key);
  if (!buf) return false;

  const src = ctx.createBufferSource();
  src.buffer = buf;
  const jitter = options.jitter ?? 0;
  const baseRate = options.rate ?? 1;
  src.playbackRate.value = Math.max(0.4, baseRate * (1 + (Math.random() - 0.5) * 2 * jitter));

  const g = ctx.createGain();
  g.gain.value = options.gain ?? 0.55;
  const dest =
   options.bus === 'voice'
    ? (this.voiceBus ?? this.masterGain ?? ctx.destination)
    : (this.sfxBus ?? this.masterGain ?? ctx.destination);

  src.connect(g);
  g.connect(dest);
  src.start(ctx.currentTime + (options.delay ?? 0));
  return true;
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
  gain.connect(this.sfxBus ?? this.masterGain ?? ctx.destination);
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
  gain.connect(this.sfxBus ?? this.masterGain ?? ctx.destination);
  src.start(now);
  src.stop(now + duration + 0.01);
 }

 private stopActiveVoice(): void {
  if (this.activeVoiceSource) {
   try {
    this.activeVoiceSource.stop();
   } catch {
    void 0;
   }
   this.activeVoiceSource = null;
  }
 }

 private playVoice(key: OmegaAudioCueKey, priority = false): void {
  const ctx = this.readyCtx();
  if (!ctx) return;
  const nowMs = Date.now();
  if (!priority && nowMs - this.lastVoiceAt < 3200) return;

  const buf = this.ensureSampleLoaded(key);
  if (!buf) return;

  if (priority) {
   this.stopActiveVoice();
  } else if (this.activeVoiceSource) {
   return;
  }

  this.lastVoiceAt = nowMs;
  this.voiceDuckUntil = nowMs + Math.min(3400, Math.round(buf.duration * 1000) + 250);
  this.playSample('radio_burst', { gain: 0.28, rate: 1.04 });

  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.value = 0.72;
  src.connect(g);
  g.connect(this.voiceBus ?? this.masterGain ?? ctx.destination);
  src.onended = () => {
   if (this.activeVoiceSource === src) {
    this.activeVoiceSource = null;
   }
  };
  this.activeVoiceSource = src;
  src.start(ctx.currentTime + 0.07);
 }

 playSortieStart(): void {
  this.playSample('secured', { gain: 0.34 });
  this.playVoice('voice_start', true);
 }

 playGunshot(overclocked = false): void {
  const nowMs = Date.now();
  if (nowMs - this.lastShotAt < 58) return;
  this.lastShotAt = nowMs;

  const sampled = this.playSample(overclocked ? 'gun_overclock' : 'gun_normal', {
   gain: overclocked ? 0.40 : 0.28,
   rate: overclocked ? 1.12 : 1.04,
   jitter: 0.06,
  });
  this.tone(overclocked ? 310 : 185, 48, 0.08, 'sawtooth', sampled ? 0.05 : overclocked ? 0.14 : 0.09);
  if (!sampled) {
   this.noiseBurst(overclocked ? 3600 : 2100, 1.8, 0.06, 0.11);
  }
 }

 playHitImpact(material: OmegaHitMaterial = 'normal'): void {
  const nowMs = Date.now();
  if (material === 'normal' && nowMs - this.lastImpactAt < 48) return;
  this.lastImpactAt = nowMs;

  const key: OmegaAudioCueKey =
   material === 'boss' ? 'impact_boss' : material === 'armored' ? 'impact_armored' : 'impact_normal';
  const sampled = this.playSample(key, {
   gain: material === 'boss' ? 0.56 : material === 'armored' ? 0.45 : 0.32,
   jitter: 0.08,
  });
  if (material === 'armored' || material === 'boss') {
   const steelKeys: readonly OmegaAudioCueKey[] = ['impact_steel_a', 'impact_steel_b', 'impact_steel_c'];
   this.playSample(steelKeys[this.steelIndex++ % 3]!, { gain: 0.28, jitter: 0.05 });
  }
  if (!sampled) {
   this.tone(material === 'boss' ? 140 : 220, 62, 0.07, 'triangle', 0.09);
  }
 }

 playBladeSlash(combo: 1 | 2 | 3): void {
  const steelKeys: readonly OmegaAudioCueKey[] = ['impact_steel_a', 'impact_steel_b', 'impact_steel_c'];
  const finKeys: readonly OmegaAudioCueKey[] = ['impact_finisher_a', 'impact_finisher_b', 'impact_finisher_c'];
  const idx = this.steelIndex++ % 3;

  if (combo === 3) {
   this.playSample(finKeys[idx]!, { gain: 0.52, rate: 1.0, jitter: 0.04 });
   this.tone(1320, 380, 0.20, 'sine', 0.08, 0.01);
  } else {
   this.playSample(steelKeys[idx]!, { gain: combo === 2 ? 0.44 : 0.38, rate: combo === 2 ? 1.08 : 0.98, jitter: 0.05 });
  }
  const base = combo === 3 ? 1150 : combo === 2 ? 880 : 720;
  this.noiseBurst(base * 2.1, 2.4, 0.12, 0.11);
  this.tone(base, base * 0.35, 0.13, 'triangle', 0.07);
 }

 playDetonation(stacks: number): void {
  const boost = Math.min(1.4, 0.8 + stacks * 0.2);
  this.playSample('detonation_burst', { gain: Math.min(0.75, 0.46 * boost), rate: stacks >= 3 ? 0.92 : 1.04 });
  if (stacks >= 3) {
   this.playSample('impact_finisher_a', { gain: 0.48, rate: 0.88, delay: 0.02 });
  }
  this.tone(118, 28, 0.30, 'sawtooth', 0.16 * boost);
  this.noiseBurst(920, 0.8, 0.22, 0.12 * boost);
 }

 playPhantomDodge(): void {
  this.playSample('phantom_drop', { gain: 0.52, rate: 1.0 });
  this.tone(440, 72, 0.36, 'sawtooth', 0.12);
  this.tone(1760, 1320, 0.22, 'sine', 0.09, 0.03);
 }

 playStriker(id: OmegaStrikerId): void {
  if (id === 'm01_snipe') {
   this.playSample('striker_snipe', { gain: 0.62 });
   this.playVoice('voice_m01', true);
   this.tone(1800, 160, 0.26, 'sawtooth', 0.13);
  } else if (id === 'guard_sentry') {
   this.playSample('striker_sentry', { gain: 0.58 });
   this.playVoice('voice_guard', true);
   this.tone(240, 620, 0.14, 'square', 0.08);
  } else if (id === 'breaker_emp') {
   this.playSample('striker_emp', { gain: 0.60 });
   this.playSample('striker_emp_boom', { gain: 0.48, delay: 0.04 });
   this.playVoice('voice_breaker', true);
   this.tone(140, 28, 0.42, 'sawtooth', 0.16);
  } else {
   this.playSample('striker_aegis', { gain: 0.58 });
   this.playVoice('voice_site', true);
   this.tone(330, 440, 0.24, 'sine', 0.09);
  }
 }

 playRankUp(rank: OmegaStyleTier): void {
  const high = rank === 'S' || rank === 'SS' || rank === 'OMEGA';
  if (high) {
   this.playSample('rank_up', { gain: 0.50, rate: rank === 'OMEGA' ? 1.12 : 1.0 });
  }
  const root = high ? 587.33 : 440;
  this.tone(root, root, 0.11, 'triangle', 0.09, 0);
  this.tone(root * 1.25, root * 1.25, 0.11, 'triangle', 0.09, 0.07);
  this.tone(root * 1.5, root * 1.5, 0.18, 'sine', 0.11, 0.14);
 }

 playPickup(): void {
  if (!this.playSample('pickup', { gain: 0.36, jitter: 0.06 })) {
   this.tone(880, 1320, 0.09, 'sine', 0.08);
  }
 }

 playShieldBreak(): void {
  this.playSample('shield_break', { gain: 0.56 });
  this.playSample('player_hit', { gain: 0.40, delay: 0.02 });
  this.tone(620, 130, 0.26, 'sawtooth', 0.11);
 }

 playEvoUnlock(): void {
  this.playSample('evo_unlock', { gain: 0.62 });
  this.playVoice('voice_evo', false);
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
   this.tone(freq, freq * 1.02, 0.18, 'triangle', 0.09, i * 0.06);
  });
 }

 playBossEntry(): void {
  this.playSample('boss_entry', { gain: 0.66 });
  this.playSample('boss_alert', { gain: 0.52, delay: 0.12 });
  this.tone(92, 42, 0.55, 'sawtooth', 0.15);
 }

 playWaveClear(): void {
  this.playSample('secured', { gain: 0.48 });
  this.playVoice('voice_clear', false);
 }

 playVictory(): void {
  this.playSample('bgm_coda', { gain: 0.45 });
  this.playSample('victory', { gain: 0.62 });
  this.playVoice('voice_victory', true);
 }

 playDefeat(): void {
  this.playSample('defeat', { gain: 0.60 });
 }

 playFootstep(): void {
  const nowMs = Date.now();
  if (nowMs - this.lastFootstepAt < 185) return;
  this.lastFootstepAt = nowMs;
  this.stepFlip = !this.stepFlip;
  this.playSample(this.stepFlip ? 'footstep_a' : 'footstep_b', { gain: 0.18, jitter: 0.07 });
 }

 setBgmState(active: boolean, intensity: BgmIntensity): void {
  this.bgmActive = active;
  this.bgmIntensity = intensity;
  if (!active || this.muted) {
   this.stopSynthBgmTimer();
   for (const tr of this.bgmTracks.values()) {
    tr.currentVol = 0;
    this.applyTrackGain(tr, 0);
    if (!tr.el.paused) tr.el.pause();
   }
   this.stopBgmFadeTimer();
   return;
  }
  if (this.ctx && this.ctx.state !== 'suspended') {
   this.ensureBgmPlaying();
  }
 }

 private ensureBgmPlaying(): void {
  if (typeof window === 'undefined' || !this.bgmActive || this.muted) return;

  if (typeof Audio === 'function' && this.ctx) {
   const targetKey = this.bgmIntensity;
   let track = this.bgmTracks.get(targetKey);
   if (!track) {
    try {
     const el = new Audio(OMEGA_AUDIO_MANIFEST[BGM_KEY_BY_INTENSITY[targetKey]]);
     el.loop = true;
     el.preload = 'auto';
     el.volume = 0;
     let gain: GainNode | null = null;
     if (typeof this.ctx.createMediaElementSource === 'function' && this.bgmBus) {
      const node = this.ctx.createMediaElementSource(el);
      gain = this.ctx.createGain();
      gain.gain.value = 0;
      node.connect(gain);
      gain.connect(this.bgmBus);
      el.volume = 1;
     }
     track = { el, gain, currentVol: 0 };
     this.bgmTracks.set(targetKey, track);
    } catch {
     track = undefined;
    }
   }

   if (track) {
    if (track.el.paused) {
     void track.el.play().catch(() => {
      // Autoplay blocked before user interaction -> fallback handled silently
     });
    }
    this.startBgmFadeTimer();
    return;
   }
  }

  this.startSynthBgmTimer();
 }

 private applyTrackGain(tr: { el: HTMLAudioElement; gain: GainNode | null }, vol: number): void {
  if (tr.gain) {
   tr.gain.gain.value = vol;
  } else {
   tr.el.volume = Math.max(0, Math.min(1, vol * 0.42));
  }
 }

 private startBgmFadeTimer(): void {
  if (typeof window === 'undefined' || this.bgmFadeTimer !== null) return;
  this.bgmFadeTimer = window.setInterval(() => {
   if (!this.bgmActive || this.muted) {
    this.stopBgmFadeTimer();
    return;
   }
   const duck = Date.now() < this.voiceDuckUntil ? 0.36 : 1.0;
   let anyActive = false;
   for (const [intensity, tr] of this.bgmTracks.entries()) {
    const target = intensity === this.bgmIntensity ? duck : 0;
    const diff = target - tr.currentVol;
    if (Math.abs(diff) > 0.02) {
     tr.currentVol += diff * 0.14;
     anyActive = true;
    } else {
     tr.currentVol = target;
    }
    this.applyTrackGain(tr, tr.currentVol);
    if (target === 0 && tr.currentVol <= 0.02 && !tr.el.paused) {
     tr.el.pause();
    } else if (target > 0 && tr.el.paused) {
     void tr.el.play().catch(() => {});
    }
   }
   if (!anyActive && Date.now() >= this.voiceDuckUntil) {
    // keep lightweight poll only if transitioning
   }
  }, 60);
 }

 private stopBgmFadeTimer(): void {
  if (this.bgmFadeTimer !== null && typeof window !== 'undefined') {
   window.clearInterval(this.bgmFadeTimer);
   this.bgmFadeTimer = null;
  }
 }

 private stopSynthBgmTimer(): void {
  if (this.synthBgmTimer !== null && typeof window !== 'undefined') {
   window.clearInterval(this.synthBgmTimer);
   this.synthBgmTimer = null;
  }
 }

 private startSynthBgmTimer(): void {
  if (typeof window === 'undefined' || this.synthBgmTimer !== null) return;
  this.synthBgmTimer = window.setInterval(() => {
   const ctx = this.readyCtx();
   if (!ctx || !this.bgmActive) return;
   const step = this.bgmStep++ % 16;
   const bassHz = D_MINOR_BASS[step % D_MINOR_BASS.length]!;
   if (step % 2 === 0) {
    this.tone(bassHz, bassHz * 0.98, 0.15, 'sawtooth', this.bgmIntensity === 'calm' ? 0.025 : 0.042);
   }
   if (this.bgmIntensity !== 'calm') {
    if (step % 4 === 0) this.tone(110, 38, 0.11, 'sine', 0.075);
    if (step % 4 === 2) this.noiseBurst(6400, 3.2, 0.035, 0.026);
   }
   if ((this.bgmIntensity === 'boss' || this.bgmIntensity === 'surge') && step % 2 === 1) {
    const arp = BOSS_ARP[(step >> 1) % BOSS_ARP.length]!;
    this.tone(arp, arp, 0.13, 'triangle', 0.036);
   }
  }, 135);
 }

 dispose(): void {
  this.bgmActive = false;
  this.stopSynthBgmTimer();
  this.stopBgmFadeTimer();
  this.stopActiveVoice();
  for (const tr of this.bgmTracks.values()) {
   tr.el.pause();
   tr.el.src = '';
  }
  this.bgmTracks.clear();
  this.buffers.clear();
  if (this.ctx) {
   void this.ctx.close().catch(() => {});
   this.ctx = null;
  }
  this.masterGain = null;
  this.lowpass = null;
  this.sfxBus = null;
  this.bgmBus = null;
  this.voiceBus = null;
 }
}
