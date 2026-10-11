/* Original bounded procedural ending mix. No voice, timers, samples or game state.
   Timeline gain follows EndingPlayer; a paused/hidden/closed ending is silent. */
(function(root){'use strict';
 class EndingSound{
  constructor(context){this.context=context;this.sources=new Set();this.nodes=[];this.running=false;}
  start(definition,{enabled=true,music=.16,devices=.12,effects=.45}={}){
   this.stop();if(!enabled)return;
   try{const c=this.context();if(!c)return;this.c=c;this.running=true;this.paused=false;this.duration=definition.duration;this.lastShot='';this.mix={};for(const [key,value,fallback] of [['music',music,.16],['devices',devices,.12],['effects',effects,.45]])this.mix[key]=Number.isFinite(value)?Math.max(0,Math.min(1,value)):fallback;this.bus=c.createGain();this.bus.gain.value=0;this.bus.connect(c.destination);this.nodes.push(this.bus);
    const fundamental={'CH-01':146.83,'CH-02':164.81,'CH-03':130.81,'CH-04':110,'CH-05':146.83}[definition.stageId];
    this.music=c.createGain();this.music.gain.value=0;this.music.connect(this.bus);this.nodes.push(this.music);
    for(const ratio of [1,1.5,2]){const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=fundamental*ratio;g.gain.value=ratio===1?.32:.12;o.connect(g).connect(this.music);this.nodes.push(g);this.source(o);}
    const buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate),data=buffer.getChannelData(0);let seed=74129;for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;data[i]=(seed/4294967296*2-1)*.15;}
    const air=c.createBufferSource(),filter=c.createBiquadFilter();air.buffer=buffer;air.loop=true;filter.type='lowpass';filter.frequency.value=definition.stageId==='CH-03'?380:650;this.air=c.createGain();this.air.gain.value=0;air.connect(filter).connect(this.air).connect(this.bus);this.nodes.push(filter,this.air);this.source(air);
    if(c.state==='suspended')void c.resume().catch(()=>{});
   }catch{this.stop();}
  }
  source(source){this.sources.add(source);source.onended=()=>{this.sources.delete(source);source.disconnect();};source.start();}
  pause(value){this.paused=value;if(this.running)this.bus.gain.setTargetAtTime(value?0:1,this.c.currentTime,.015);}
  update(elapsed,shot){if(!this.running)return;const at=this.c.currentTime;
   if(shot!==this.lastShot){this.lastShot=shot;if(shot==='memory'&&!this.paused){const o=this.c.createOscillator(),g=this.c.createGain();o.type='sine';o.frequency.setValueAtTime(620,at);o.frequency.exponentialRampToValueAtTime(800,at+.22);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.0002,this.mix.effects*.025),at+.012);g.gain.exponentialRampToValueAtTime(.0001,at+.22);o.connect(g).connect(this.bus);this.nodes.push(g);this.source(o);o.stop(at+.24);}}

   // 250 ms of space after the combat mix stops; a 1.25 s breath into the world.
   const entrance=Math.min(1,Math.max(0,(elapsed-.25)/1.25)),exit=Math.min(1,Math.max(0,(this.duration-elapsed)/.8));
   const human=shot==='human'?.35:1;
   this.music.gain.setTargetAtTime(this.mix.music*.28*entrance*exit*human,at,.08);
   this.air.gain.setTargetAtTime(this.mix.devices*.22*entrance*exit,at,.08);
   this.bus.gain.setTargetAtTime(this.paused?0:1,at,.015);
  }
  stop(){this.running=false;for(const source of this.sources){source.onended=null;try{source.stop();}catch{}source.disconnect();}this.sources.clear();for(const node of this.nodes)node.disconnect();this.nodes=[];this.c=null;}
 }
 root.SignalBreakerEndingSound=EndingSound;
})(typeof window!=='undefined'?window:globalThis);
