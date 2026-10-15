import type {DefenseCombatShot,DefenseTowerId} from '../domain/defense';

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
 private context:AudioContext|null=null;
 private bus:DynamicsCompressorNode|null=null;
 private buffers=new Map<string,AudioBuffer>();
 private sources=new Set<AudioBufferSourceNode>();
 private last=new Map<DefenseTowerId,number>();
 private loading=false;
 private generation=0;
 private report(detail:Record<string,unknown>){window.dispatchEvent(new CustomEvent(DEFENSE_COMBAT_SOUND_EVENT,{detail}));}
 arm(){
  if(!window.AudioContext)return;
  if(!this.context){
   this.context=new AudioContext();this.bus=this.context.createDynamicsCompressor();
   this.bus.threshold.value=-16;this.bus.knee.value=12;this.bus.ratio.value=5;
   this.bus.attack.value=.003;this.bus.release.value=.12;this.bus.connect(this.context.destination);
  }
  if(this.context.state==='suspended')void this.context.resume().catch(()=>{});
  if(this.loading)return;this.loading=true;
  const context=this.context,generation=this.generation;
  for(const file of new Set(Object.values(defenseCombatSoundProfiles).map(p=>p.file))){
   void fetch(`/assets/defense/audio/g8a/${file}`).then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r.arrayBuffer();})
    .then(bytes=>context.decodeAudioData(bytes)).then(buffer=>{
     if(generation!==this.generation)return;this.buffers.set(file,buffer);this.report({phase:'decoded',file,duration:buffer.duration});
    }).catch(()=>{if(generation===this.generation)this.report({phase:'unavailable',file});});
  }
 }
 play(shot:DefenseCombatShot,pan:number){
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
 stop(){const count=this.sources.size;for(const source of this.sources){try{source.stop();}catch{/* already ended */}}this.sources.clear();this.last.clear();if(count)this.report({phase:'stopped',stopped:count,voices:0});}
 dispose(){this.stop();this.generation++;this.buffers.clear();if(this.context)void this.context.close();this.context=null;this.bus=null;}
}
