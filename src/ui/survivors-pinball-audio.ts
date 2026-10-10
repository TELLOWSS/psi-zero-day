import {PINBALL_SUCCESS_CUES,PINBALL_HARBOR_SUCCESS_CUE,type PinballCueNote} from '../domain/survivors-pinball-cues';
import {PINBALL_PHASE1_ASSETS,PINBALL_PHASE1_ROOT,PINBALL_PHASE2_ASSETS,PINBALL_PHASE2_ROOT} from '../domain/survivors-pinball-audio-assets';
import type {PinballTableId} from '../domain/survivors-pinball-tables';
import type {SiteActionKind} from '../engine/survivors-pinball-site';
export const PINBALL_AUDIO_FILES={
 metal:'pinball_bumper_v01.mp3',flipper:'pinball_flipper_up_v01.mp3',rubber:'pinball_rubber_v01.mp3',crane:'pinball_crane_reward_v01.mp3',
 theme:'pinball_theme_v01.mp3',shift:'after-the-shift-v01.mp3',
} as const;
export type PinballSound='metal'|'flipper'|'rubber'|'crane'|'perfect'|'shot'|'payout';
export type PinballMusic='theme'|'shift';
/** All files decode before play. Source MP3s are preserved; processing is not a new high-resolution master. */
export class PinballAudio {
 private context=new AudioContext();private buffers=new Map<string,AudioBuffer>();private voices=new Set<AudioBufferSourceNode>();
 private priorities=new Map<AudioBufferSourceNode,number>();private musicGain=this.context.createGain();private master=this.context.createDynamicsCompressor();
 private musicSource:AudioBufferSourceNode|null=null;private offset=0;private started=0;private enabled=false;private disposed=false;
 private selected:PinballMusic='shift';private lastCue=-10;private last=new Map<string,number>();private variants=new Map<PinballSound,number>();
 async load(){const sources=[...Object.entries(PINBALL_AUDIO_FILES).map(([key,file])=>[key,'/assets/survivors/pinball/audio-candidates-v1/'+file]),...Object.entries(PINBALL_PHASE1_ASSETS).filter(([key])=>!(key in PINBALL_PHASE2_ASSETS)).map(([key,file])=>[key,PINBALL_PHASE1_ROOT+file]),...Object.entries(PINBALL_PHASE2_ASSETS).map(([key,file])=>[key,PINBALL_PHASE2_ROOT+file])];
  await Promise.all(sources.map(async([key,url])=>{if(!key||!url)return;const response=await fetch(url);if(!response.ok)throw Error('Pinball audio: '+url);
   const buffer=await this.context.decodeAudioData(await response.arrayBuffer());if(this.disposed)return;const music=key==='theme'||key==='shift';
   // Short attack fade preserves contact timing; longer release reduces abrupt candidate endings.
   const attack=Math.max(1,Math.floor(buffer.sampleRate*(music?.012:.003))),release=Math.max(1,Math.floor(buffer.sampleRate*(music?.012:.025)));let peak=0,energy=0;
   for(let c=0;c<buffer.numberOfChannels;c++){const data=buffer.getChannelData(c);let dc=0;if(!music){for(const value of data)dc+=value;dc/=data.length;}
    for(let i=0;i<data.length;i++){const value=((data[i]??0)-dc)*Math.min(1,i/attack,(data.length-1-i)/release);data[i]=value;peak=Math.max(peak,Math.abs(value));energy+=value*value;}}
   const rms=Math.sqrt(energy/(buffer.length*buffer.numberOfChannels)),target=music?.12:key==='crane'?.10:.075;
   const gain=Math.min(target/Math.max(rms,.0001),.7/Math.max(peak,.0001),(key in PINBALL_PHASE1_ASSETS||key in PINBALL_PHASE2_ASSETS)?4:2);
   for(let c=0;c<buffer.numberOfChannels;c++){const data=buffer.getChannelData(c);for(let i=0;i<data.length;i++)data[i]=(data[i]??0)*gain;}this.buffers.set(key,buffer);
  }));if(this.disposed)return;this.master.threshold.value=-8;this.master.knee.value=6;this.master.ratio.value=8;this.master.attack.value=.003;this.master.release.value=.15;this.master.connect(this.context.destination);this.musicGain.gain.value=.23;this.musicGain.connect(this.master);
 }
 async unlock(){if(!this.disposed)await this.context.resume().catch(()=>{});}
 setMusic(value:PinballMusic){if(value===this.selected)return;this.stopMusic();this.offset=0;this.selected=value;if(this.enabled)this.startMusic();}
 setActive(value:boolean){if(this.disposed||this.enabled===value)return;this.enabled=value;if(value)this.startMusic();else{this.stopMusic();for(const voice of this.voices)voice.stop();this.voices.clear();this.priorities.clear();}}
 private startMusic(){const buffer=this.buffers.get(this.selected);if(!buffer||this.musicSource)return;const source=this.context.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(this.musicGain);this.musicGain.gain.cancelScheduledValues(this.context.currentTime);this.musicGain.gain.setValueAtTime(.23,this.context.currentTime);this.started=this.context.currentTime;source.start(0,this.offset%buffer.duration);this.musicSource=source;}
 private stopMusic(){if(!this.musicSource)return;this.offset+=this.context.currentTime-this.started;this.musicSource.stop();this.musicSource.disconnect();this.musicSource=null;}
 play(kind:PinballSound,x=300){if(!this.enabled||this.disposed)return;const now=this.context.currentTime,throttle=kind==='flipper'?(x<300?'flipper_left':'flipper_right'):kind;if(now-(this.last.get(throttle)??-10)<(kind==='flipper'?.075:.04))return;this.last.set(throttle,now);
  if(kind==='payout')this.stopMusic();const variant=this.variants.get(kind)??0;this.variants.set(kind,variant+1);
  const sample=kind==='flipper'?(x<300?'left':'right'):kind==='metal'?(variant%2?'metal2':'metal1'):kind==='rubber'?(variant%2?'rubber2':'rubber1'):kind==='perfect'?(variant%2?'perfect2':'perfect1'):kind;
  this.schedule({sample,at:kind==='shot'?.018:0,rate:1,gain:kind==='payout'?.6:kind==='crane'?.65:kind==='flipper'?.45:kind==='perfect'?.65:kind==='shot'?.45:.55,pan:0,cutoff:16000},x,now,kind==='payout'||kind==='crane'||kind==='perfect'||kind==='shot'?2:0);
  if(kind==='crane')this.duck(now,2);
 }
 playSite(table:PinballTableId,kind:SiteActionKind,x=300){if(!this.enabled||this.disposed)return;const now=this.context.currentTime;
  if(kind==='success'){if(now-this.lastCue<.25)return;this.lastCue=now;const cue=table==='cargo'?PINBALL_HARBOR_SUCCESS_CUE:PINBALL_SUCCESS_CUES[table];for(const note of cue)this.schedule(note,x,now,2);this.duck(now,table==='cargo'?3.7:2.6);
  }else {this.schedule({sample:kind==='capture'?'lock':kind==='release'?'rubber1':'impact',at:0,rate:1,gain:kind==='impact'?.6:.4,pan:0,cutoff:12000},x,now,1);if(kind==='impact')this.schedule({sample:'debris',at:.12,rate:1,gain:.22,pan:0,cutoff:9000},x,now,1);}
 }
 private duck(now:number,duration:number){const g=this.musicGain.gain;g.cancelScheduledValues(now);g.setValueAtTime(g.value,now);g.linearRampToValueAtTime(.12,now+.04);g.linearRampToValueAtTime(.23,now+duration);}
 private schedule(note:PinballCueNote,x:number,now:number,priority:number){const buffer=this.buffers.get(note.sample);if(!buffer)return;
  // Contact chatter cannot steal scheduled success notes. Every path shares the same bounded voice pool.
  if(this.voices.size>=16){const victim=[...this.voices].find(v=>(this.priorities.get(v)??0)<priority)??[...this.voices].find(v=>(this.priorities.get(v)??0)===priority);if(!victim)return;victim.stop();this.voices.delete(victim);this.priorities.delete(victim);}
  const source=this.context.createBufferSource(),gain=this.context.createGain(),pan=this.context.createStereoPanner(),filter=this.context.createBiquadFilter();source.buffer=buffer;source.playbackRate.value=note.rate;filter.type='lowpass';filter.frequency.value=note.cutoff;
  const start=now+note.at,duration=Math.min(note.sample==='motorMove'?1.3:2,buffer.duration/note.rate);gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(note.gain,start+.003);gain.gain.setValueAtTime(note.gain,start+Math.max(.003,duration-.025));gain.gain.linearRampToValueAtTime(0,start+duration);
  pan.pan.value=Math.max(-.6,Math.min(.6,(x-300)/550+note.pan));source.connect(filter);filter.connect(gain);gain.connect(pan);pan.connect(this.master);this.voices.add(source);this.priorities.set(source,priority);
  source.onended=()=>{this.voices.delete(source);this.priorities.delete(source);source.disconnect();filter.disconnect();gain.disconnect();pan.disconnect();};source.start(start);source.stop(start+duration);
 }
 dispose(){this.setActive(false);this.disposed=true;this.musicGain.disconnect();this.master.disconnect();void this.context.close();}
}
