/* Exact-line recordings only. No speech synthesis or substitution of speakers. */
(function(root){'use strict';
 class EndingVoice{
  constructor(context,{load}={}){this.context=context;this.load=load||this.loadRecording;this.generation=0;}
  async loadRecording(cue,c){const response=await fetch(cue.voice.uri);if(!response.ok)throw new Error('recording unavailable');const bytes=await response.arrayBuffer();const digest=await crypto.subtle.digest('SHA-256',bytes);const hash=[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');if(hash!==cue.voice.sha256)throw new Error('recording identity mismatch');const buffer=await c.decodeAudioData(bytes);if(Math.abs(buffer.duration-cue.voice.duration)>.08)throw new Error('recording duration mismatch');return buffer;}
  start(definition,{enabled=true,gain=.7,cue=root.SignalBreakerEndingPerformanceContent.cue(definition.stageId)}={}){
   this.stop();if(!enabled||!root.SignalBreakerEndingPerformanceContent.approved(cue,definition))return;
   let c;try{c=this.context();}catch{return;}if(!c)return;this.c=c;this.enabled=true;this.paused=false;this.active=false;this.cue=cue;this.elapsed=0;this.gain=Number.isFinite(gain)?Math.max(0,Math.min(1,gain)):.7;
   const i=definition.shots.findIndex(s=>s.id===cue.shotId);this.startAt=definition.shots[i-1].until;this.endAt=definition.shots[i].until;const generation=this.generation;
   Promise.resolve().then(()=>this.load(cue,c)).then(buffer=>{if(generation===this.generation)this.buffer=buffer;}).catch(()=>{if(generation===this.generation)this.failed=true;});
  }
  update(elapsed,shot){this.elapsed=elapsed;if(!this.enabled)return;
   if(shot!==this.cue.shotId||elapsed>=this.endAt){this.release();return;}
   const offset=elapsed-this.startAt;
   // Do not begin a late download halfway through a word. Replay can try again.
   if(!this.started&&offset>.4){this.missed=true;return;}
   if(this.paused||this.missed||this.completed||!this.buffer||offset<0||offset>=this.buffer.duration){this.release();return;}
   if(!this.source){try{const source=this.c.createBufferSource(),bus=this.c.createGain();source.buffer=this.buffer;bus.gain.value=this.gain;source.connect(bus).connect(this.c.destination);this.source=source;this.bus=bus;this.active=true;this.started=true;source.onended=()=>{if(this.source===source){this.completed=true;this.release();}};source.start(0,Math.max(0,offset));if(this.c.state==='suspended')void this.c.resume().catch(()=>{});}catch{this.failed=true;this.enabled=false;this.release();}}
  }
  pause(value){this.paused=value;if(value)this.release();}
  release(){this.active=false;if(this.source){this.source.onended=null;try{this.source.stop();}catch{}this.source.disconnect();this.source=null;}this.bus?.disconnect();this.bus=null;}
  stop(){this.generation++;this.release();this.enabled=false;this.buffer=null;this.c=null;this.started=false;this.completed=false;this.missed=false;this.failed=false;}
 }
 root.SignalBreakerEndingVoice=EndingVoice;
})(typeof window!=='undefined'?window:globalThis);
