export const PINBALL_AUDIO_FILES={
 metal:'pinball_bumper_v01.mp3',flipper:'pinball_flipper_up_v01.mp3',rubber:'pinball_rubber_v01.mp3',crane:'pinball_crane_reward_v01.mp3',
 theme:'pinball_theme_v01.mp3',shift:'after-the-shift-v01.mp3',
} as const;
export type PinballSound='metal'|'flipper'|'rubber'|'crane';
export type PinballMusic='theme'|'shift';
// Predecoded candidates; no network/decode work on a collision or paddle press.
export class PinballAudio {
 private context=new AudioContext();
 private buffers=new Map<string,AudioBuffer>();
 private voices=new Set<AudioBufferSourceNode>();
 private musicGain=this.context.createGain();
 private master=this.context.createDynamicsCompressor();
 private musicSource:AudioBufferSourceNode|null=null;
 private offset=0;private started=0;private enabled=false;private disposed=false;
 private selected:PinballMusic='shift';
 private last=new Map<PinballSound,number>();
 async load(){await Promise.all(Object.entries(PINBALL_AUDIO_FILES).map(async([key,file])=>{
  const response=await fetch('/assets/survivors/pinball/audio-candidates-v1/'+file);if(!response.ok)throw Error('Pinball audio: '+file);
  const buffer=await this.context.decodeAudioData(await response.arrayBuffer());
  if(this.disposed)return;
  // Gentle edge fades suppress encoder padding/clicks; not a claim of a seamless musical loop.
  const fade=Math.floor(buffer.sampleRate*.012);let peak=0,energy=0;
  for(let c=0;c<buffer.numberOfChannels;c++){const data=buffer.getChannelData(c);for(let i=0;i<data.length;i++){
   const v=data[i]??0;peak=Math.max(peak,Math.abs(v));energy+=v*v;data[i]=v*Math.min(1,i/fade,(data.length-1-i)/fade);
  }}
  const rms=Math.sqrt(energy/(buffer.length*buffer.numberOfChannels));
  const target=key==='theme'||key==='shift'?.12:key==='crane'?.10:.075;
  const gain=Math.min(target/Math.max(rms,.0001),.7/Math.max(peak,.0001),2);
  for(let c=0;c<buffer.numberOfChannels;c++){const data=buffer.getChannelData(c);for(let i=0;i<data.length;i++)data[i]=(data[i]??0)*gain;}
  this.buffers.set(key,buffer);
 }));this.master.threshold.value=-8;this.master.knee.value=6;this.master.ratio.value=8;this.master.attack.value=.003;this.master.release.value=.15;
 this.master.connect(this.context.destination);this.musicGain.gain.value=.23;this.musicGain.connect(this.master);}
 async unlock(){if(!this.disposed)await this.context.resume().catch(()=>{});}
 setMusic(value:PinballMusic){if(value===this.selected)return;this.stopMusic();this.offset=0;this.selected=value;if(this.enabled)this.startMusic();}
 setActive(value:boolean){if(this.disposed||this.enabled===value)return;this.enabled=value;if(value)this.startMusic();else{this.stopMusic();for(const voice of this.voices)voice.stop();this.voices.clear();}}
 private startMusic(){const buffer=this.buffers.get(this.selected);if(!buffer||this.musicSource)return;
  const source=this.context.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(this.musicGain);
  this.musicGain.gain.cancelScheduledValues(this.context.currentTime);this.musicGain.gain.setValueAtTime(.23,this.context.currentTime);
  this.started=this.context.currentTime;source.start(0,this.offset%buffer.duration);this.musicSource=source;}
 private stopMusic(){if(!this.musicSource)return;this.offset+=this.context.currentTime-this.started;this.musicSource.stop();this.musicSource.disconnect();this.musicSource=null;}
 play(kind:PinballSound,x=300){if(!this.enabled||this.disposed)return;const buffer=this.buffers.get(kind);if(!buffer)return;
  const now=this.context.currentTime;if(now-(this.last.get(kind)??-10)<(kind==='flipper'?.075:.04))return;this.last.set(kind,now);
  if(this.voices.size>=8){const first=this.voices.values().next().value;if(first){first.stop();this.voices.delete(first);}}
  const source=this.context.createBufferSource(),gain=this.context.createGain(),pan=this.context.createStereoPanner();source.buffer=buffer;
  gain.gain.value=kind==='crane'?.75:kind==='flipper'?.45:.65;pan.pan.value=Math.max(-.55,Math.min(.55,(x-300)/550));
  source.connect(gain);gain.connect(pan);pan.connect(this.master);this.voices.add(source);
  source.onended=()=>{this.voices.delete(source);source.disconnect();gain.disconnect();pan.disconnect();};source.start();
  if(kind==='crane'){const g=this.musicGain.gain;g.cancelScheduledValues(now);g.setValueAtTime(g.value,now);g.linearRampToValueAtTime(.16,now+.035);g.linearRampToValueAtTime(.23,now+buffer.duration+.4);}
 }
 dispose(){this.setActive(false);this.disposed=true;this.musicGain.disconnect();this.master.disconnect();void this.context.close();}
}
