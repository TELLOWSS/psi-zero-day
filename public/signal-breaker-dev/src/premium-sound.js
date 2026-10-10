/* SIGNAL BREAKER procedural audio layer: original, no licensed samples.
   Bounded oscillators/noise envelopes. Gracefully silent if audio is unavailable. */
(function(root){'use strict';
class SoundDirector{
 constructor(){this.context=null;this.master=null;this.noise=null;this.last=new Map();}
 ensure(){try{if(this.context)return this.context;const C=root.AudioContext||root.webkitAudioContext;if(!C)return null;const c=new C();this.context=c;this.master=c.createGain();this.master.gain.value=.45;this.master.connect(c.destination);const n=c.createBuffer(1,c.sampleRate*.18,c.sampleRate);let d=n.getChannelData(0);let seed=74793;for(let i=0;i<d.length;i++){seed=(seed*1664525+1013904223)>>>0;d[i]=(seed/4294967296*2-1);}this.noise=n;return c;}catch{return null;}}
 envGain(g,t,attack,peak,dur){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+dur);}
 osc(freq,end,dur,shape='triangle',vol=.07){const c=this.ensure();if(!c)return;const t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type=shape;o.frequency.setValueAtTime(Math.max(20,freq),t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+dur);this.envGain(g,t,.009,vol,dur);o.connect(g).connect(this.master);o.start(t);o.stop(t+dur+.01);}
 noiseBurst(dur=.12,volume=.08,cutoff=1000){const c=this.ensure();if(!c||!this.noise)return;const t=c.currentTime,src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();src.buffer=this.noise;f.type='bandpass';f.frequency.setValueAtTime(cutoff,t);f.Q.value=.65;this.envGain(g,t,.004,volume,dur);src.connect(f).connect(g).connect(this.master);src.start(t);src.stop(t+dur+.01);}
 play(event,enabled=true){if(!enabled)return;const kind=event.kind,now=typeof performance!=='undefined'?performance.now():Date.now();if((kind==='bumper'||kind==='ricochet'||kind==='corebounce')&&now-(this.last.get(kind)||0)<60)return;this.last.set(kind,now);
 try{if(this.context?.state==='suspended')void this.context.resume();switch(kind){
 case'fire':if(event.n===2){this.osc(420,175,.24,'sine',.046);this.noiseBurst(.11,.042,1750);}else{this.osc(220,105,.14,'sawtooth',.06);this.noiseBurst(.095,.10,750);}break;
 case'impact':this.osc(105,49,.19,'triangle',.1);this.noiseBurst(.14,.08,1150);break;
 case'split':this.osc(445,150,.13,'square',.023);this.noiseBurst(.11,.07,2400);break;
 case'capture':this.osc(525,990,.17,'sine',.06);this.osc(760,1350,.20,'triangle',.025);break;
 case'netfield':this.osc(380,190,.26,'sine',.05);this.noiseBurst(.23,.048,2600);break;
 case'bumper':case'ricochet':case'corebounce':this.osc(870,320,.055,'triangle',.042);break;
 case'node':this.osc(640,1160,.26,'triangle',.07);break;
 case'chain':this.osc(720,1240,.24,'sine',.065);this.osc(1100,1600,.19,'sine',.03);break;
 case'unseal':this.osc(230,1100,.55,'sawtooth',.04);this.noiseBurst(.25,.06,2300);break;
 case'boss':this.osc(70,36,.48,'sawtooth',.11);this.osc(440,880,.45,'triangle',.06);this.noiseBurst(.30,.09,850);break;
 case'victory':this.osc(523,1046,.38,'sine',.035);break;
 case'hurt':this.osc(180,70,.33,'sawtooth',.055);break;
 case'defeat':this.osc(240,98,.38,'sine',.05);break;
 default:break;
 }}catch{/* Audio never blocks gameplay. */}}
}
root.SignalBreakerPremiumSound={SoundDirector};
})(typeof window!=='undefined'?window:globalThis);