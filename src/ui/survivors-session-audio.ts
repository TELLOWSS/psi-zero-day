import { cinematicLook } from './survivors-cinematic-vfx';
import { equipmentSoundSamples } from './survivors-equipment-sound';
import type { ProjectileFeedback } from '../domain/survivors-projectile-feedback';
import type { SurvivorsAudioAsset, SurvivorsAudioBus } from '../domain/survivors-audio';
import {RECORDED_SFX,RECORDED_SFX_V1,recordedSfxFamily,recordedEquipmentCue,type RecordedSfxId,type RecordedSfxVersion} from '../app/survivors-sfx-assets';
import {RecordedSfxVariants} from '../app/survivors-sfx-variants';
import {DRONE_V3_ASSETS,droneV3Asset,type DroneV3Id} from '../app/survivors-drone-sfx-v3';
import type {InspectionPhase} from './survivors-inspection-flight';
// Recorded score/cues and procedural effects share one session-owned audio lifecycle.
export class SurvivorsSessionAudio {
  private context: AudioContext | null = null;
  private muted = false;
  private synthNoise: AudioBuffer | null = null;
  private master: GainNode | null = null;
  private musicDuck: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private duckUntil = 0;
  private dialogueFocus = false;
  private equipmentBuffers = new Map<string, AudioBuffer>();
  private equipmentTimes = new Map<string,number>();
  private recordedFailures=new Set<string>();
  private droneV3Failures=new Set<DroneV3Id>();
  private droneSequence=0;
  private hunterSequence=0;
  private recordedVersion:RecordedSfxVersion=import.meta.env.VITE_SURVIVORS_SFX_VERSION==='v1'?'v1':'v2';
  private recordedVariants=new RecordedSfxVariants();
  private securedBoss:string|undefined;
  private encounterRun:object|undefined;
  private inspectionPhase:InspectionPhase|undefined;
  private inspectionRun:object|undefined;
  private buses: Record<SurvivorsAudioBus, GainNode> | null = null;
  private volumes: Partial<Record<SurvivorsAudioBus | 'Master', number>> = {};
  private buffers = new Map<string, Promise<AudioBuffer>>();
  readonly failures: string[] = [];
  private epoch = 0;
  private scoreId: string | null = null;
  private scoreUri: string | null = null;
  private scoreEpoch = 0;
  private scoreTimer: ReturnType<typeof setTimeout> | null = null;
  private scoreNodes = new Map<AudioBufferSourceNode, GainNode>();
  async preloadEquipmentRecordings():Promise<boolean> {
    const ctx=this.ensureBuses();if(!ctx)return false;
    const selected=this.recordedVersion==='v1'?RECORDED_SFX_V1:RECORDED_SFX;
    const legacy=selected.filter(asset=>!asset.id.startsWith('drone_'));
    const legacyResults=await Promise.all(legacy.map(async asset=>{
      try{await this.decodeAsset(ctx,asset);return true;}
      catch(error){if(asset.uri)this.recordedFailures.add(asset.uri);this.fail(String(error));return false;}
    }));
    const droneResults=await Promise.all(DRONE_V3_ASSETS.map(async asset=>{
      const id=asset.id.replace('drone_v3.','') as DroneV3Id;
      try{await this.decodeAsset(ctx,asset);return true;}
      catch(error){this.droneV3Failures.add(id);this.fail(String(error));return false;}
    }));
    return legacyResults.every(Boolean)&&droneResults.every(Boolean);
  }
  setRecordedSfxVersion(version:RecordedSfxVersion):void {
    if(version===this.recordedVersion)return;
    this.silence();this.recordedVersion=version;this.recordedVariants=new RecordedSfxVariants();this.recordedFailures.clear();
  }
  /** Securing the designated incident is separate from arbitrary heavy target contacts. */
  playEncounterPhase(encounter:{bossId:string;phase:string}|undefined,playing:boolean,run:object):boolean {
    if(run!==this.encounterRun){this.encounterRun=run;this.securedBoss=undefined;}
    if(!playing||encounter?.phase!=='secured'||this.securedBoss===encounter.bossId)return false;
    this.securedBoss=encounter.bossId;
    const accepted=this.playRecordedEffect('incident_secured');if(accepted)this.duckMusic(1.1);return accepted;
  }
  /** One session-owned recording per event; bounded, cached and cancelled on pause/dispose. */
  playRecordedEffect(id:RecordedSfxId,position?:{x:number;y:number},listener?:{x:number;y:number},busy=false,rate=1,variant=''):boolean {
    const family=recordedSfxFamily(id,this.recordedVersion).filter(asset=>asset.uri&&!this.recordedFailures.has(asset.uri));
    if(!family.length)return false;
    const ctx=this.ensureBuses();if(!ctx||this.muted)return false;
    // Multiple drone types share a cadence so upgrades cannot stack repetitive launches.
    const drone=['drone_release','drone_premium_release','drone_hunter_burst'].includes(id);
    const now=ctx.currentTime,key=drone?'recorded:drone-fire':'recorded:'+id+':'+variant,previous=this.equipmentTimes.get(key);
    const interval=drone?(busy?.30:.22):busy?.16:['drone_launch','drone_dock'].includes(id)?.35:['boss_alert','incident_secured'].includes(id)?.5:.10;
    if(previous!==undefined&&now-previous<interval)return true;
    const asset=family[this.recordedVariants.next(id,family.length)]!;
    if(!asset.uri||!asset.sha256||!asset.rights)return false;
    this.equipmentTimes.set(key,now);
    const epoch=this.epoch;
    void this.decodeAsset(ctx,asset).then(buffer=>{
      if(epoch!==this.epoch||this.muted||ctx!==this.context||ctx.currentTime-now>.2)return;
      const source=ctx.createBufferSource(),gain=ctx.createGain(),start=ctx.currentTime+.003;
      const ui=id.startsWith('ui_'),distance=position&&listener?Math.hypot(position.x-listener.x,position.y-listener.y):0;
      const sustained=drone&&previous!==undefined&&now-previous<.8;
      const level=(drone?(sustained?.22:.30):ui?.45:id==='pickup'?.28:.6)/(1+distance/650);
      const playbackRate=Math.max(.75,Math.min(1.25,Number.isFinite(rate)?rate:1));
      const duration=Math.min(buffer.duration/playbackRate,drone?(id==='drone_hunter_burst'?.16:.12):Infinity);
      source.buffer=buffer;if(source.playbackRate)source.playbackRate.value=playbackRate;
      gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(level,start+.003);
      gain.gain.setValueAtTime(level,start+Math.max(.004,duration-(drone?.04:.025)));gain.gain.linearRampToValueAtTime(0,start+duration);
      if(!this.track(source,gain,ui?4:['boss_alert','incident_secured','player_hit'].includes(id)?3:id==='pickup'?0:2))return;
      source.connect(gain);this.connectSfx(source,gain,position,listener);source.start(start);source.stop(start+duration);
    }).catch(error=>{if(epoch===this.epoch){this.recordedFailures.add(asset.uri!);this.buffers.delete(asset.uri!);this.fail(String(error));}});
    return true;
  }
  /** Director-approved Premium Drone SFX V3 runtime; V2 drone family is archive-only. */
  playDroneV3(id:DroneV3Id,position?:{x:number;y:number},listener?:{x:number;y:number},busy=false,rate=1):boolean {
    if(this.droneV3Failures.has(id))return false;
    const asset=droneV3Asset(id),ctx=this.ensureBuses();
    if(!ctx||this.muted||!asset.uri||!asset.sha256||!asset.rights)return false;
    const family=id==='hunter_a'||id==='hunter_b'?'hunter':id==='base_release'||id==='premium_release'?'release':id;
    const now=ctx.currentTime,key='drone-v3:'+family,previous=this.equipmentTimes.get(key);
    const minimum=(family==='launch'||family==='dock') ? .35 : busy ? .16 : .09;
    if(previous!==undefined&&now-previous<minimum)return true;
    this.equipmentTimes.set(key,now);
    const epoch=this.epoch;
    void this.decodeAsset(ctx,asset).then(buffer=>{
      if(epoch!==this.epoch||this.muted||ctx!==this.context||ctx.currentTime-now>.2)return;
      const source=ctx.createBufferSource(),gain=ctx.createGain(),start=ctx.currentTime+.003;
      const distance=position&&listener?Math.hypot(position.x-listener.x,position.y-listener.y):0;
      const baseLevel=(family==='launch'||family==='dock') ? .54 : family==='hunter' ? .60 : id==='premium_release' ? .62 : .58;
      const level=baseLevel/(1+distance/650);
      const playbackRate=Math.max(.94,Math.min(1.06,Number.isFinite(rate)?rate:1));
      const duration=buffer.duration/playbackRate;
      source.buffer=buffer;if(source.playbackRate)source.playbackRate.value=playbackRate;
      gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(level,start+.003);
      gain.gain.setValueAtTime(level,start+Math.max(.004,duration-.018));gain.gain.linearRampToValueAtTime(0,start+duration);
      if(!this.track(source,gain,family==='launch'||family==='dock'?2:1))return;
      source.connect(gain);this.connectSfx(source,gain,position,listener);source.start(start);source.stop(start+duration);
    }).catch(error=>{
      if(epoch===this.epoch){this.droneV3Failures.add(id);this.buffers.delete(asset.uri!);this.fail(String(error));}
    });
    return true;
  }
  playInspectionPhase(phase:InspectionPhase|undefined,playing:boolean,run?:object):void {
    if(!playing)return;
    if(run&&run!==this.inspectionRun){this.inspectionRun=run;this.inspectionPhase=undefined;}
    const previous=this.inspectionPhase;this.inspectionPhase=phase;
    if(phase===previous||!phase)return;
    if(phase==='launching'||phase==='inspecting'&&previous==='docked')this.playDroneV3('launch');
    else if(phase==='docked'&&previous&&previous!=='docked')this.playDroneV3('dock');
  }
  /** Explicit Director-authorized audition path; never promotes candidate approval. */
  async auditionScore(asset: SurvivorsAudioAsset, cueSeconds?: number): Promise<boolean> {
    if (asset.bus !== 'Music' || asset.status !== 'CANDIDATE' || !asset.uri || !asset.rights || !asset.sha256) return false;
    if (this.scoreId === asset.id && asset.loop) return true;
    const ctx = this.ensureBuses(); if (!ctx) return false;
    if(this.scoreUri&&this.scoreUri!==asset.uri)this.buffers.delete(this.scoreUri);
    this.scoreUri=asset.uri;
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
      const overlap = asset.loop ? Math.min(0.8, duration / 4) : 0.015;
      const schedule = (start: number) => {
        if (token !== this.scoreEpoch) return;
        const source = ctx.createBufferSource(), gain = ctx.createGain();
        source.buffer = buffer; source.connect(gain); gain.connect(this.buses!.Music);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.95, start + overlap);
        gain.gain.setValueAtTime(0.95, start + duration - (asset.loop?overlap:Math.min(.25,duration/4)));
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
    if(this.scoreUri)this.buffers.delete(this.scoreUri);
    this.scoreUri=null;
    if (this.scoreTimer) clearTimeout(this.scoreTimer);
    this.scoreTimer = null;
    for (const [source, gain] of this.scoreNodes) { source.onended = null; try { source.stop(); } catch { /* ended */ } source.disconnect(); gain.disconnect(); }
    this.scoreNodes.clear();
  }
  async preloadCandidates(assets:readonly SurvivorsAudioAsset[]):Promise<boolean> {
    if(assets.some(a=>a.status!=='CANDIDATE'||!a.uri||!a.rights||!a.sha256))return false;
    const ctx=this.getContext();if(!ctx)return false;
    try {await Promise.all(assets.map(a=>this.decodeAsset(ctx,a)));return true;}
    catch(err){this.fail(String(err));return false;}
  }
  /** Event cues share cached recordings without replacing the adaptive score. */
  async auditionCue(asset:SurvivorsAudioAsset,cueSeconds?:number):Promise<boolean> {
    if(asset.status!=='CANDIDATE'||asset.loop||asset.bus!=='Music'||!asset.uri||!asset.rights||!asset.sha256)return false;
    if(cueSeconds!==undefined&&(!Number.isFinite(cueSeconds)||cueSeconds<=0))return false;
    const ctx=this.ensureBuses();if(!ctx)return false;
    const epoch=this.epoch;
    try {
      const buffer=await this.decodeAsset(ctx,asset);
      if(epoch!==this.epoch||this.muted||ctx!==this.context)return false;
      const source=ctx.createBufferSource(),gain=ctx.createGain(),start=ctx.currentTime+.02;
      const duration=Math.min(buffer.duration,cueSeconds??buffer.duration);
      source.buffer=buffer;source.connect(gain);gain.connect(this.buses!.SFX);
      gain.gain.setValueAtTime(.55,start);
      gain.gain.setValueAtTime(.55,start+Math.max(0,duration-.2));
      gain.gain.linearRampToValueAtTime(0,start+duration);
      if(!this.track(source,gain,4))return false;
      this.duckMusic(Math.min(3,duration));source.start(start,0,duration);return true;
    }catch(err){this.buffers.delete(asset.uri);this.fail(String(err));return false;}
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
      this.master.gain.value = this.volumes.Master ?? 1;
      if(typeof ctx.createDynamicsCompressor==='function') {
        this.limiter=ctx.createDynamicsCompressor();
        this.limiter.threshold.value=-12;this.limiter.knee.value=12;this.limiter.ratio.value=4;
        this.limiter.attack.value=.003;this.limiter.release.value=.18;
        this.master.connect(this.limiter);this.limiter.connect(ctx.destination);
      } else this.master.connect(ctx.destination);
      this.musicDuck=ctx.createGain();this.musicDuck.connect(this.master);
      this.buses = Object.fromEntries(['Music', 'SFX', 'Voice', 'Ambience'].map(name => {
        const gain = ctx.createGain(); gain.gain.value = this.volumes[name as SurvivorsAudioBus] ?? 1; gain.connect(name==='Music'?this.musicDuck!:this.master!); return [name, gain];
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
    this.volumes[bus] = Math.max(0, Math.min(1, value));
    const gain = bus === 'Master' ? this.master : this.buses?.[bus];
    if (gain) gain.gain.value = this.volumes[bus]!;
  }
  sfxDestination(): AudioNode { this.ensureBuses(); return this.buses!.SFX; }
  setDialogueFocus(active:boolean) {
    this.dialogueFocus=active;const ctx=this.ensureBuses();if(!ctx)return;
    const gain=this.musicDuck!.gain;gain.cancelScheduledValues(ctx.currentTime);
    gain.setValueAtTime(gain.value,ctx.currentTime);gain.linearRampToValueAtTime(active?.38:1,ctx.currentTime+.12);
    if(!active)this.duckUntil=0;
  }
  duckMusic(holdSeconds = 0.6) {
    const ctx = this.ensureBuses(); if (!ctx || this.dialogueFocus) return;
    const now=ctx.currentTime,gain=this.musicDuck!.gain;
    this.duckUntil=Math.max(this.duckUntil,now+Math.max(.1,holdSeconds));
    gain.cancelScheduledValues(now);gain.setValueAtTime(gain.value,now);
    gain.linearRampToValueAtTime(.65,now+.035);
    gain.setValueAtTime(.65,this.duckUntil);gain.linearRampToValueAtTime(1,this.duckUntil+.18);
  }
  /** Equipment material sound remains procedural until the final recording gate. */
  playEquipmentFeedback(event:ProjectileFeedback,listener:{x:number;y:number},busy=false,equipped:readonly string[]=[]):void {
    if(event.blocked){
      this.playEquipmentFeedback({...event,blocked:false,critical:false,kind:'emf_beam',phase:'release'},listener,busy,equipped);
      return;
    }
    if(!event.worker&&event.phase==='launch'&&(event.kind==='drone_laser'||event.kind==='hunter_beam')){
      const premium=equipped.some(id=>['relay_core','precision_link','sync_gauntlet'].includes(id));
      const id:DroneV3Id=event.kind==='hunter_beam'
        ? (this.hunterSequence++%2===0?'hunter_a':'hunter_b')
        : premium?'premium_release':'base_release';
      const rates=[.985,1,1.015] as const;
      const rate=event.kind==='hunter_beam'?1:rates[this.droneSequence++%rates.length]!;
      if(this.playDroneV3(id,{x:event.x,y:event.y},listener,busy,rate))return;
    }
    const recorded=recordedEquipmentCue(event,equipped);
    const rate=event.kind==='satellite_wave'?.8:1;
    if(recorded&&this.playRecordedEffect(recorded,{x:event.x,y:event.y},listener,busy,rate,event.kind))return;
    if(busy&&event.phase==='release')return;
    const ctx=this.ensureBuses();if(!ctx)return;
    const key=event.kind+':'+event.phase,now=ctx.currentTime,previous=this.equipmentTimes.get(key);
    if(previous!==undefined&&now-previous<(busy?.16:.08))return;
    this.equipmentTimes.set(key,now);
    const impact=event.phase==='impact',release=event.phase==='release';
    const level=event.worker?.13:release?.065:impact?.42:.32;
    const priority=impact?2:1;
    const look=cinematicLook(event.kind,5,equipped);
    const signature=look.premium&&!event.worker?look.palette:'base';
    const bufferKey=event.kind+':'+event.phase+':'+Boolean(event.worker)+':'+signature+':'+event.actorKind;
    let buffer=this.equipmentBuffers.get(bufferKey);
    if(!buffer) {
      const samples=equipmentSoundSamples(event.kind,event.phase,Boolean(event.worker),ctx.sampleRate,equipped,event.actorKind);
      buffer=ctx.createBuffer(1,samples.length,ctx.sampleRate);
      buffer.getChannelData(0).set(samples);this.equipmentBuffers.set(bufferKey,buffer);
    }
    const duration=buffer.duration,source=ctx.createBufferSource();source.buffer=buffer;
    const distance=Math.hypot(event.x-listener.x,event.y-listener.y);
    const audibleLevel=level/(1+distance/650);
    const gain=ctx.createGain();gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(audibleLevel,now+.006);gain.gain.setValueAtTime(audibleLevel,now+.018);gain.gain.exponentialRampToValueAtTime(.001,now+duration);
    if(!this.track(source,gain,priority))return;
    source.connect(gain);this.connectSfx(source,gain,{x:event.x,y:event.y},listener);
    source.start(now);source.stop(now+duration);
  }
  /** Quiet boot contact supports grounded gait without masking alarms or speech. */
  playFootstep(running:boolean):void {
    const ctx=this.ensureBuses();if(!ctx)return;
    const now=ctx.currentTime,previous=this.equipmentTimes.get('footstep');
    if(previous!==undefined&&now-previous<.16)return;
    this.equipmentTimes.set('footstep',now);
    const source=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
    source.buffer=this.noiseBuffer(ctx);filter.type='lowpass';filter.frequency.value=running?1050:750;
    gain.gain.setValueAtTime(running?.035:.023,now);gain.gain.exponentialRampToValueAtTime(.001,now+.075);
    if(!this.track(source,gain,0)){filter.disconnect();return;}
    source.connect(filter);filter.connect(gain);gain.connect(this.buses!.SFX);
    this.spatialNodes.set(source,[filter]);
    source.start(now);source.stop(now+.08);
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
    this.equipmentTimes.clear();this.droneSequence=0;this.hunterSequence=0;this.duckUntil=0;this.dialogueFocus=false;
    if (this.musicDuck && this.context) { const gain = this.musicDuck.gain; gain.cancelScheduledValues(this.context.currentTime); gain.value = 1; }
  }
  dispose() {
    this.silence();
    const context = this.context; this.context = null;
    if (this.buses) for (const bus of Object.values(this.buses)) bus.disconnect();
    this.musicDuck?.disconnect();this.musicDuck=null;this.limiter?.disconnect();this.limiter=null;
    this.master?.disconnect(); this.master = null; this.buses = null; this.buffers.clear();this.recordedFailures.clear();this.droneV3Failures.clear();this.recordedVariants=new RecordedSfxVariants();this.securedBoss=undefined;this.encounterRun=undefined;this.inspectionPhase=undefined;this.inspectionRun=undefined; this.synthNoise = null;
    if (context) void context.close().catch(() => {});
  }
}
