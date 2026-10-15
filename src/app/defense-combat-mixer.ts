import type {DefenseCombatShot,DefenseTowerId} from '../domain/defense';
import supplied from '../../content/defense/guard-audio-v1.json';
import {guardSoundEnvelope} from './guard-combat-presentation';

export const DEFENSE_COMBAT_VOICES=8;
export const DEFENSE_COMBAT_SOUND_EVENT='psi:defense-combat-sound';
export const defenseCombatSoundProfiles:Record<DefenseTowerId,{file:string;rate:number;cutoff:number;gain:number}>={
 PULSE:{file:'control-resolve.ogg',rate:1.3,cutoff:6500,gain:.16},
 BURST:{file:'area-resolve.ogg',rate:.85,cutoff:2800,gain:.20},
 CONTROL:{file:'control-barrier-clack.ogg',rate:.85,cutoff:1800,gain:.16},
 SENSOR:{file:'control-resolve.ogg',rate:1.8,cutoff:8500,gain:.12},
};

/** Bounded sample playback, independent of gameplay. No oscillator synthesis. */
export class DefenseCombatMixer {
 constructor(private readonly useSupplied=false){}
 private context:AudioContext|null=null;
 private bus:DynamicsCompressorNode|null=null;
 private combatBus:GainNode|null=null;
 private buffers=new Map<string,AudioBuffer>();
 private sources=new Set<AudioBufferSourceNode>();
 private last=new Map<string,number>();
 private loading=false;
 private generation=0;
 private onset=new Map<string,number>();
 private normalization=new Map<string,number>();
 private priority=new Map<AudioBufferSourceNode,number>();
 private report(detail:Record<string,unknown>){window.dispatchEvent(new CustomEvent(DEFENSE_COMBAT_SOUND_EVENT,{detail}));}
 arm(){
  if(!window.AudioContext)return;
  if(!this.context){
   this.context=new AudioContext();this.bus=this.context.createDynamicsCompressor();
   this.combatBus=this.context.createGain();this.combatBus.connect(this.bus);
   this.bus.threshold.value=-16;this.bus.knee.value=12;this.bus.ratio.value=5;
   this.bus.attack.value=this.useSupplied?.001:.003;this.bus.release.value=.12;
   if(this.useSupplied){
    this.bus.threshold.value=-18;this.bus.ratio.value=8;
    const limiter=this.context.createWaveShaper(),curve=new Float32Array(2049);for(let i=0;i<curve.length;i++)curve[i]=Math.max(-.9,Math.min(.9,i/(curve.length-1)*2-1));limiter.curve=curve;limiter.oversample='2x';this.bus.connect(limiter).connect(this.context.destination);
   }else this.bus.connect(this.context.destination);
  }
  if(this.context.state==='suspended')void this.context.resume().catch(()=>{});
  if(this.loading)return;this.loading=true;
  const context=this.context,generation=this.generation;
  const files=this.useSupplied?supplied.assets.filter(a=>a.role==='ONE_SHOT_SFX').map(a=>a.id):[...new Set(Object.values(defenseCombatSoundProfiles).map(p=>p.file))];
  for(const file of files){
   const uri=this.useSupplied?supplied.assets.find(a=>a.id===file)!.uri:`assets/defense/audio/g8a/${file}`;
   void fetch('/'+uri).then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r.arrayBuffer();})
    .then(bytes=>context.decodeAudioData(bytes)).then(buffer=>{
     if(generation!==this.generation)return;this.buffers.set(file,buffer);
     if(this.useSupplied){const data=buffer.getChannelData(0);let first=0;while(first<Math.min(data.length,buffer.sampleRate)&&Math.abs(data[first]!)<.003)first++;const offset=Math.max(0,first/buffer.sampleRate-.008);this.onset.set(file,offset);let power=0;const n=Math.min(data.length-first,Math.floor(buffer.sampleRate*.25));for(let i=0;i<n;i++)power+=data[first+i]!**2;this.normalization.set(file,Math.min(4,Math.max(.4,.12/Math.max(.02,Math.sqrt(power/Math.max(1,n))))));}
     this.report({phase:'decoded',file,duration:buffer.duration,uri});
    }).catch(()=>{if(generation===this.generation)this.report({phase:'unavailable',file});});
  }
 }
 play(shot:DefenseCombatShot,pan:number){
  if(this.useSupplied){this.playSuppliedShot(shot,pan);return;}
  const ctx=this.context,p=defenseCombatSoundProfiles[shot.towerId],buffer=this.buffers.get(p.file);
  if(!ctx||ctx.state!=='running'||!buffer||!this.bus)return;
  const now=ctx.currentTime;
  if(now-(this.last.get(shot.towerId)??-99)<.075)return;
  this.last.set(shot.towerId,now);
  // Attack and contact share one budget, even when contact is scheduled ahead.
  for(const impact of [false,true]){
   if(this.sources.size>=DEFENSE_COMBAT_VOICES)break;
   const source=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter(),stereo=ctx.createStereoPanner();
   const rate=p.rate*(shot.levelId==='L3B'?1.08:shot.levelId==='L3A'?.94:1);
   const start=now+(impact?.10:0),duration=Math.min(buffer.duration,impact?.22:.09);
   source.buffer=buffer;source.playbackRate.value=rate;filter.type='lowpass';filter.frequency.value=p.cutoff;
   stereo.pan.value=Math.max(-.6,Math.min(.6,pan));
   gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(p.gain*(impact?1:.6),start+.006);
   gain.gain.exponentialRampToValueAtTime(.0001,start+duration/rate);
   source.connect(filter).connect(gain).connect(stereo).connect(this.bus);
   this.sources.add(source);
   source.onended=()=>{this.sources.delete(source);source.disconnect();filter.disconnect();gain.disconnect();stereo.disconnect();};
   source.start(start,0,duration);
   this.report({phase:impact?'impact':'launch',id:shot.id,family:shot.towerId,level:shot.levelId,voices:this.sources.size,rate,pan:stereo.pan.value});
  }
 }
 private sample(id:string,gainValue:number,delay:number,duration:number,pan:number,rank:number,rate=1,detail:Record<string,unknown>={}){
  const ctx=this.context,buffer=this.buffers.get(id);if(!ctx||ctx.state!=='running'||!buffer||!this.bus)return;
  if(this.sources.size>=DEFENSE_COMBAT_VOICES){const victim=[...this.sources].find(s=>(this.priority.get(s)??0)<rank);if(!victim)return;try{victim.stop();}catch{}this.sources.delete(victim);this.priority.delete(victim);}
  const source=ctx.createBufferSource(),gain=ctx.createGain(),stereo=ctx.createStereoPanner(),start=ctx.currentTime+delay,offset=this.onset.get(id)??0,seconds=Math.min(duration,buffer.duration-offset);
  if(seconds<=0)return;source.buffer=buffer;source.playbackRate.value=rate;stereo.pan.value=Math.max(-.6,Math.min(.6,pan));
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(gainValue*(this.normalization.get(id)??1),start+.008);gain.gain.exponentialRampToValueAtTime(.0001,start+seconds/rate);
  source.connect(gain).connect(stereo).connect(rank<9?this.combatBus!:this.bus);this.sources.add(source);this.priority.set(source,rank);
  source.onended=()=>{this.sources.delete(source);this.priority.delete(source);source.disconnect();gain.disconnect();stereo.disconnect();};source.start(start,offset,seconds);
  this.report({phase:'sample',id,source:'user-supplied-binary',voices:this.sources.size,pan:stereo.pan.value,...detail});
 }
 private playSuppliedShot(shot:DefenseCombatShot,pan:number){
  const ctx=this.context,key=shot.towerId+':'+(shot.phase??'CONTACT');if(!ctx||ctx.currentTime-(this.last.get(key)??-99)<.075)return;this.last.set(key,ctx.currentTime);
  const family=shot.towerId,envelope=guardSoundEnvelope(family,shot.levelId),rate=envelope.rate,detail={shotId:shot.id,family,level:shot.levelId,rate,attackWindow:envelope.attack,impactWindow:envelope.impact};
  if(shot.phase!=='IMPACT')this.sample(`${family}_FIRE_AUDIO`,envelope.attackGain,0,envelope.attack,pan,3,rate,detail);
  if(shot.phase!=='LAUNCH')this.sample(`${family}_IMPACT_AUDIO`,envelope.impactGain,shot.phase==='IMPACT'?0:.10,envelope.impact,pan,4,rate,detail);
  const resolved=shot.targets.filter(t=>t.resolved).length;
  if(resolved)this.sample(`${family}_RESOLVE_AUDIO`,Math.min(.42,.28+resolved*.02),shot.phase==='IMPACT'?.025:.13,resolved>=3?.45:.35,pan,resolved>=3?6:5,1,{...detail,resolved,grouped:resolved>=3});
  const primary=shot.targets[0];if(primary)this.sample(`ENEMY_${primary.enemyId}_IMPACT_AUDIO`,.20,.11,.21,pan,2,1,detail);
  if(shot.phase!=='IMPACT')this.sample(`${family}_TRAVEL_AUDIO`,.12,.025,.10,pan,1,rate,detail);
 }
 critical(id:string){const ctx=this.context,gain=this.combatBus?.gain;if(ctx&&gain){gain.cancelScheduledValues?.(ctx.currentTime);gain.setValueAtTime(.22,ctx.currentTime);gain.linearRampToValueAtTime(1,ctx.currentTime+.9);}this.sample(id,.5,0,1.2,0,9);}
 stop(){const count=this.sources.size;for(const source of this.sources){try{source.stop();}catch{/* already ended */}}this.sources.clear();this.priority.clear();this.last.clear();if(count)this.report({phase:'stopped',stopped:count,voices:0});}
 dispose(){this.stop();this.generation++;this.buffers.clear();if(this.context)void this.context.close();this.context=null;this.bus=null;this.combatBus=null;}
}
