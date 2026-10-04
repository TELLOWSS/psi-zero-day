import type { ProjectileFeedback } from '../domain/survivors-projectile-feedback';
import type { SurvivorsAudioAsset, SurvivorsAudioBus } from '../domain/survivors-audio';
// Development synth lifecycle only; this is not final orchestral audio.
export class SurvivorsSessionAudio {
  private context: AudioContext | null = null;
  private muted = false;
  private synthNoise: AudioBuffer | null = null;
  private master: GainNode | null = null;
  private musicDuck: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private duckUntil = 0;
  private dialogueFocus = false;
  private equipmentTimes = new Map<string,number>();
  private buses: Record<SurvivorsAudioBus, GainNode> | null = null;
  private buffers = new Map<string, Promise<AudioBuffer>>();
  readonly failures: string[] = [];
  private epoch = 0;
  private scoreId: string | null = null;
  private scoreEpoch = 0;
  private scoreTimer: ReturnType<typeof setTimeout> | null = null;
  private scoreNodes = new Map<AudioBufferSourceNode, GainNode>();
  /** Explicit Director-authorized audition path; never promotes candidate approval. */
  async auditionScore(asset: SurvivorsAudioAsset, cueSeconds?: number): Promise<boolean> {
    if (asset.bus !== 'Music' || asset.status !== 'CANDIDATE' || !asset.uri || !asset.rights || !asset.sha256) return false;
    if (this.scoreId === asset.id && asset.loop) return true;
    const ctx = this.ensureBuses(); if (!ctx) return false;
    this.scoreId = asset.id;
    const token = ++this.scoreEpoch;
    if (this.scoreTimer) clearTimeout(this.scoreTimer);
    this.scoreTimer = null;
    try {
      const buffer = await this.decodeAsset(ctx, asset);
      if (token !== this.scoreEpoch || this.muted || ctx !== this.context) return false;
      const now = ctx.currentTime;
      for (const [source, gain] of this.scoreNodes) {
        gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        try { source.stop(now + 0.45); } catch { /* ended */ }
      }
      const duration = Math.min(buffer.duration, cueSeconds ?? buffer.duration);
      const overlap = Math.min(0.8, duration / 4);
      const schedule = (start: number) => {
        if (token !== this.scoreEpoch) return;
        const source = ctx.createBufferSource(), gain = ctx.createGain();
        source.buffer = buffer; source.connect(gain); gain.connect(this.buses!.Music);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.55, start + overlap);
        gain.gain.setValueAtTime(0.55, start + duration - overlap);
        gain.gain.linearRampToValueAtTime(0, start + duration);
        this.scoreNodes.set(source, gain);
        source.onended = () => { this.scoreNodes.delete(source); source.disconnect(); gain.disconnect(); };
        source.start(start, 0, duration);
        if (asset.loop) {
          const next = start + duration - overlap;
          this.scoreTimer = setTimeout(() => schedule(Math.max(ctx.currentTime + 0.03, next)), Math.max(0, (next - ctx.currentTime - 1) * 1000));
        }
      };
      schedule(now + 0.05);
      return true;
    } catch (err) { if (token === this.scoreEpoch) this.scoreId = null; this.buffers.delete(asset.uri); this.fail(String(err)); return false; }
  }
  stopScore() {
    this.scoreEpoch++; this.scoreId = null;
    if (this.scoreTimer) clearTimeout(this.scoreTimer);
    this.scoreTimer = null;
    for (const [source, gain] of this.scoreNodes) { source.onended = null; try { source.stop(); } catch { /* ended */ } source.disconnect(); gain.disconnect(); }
    this.scoreNodes.clear();
  }
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
      this.master = ctx.createGain();
      if(typeof ctx.createDynamicsCompressor==='function') {
        this.limiter=ctx.createDynamicsCompressor();
        this.limiter.threshold.value=-12;this.limiter.knee.value=12;this.limiter.ratio.value=4;
        this.limiter.attack.value=.003;this.limiter.release.value=.18;
        this.master.connect(this.limiter);this.limiter.connect(ctx.destination);
      } else this.master.connect(ctx.destination);
      this.musicDuck=ctx.createGain();this.musicDuck.connect(this.master);
      this.buses = Object.fromEntries(['Music', 'SFX', 'Voice', 'Ambience'].map(name => {
        const gain = ctx.createGain(); gain.connect(name==='Music'?this.musicDuck!:this.master!); return [name, gain];
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
  setDialogueFocus(active:boolean) {
    this.dialogueFocus=active;const ctx=this.ensureBuses();if(!ctx)return;
    const gain=this.musicDuck!.gain;gain.cancelScheduledValues(ctx.currentTime);
    gain.setValueAtTime(gain.value,ctx.currentTime);gain.linearRampToValueAtTime(active?.24:1,ctx.currentTime+.12);
    if(!active)this.duckUntil=0;
  }
  duckMusic(holdSeconds = 0.6) {
    const ctx = this.ensureBuses(); if (!ctx || this.dialogueFocus) return;
    const now=ctx.currentTime,gain=this.musicDuck!.gain;
    this.duckUntil=Math.max(this.duckUntil,now+Math.max(.1,holdSeconds));
    gain.cancelScheduledValues(now);gain.setValueAtTime(gain.value,now);
    gain.linearRampToValueAtTime(.35,now+.035);
    gain.setValueAtTime(.35,this.duckUntil);gain.linearRampToValueAtTime(1,this.duckUntil+.18);
  }
  /** Equipment material sound remains procedural until the final recording gate. */
  playEquipmentFeedback(event:ProjectileFeedback,listener:{x:number;y:number},busy=false):void {
    if(busy&&event.phase==='release')return;
    const ctx=this.ensureBuses();if(!ctx)return;
    const key=event.kind+':'+event.phase,now=ctx.currentTime,previous=this.equipmentTimes.get(key);
    if(previous!==undefined&&now-previous<(busy?.16:.08))return;
    this.equipmentTimes.set(key,now);
    const impact=event.phase==='impact',release=event.phase==='release';
    const level=release?.035:impact?.20:.13;
    const priority=impact?2:1;
    const duration=event.kind==='extinguisher'||event.kind==='cryo_blast'?.14:.085;
    const noise=!event.worker&&(event.kind==='extinguisher'||event.kind==='cryo_blast'||event.kind==='radio'||event.kind==='satellite_wave');
    const source=noise?ctx.createBufferSource():ctx.createOscillator();
    if('buffer' in source)source.buffer=this.noiseBuffer(ctx);
    else {
      source.type=event.kind==='tesla_bolt'?'triangle':'sine';
      const frequency=event.worker?510:event.kind==='cone_trap'?135:event.kind==='emf_beam'?175:event.kind==='tesla_bolt'?340:event.kind==='shout_shockwave'?100:740;
      source.frequency.setValueAtTime(frequency,now);source.frequency.exponentialRampToValueAtTime(Math.max(60,frequency*(release?.8:impact?.55:.75)),now+duration);
    }
    const gain=ctx.createGain();gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(level,now+.006);gain.gain.setValueAtTime(level,now+.018);gain.gain.exponentialRampToValueAtTime(.001,now+duration);
    if(!this.track(source,gain,priority))return;
    if(noise&&typeof ctx.createBiquadFilter==='function') {
      const filter=ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.value=event.kind==='cryo_blast'?2800:event.kind==='extinguisher'?1700:1100;filter.Q.value=.7;
      source.connect(filter);filter.connect(gain);
      this.connectSfx(source,gain,{x:event.x,y:event.y},listener);
      this.spatialNodes.set(source,[...(this.spatialNodes.get(source)||[]),filter]);
    } else {source.connect(gain);this.connectSfx(source,gain,{x:event.x,y:event.y},listener);}
    source.start(now);source.stop(now+duration);
  }
  playDecisionCue(kind:'evidence'|'record'|'hold'|'exclude'):void {
    const ctx=this.ensureBuses();if(!ctx)return;
    const source=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime;
    source.type='sine';source.frequency.setValueAtTime(kind==='evidence'?420:kind==='record'?260:kind==='hold'?160:110,now);
    gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(.065,now+.015);gain.gain.exponentialRampToValueAtTime(.001,now+.18);
    if(!this.track(source,gain,3))return;
    source.connect(gain);gain.connect(this.buses!.SFX);source.start(now);source.stop(now+.18);
  }
  private fail(message: string) {
    this.failures.push(message); if (this.failures.length > 32) this.failures.shift();
    console.warn('[SURVIVORS audio]', message);
  }
  private decodeAsset(ctx: AudioContext, asset: SurvivorsAudioAsset): Promise<AudioBuffer> {
    if (!this.buffers.has(asset.uri!)) this.buffers.set(asset.uri!, fetch(asset.uri!).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${asset.id}`);
      return r.arrayBuffer();
    }).then(bytes => ctx.decodeAudioData(bytes)));
    return this.buffers.get(asset.uri!)!;
  }
  async preloadApproved(assets: readonly SurvivorsAudioAsset[]): Promise<boolean> {
    if (!assets.length || assets.some(a => a.status !== 'PRODUCTION_APPROVED' || !a.uri || !a.rights || !a.sha256)) return false;
    const ctx = this.getContext(); if (!ctx) return false;
    try { await Promise.all(assets.map(a => this.decodeAsset(ctx, a))); return true; }
    catch (err) { this.fail(String(err)); this.buffers.clear(); return false; }
  }
  async playApproved(assets: readonly SurvivorsAudioAsset[]): Promise<boolean> {
    // Synchronize approved stems using one future clock point; fail closed for missing approvals/rights.
    if (!assets.length || assets.some(a => a.status !== 'PRODUCTION_APPROVED' || !a.uri || !a.rights || !a.sha256)) return false;
    const ctx = this.ensureBuses(); if (!ctx) return false;
    const epoch = this.epoch;
    try {
      const decoded = await Promise.all(assets.map(a => this.decodeAsset(ctx, a)));
      if (epoch !== this.epoch || ctx !== this.context) return false;
      const start = ctx.currentTime + 0.05;
      assets.forEach((asset, i) => {
        const source = ctx.createBufferSource(), gain = ctx.createGain();
        source.buffer = decoded[i]!; source.loop = asset.loop;
        if (asset.bus === 'Voice') this.duckMusic(decoded[i]!.duration + 0.1);
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
    this.stopScore();
    this.epoch++;
    for (const source of this.voices.keys()) this.release(source, true);
    this.equipmentTimes.clear();this.duckUntil=0;this.dialogueFocus=false;
    if (this.musicDuck && this.context) { const gain = this.musicDuck.gain; gain.cancelScheduledValues(this.context.currentTime); gain.value = 1; }
  }
  dispose() {
    this.silence();
    const context = this.context; this.context = null;
    if (this.buses) for (const bus of Object.values(this.buses)) bus.disconnect();
    this.musicDuck?.disconnect();this.musicDuck=null;this.limiter?.disconnect();this.limiter=null;
    this.master?.disconnect(); this.master = null; this.buses = null; this.buffers.clear(); this.synthNoise = null;
    if (context) void context.close().catch(() => {});
  }
}
