import type { SurvivorsAudioAsset, SurvivorsAudioBus } from '../domain/survivors-audio';
// Development synth lifecycle only; this is not final orchestral audio.
export class SurvivorsSessionAudio {
  private context: AudioContext | null = null;
  private muted = false;
  private synthNoise: AudioBuffer | null = null;
  private master: GainNode | null = null;
  private buses: Record<SurvivorsAudioBus, GainNode> | null = null;
  private buffers = new Map<string, Promise<AudioBuffer>>();
  readonly failures: string[] = [];
  private epoch = 0;
  private priorities = new Map<AudioScheduledSourceNode, number>();
  private spatialNodes = new Map<AudioScheduledSourceNode, AudioNode[]>();
  private voices = new Map<AudioScheduledSourceNode, AudioNode>();
  get voiceCount() { return this.voices.size; }
  setMuted(muted: boolean) { this.muted = muted; if (muted) this.silence(); }
  getContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.context) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.context = new Ctor();
    }
    if (this.context.state === 'suspended') void this.context.resume().catch(err => this.fail(String(err)));
    return this.context;
  }
  private ensureBuses() {
    const ctx = this.getContext();
    if (!ctx) return null;
    if (!this.master) {
      this.master = ctx.createGain(); this.master.connect(ctx.destination);
      this.buses = Object.fromEntries(['Music', 'SFX', 'Voice', 'Ambience'].map(name => {
        const gain = ctx.createGain(); gain.connect(this.master!); return [name, gain];
      })) as Record<SurvivorsAudioBus, GainNode>;
    }
    return ctx;
  }
  noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.synthNoise) {
      const size = Math.floor(ctx.sampleRate * 0.15);
      this.synthNoise = ctx.createBuffer(1, size, ctx.sampleRate);
      const data = this.synthNoise.getChannelData(0);
      for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (size * 0.4));
    }
    return this.synthNoise;
  }
  reportFailure(message: string) { this.fail(message); }
  setVolume(bus: SurvivorsAudioBus | 'Master', value: number) {
    if (!Number.isFinite(value)) return;
    this.ensureBuses();
    const gain = bus === 'Master' ? this.master : this.buses?.[bus];
    if (gain) gain.gain.value = Math.max(0, Math.min(1, value));
  }
  sfxDestination(): AudioNode { this.ensureBuses(); return this.buses!.SFX; }
  duckMusic() {
    const ctx = this.ensureBuses(); if (!ctx) return;
    const gain = this.buses!.Music.gain;
    gain.cancelScheduledValues(ctx.currentTime);
    gain.setValueAtTime(gain.value, ctx.currentTime);
    gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gain.linearRampToValueAtTime(1, ctx.currentTime + 0.6);
  }
  private fail(message: string) {
    this.failures.push(message); if (this.failures.length > 32) this.failures.shift();
    console.warn('[SURVIVORS audio]', message);
  }
  async playApproved(assets: readonly SurvivorsAudioAsset[]): Promise<boolean> {
    // Synchronize approved stems using one future clock point; fail closed for missing approvals/rights.
    if (!assets.length || assets.some(a => a.status !== 'PRODUCTION_APPROVED' || !a.uri || !a.rights || !a.sha256)) return false;
    const ctx = this.ensureBuses(); if (!ctx) return false;
    const epoch = this.epoch;
    try {
      const decoded = await Promise.all(assets.map(a => {
        if (!this.buffers.has(a.uri!)) this.buffers.set(a.uri!, fetch(a.uri!).then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}: ${a.id}`); return r.arrayBuffer();
        }).then(bytes => ctx.decodeAudioData(bytes)));
        return this.buffers.get(a.uri!)!;
      }));
      if (epoch !== this.epoch || ctx !== this.context) return false;
      const start = ctx.currentTime + 0.05;
      assets.forEach((asset, i) => {
        const source = ctx.createBufferSource(), gain = ctx.createGain();
        source.buffer = decoded[i]!; source.loop = asset.loop;
        source.connect(gain); gain.connect(this.buses![asset.bus]);
        if (this.track(source, gain, asset.bus === 'Voice' ? 4 : asset.bus === 'Music' ? 0 : 1)) source.start(start);
      });
      return true;
    } catch (err) { this.fail(String(err)); this.buffers.clear(); return false; }
  }
  connectSfx(source: AudioScheduledSourceNode, gain: AudioNode, position?: {x: number; y: number}, listener?: {x: number; y: number}) {
    const ctx = this.ensureBuses(); if (!ctx) return;
    if (position && listener && typeof ctx.createStereoPanner === 'function') {
      const pan = ctx.createStereoPanner(), attenuation = ctx.createGain();
      pan.pan.value = Math.max(-0.65, Math.min(0.65, (position.x - listener.x) / 700));
      attenuation.gain.value = Math.max(0.35, 1 - Math.hypot(position.x - listener.x, position.y - listener.y) / 1800);
      gain.connect(pan); pan.connect(attenuation); attenuation.connect(this.buses!.SFX);
      this.spatialNodes.set(source, [pan, attenuation]);
    } else gain.connect(this.buses!.SFX);
  }
  track(source: AudioScheduledSourceNode, gain: AudioNode, priority = 1): boolean {
    if (this.voices.size >= 24) {
      let victim: AudioScheduledSourceNode | undefined;
      let minimum = Infinity;
      for (const current of this.voices.keys()) {
        const rank = this.priorities.get(current) ?? 1;
        if (rank < minimum) { victim = current; minimum = rank; }
      }
      if (priority < minimum) { source.disconnect(); gain.disconnect(); return false; }
      if (victim) this.release(victim, true);
    }
    this.voices.set(source, gain); this.priorities.set(source, priority);
    source.onended = () => this.release(source, false);
    return true;
  }
  private release(source: AudioScheduledSourceNode, stop: boolean) {
    const gain = this.voices.get(source);
    if (!gain) return;
    this.voices.delete(source); this.priorities.delete(source);
    for (const node of this.spatialNodes.get(source) ?? []) node.disconnect();
    this.spatialNodes.delete(source);
    source.onended = null;
    if (stop) { try { source.stop(); } catch { /* already ended */ } }
    source.disconnect(); gain.disconnect();
  }
  silence() {
    this.epoch++;
    for (const source of this.voices.keys()) this.release(source, true);
    if (this.buses && this.context) { const gain = this.buses.Music.gain; gain.cancelScheduledValues(this.context.currentTime); gain.value = 1; }
  }
  dispose() {
    this.silence();
    const context = this.context; this.context = null;
    if (this.buses) for (const bus of Object.values(this.buses)) bus.disconnect();
    this.master?.disconnect(); this.master = null; this.buses = null; this.buffers.clear(); this.synthNoise = null;
    if (context) void context.close().catch(() => {});
  }
}
