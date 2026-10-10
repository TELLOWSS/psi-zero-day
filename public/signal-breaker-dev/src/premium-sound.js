/* SIGNAL BREAKER procedural audio layer: original, no licensed samples.
   Bounded oscillators/noise envelopes. Gracefully silent if audio is unavailable. */
(function(root){'use strict';
class SoundDirector{
 constructor(){this.context=null;this.master=null;this.voiceBus=null;this.noise=null;this.last=new Map();this.voices=0;this.maxVoices=24;this.voiceLimit=24;this.enabled=true;this.playing=false;this.epoch=0;this.recorded=new Map();this.recording=new Set();this.active=new Set();this.music=null;this.voiceStream=null;this.voiceURL=null;this.loops=new Map();this.mix={music:.16,effects:.45,devices:.12,voice:.35};this.characterId='player';this.duckUntil=0;this.variant=0;}
 setSession(playing,enabled){
  if(this.playing===playing&&this.enabled===enabled)return;
  this.playing=playing;this.enabled=enabled;this.epoch++;
  if(this.master)this.master.gain.value=(playing&&enabled)?this.mix.effects:0;if(this.voiceBus)this.voiceBus.gain.value=playing&&enabled?this.mix.voice:0;
  if(!playing||!enabled){for(const source of this.active){try{source.stop();}catch{}}this.music?.pause();this.voiceStream?.pause();for(const audio of this.loops.values())audio.pause();return;}
  if(typeof root.Audio==='function'){if(!this.music){this.music=new root.Audio('/assets/survivors/pinball/audio-candidates-v1/after-the-shift-v01.mp3');this.music.loop=true;this.music.volume=this.mix.music;this.music.preload='none';}void this.music.play().catch(()=>{});}
 }
 suspend(){for(const source of this.active){try{source.stop();}catch{}}this.music?.pause();this.voiceStream?.pause();for(const audio of this.loops.values())audio.pause();if(this.master)this.master.gain.value=0;if(this.voiceBus)this.voiceBus.gain.value=0;this.playing=false;}
 setMix(values){for(const key of ['music','effects','devices','voice'])if(Number.isFinite(values[key]))this.mix[key]=Math.max(0,Math.min(1,values[key]));if(this.master)this.master.gain.value=this.playing&&this.enabled?this.mix.effects:0;if(this.voiceBus)this.voiceBus.gain.value=this.playing&&this.enabled?this.mix.voice:0;if(this.voiceStream)this.voiceStream.volume=this.mix.voice;if(this.music)this.music.volume=this.mix.music*(Date.now()<this.duckUntil?.3:1);for(const audio of this.loops.values())audio.volume=this.mix.devices;}
 setScene(game,characterId){this.characterId=characterId;this.playerLife=game.player?.life??5;const want=new Map();if(game.state==='playing'&&this.enabled){if(game.config.conveyor&&game.conveyorDirection!==0)want.set('belt','/assets/survivors/pinball/audio-phase2c-v1/conveyor_mechanism_loop.wav');if(game.config.tension&&game.time>=game.tensionLockUntil)want.set('hoist','/assets/survivors/pinball/audio-phase1-v1/harbor_crane_motor_loop.mp3');}
  if(typeof root.Audio==='function')for(const [id,url] of want){let audio=this.loops.get(id);if(!audio){audio=new root.Audio(url);audio.loop=true;audio.preload='none';audio.volume=this.mix.devices;this.loops.set(id,audio);}if(audio.paused)void audio.play().catch(()=>{});}
  for(const [id,audio] of this.loops)if(!want.has(id))audio.pause();if(this.music)this.music.volume=this.mix.music*(Date.now()<this.duckUntil?.3:1);
 }
 sample(event){
  const phase1='/assets/survivors/pinball/audio-phase1-v1/',phase2='/assets/survivors/pinball/audio-phase2-v1/',device='/assets/survivors/pinball/audio-phase2c-v1/';
  const voice=this.characterId==='player'?{start:'START_A',hurt:this.playerLife<=2?'LOW_HP_A':null,victory:'CLEAR_A',unseal:'SECURED_A'}[event.kind]:null;
  const files={impact:event.material==='metal'?phase1+'hit_metal_light_0'+(1+(this.variant++%2))+'.mp3':null,capture:phase1+'harbor_cargo_lock.mp3',bumper:phase2+'hit_rubber_heavy_v02_02.mp3',shieldlock:phase1+'harbor_cargo_lock.mp3',conveyor:device+(event.n===0?'conveyor_mechanism_stop.wav':'conveyor_mechanism_start.wav'),anchor:event.material==='tension'?phase2+'harbor_crane_motor_stop_v02.mp3':phase1+'harbor_cargo_lock.mp3',hoiststart:phase1+'harbor_crane_motor_start.mp3',chain:phase1+'perfect_shot_01.mp3',boss:phase2+'harbor_success_finish_v02.mp3'};
  const url=voice?'/assets/survivors/voice-player-v1/PSI_V_PLAYER_'+voice+'_v01.wav':files[event.kind];
  if(voice&&typeof root.Audio==='function'){if(!this.voiceStream){this.voiceStream=new root.Audio(url);this.voiceStream.preload='none';}else this.voiceStream.pause();if(this.voiceURL!==url)this.voiceStream.src=url;this.voiceURL=url;this.voiceStream.volume=this.mix.voice;this.duckUntil=Date.now()+1200;if(this.music)this.music.volume=this.mix.music*.3;void this.voiceStream.play().catch(()=>{});return true;}
  if(!url||!root.PSIPresentationAssets||!root.fetch)return false;
  const context=this.ensure();if(!context)return false;
  const buffer=this.recorded.get(url);
  if(!buffer){if(!this.recording.has(url)){this.recording.add(url);void root.PSIPresentationAssets.audio(context,url).then(value=>this.recorded.set(url,value)).catch(()=>{}).finally(()=>this.recording.delete(url));}return false;}
  if(this.voices>=this.maxVoices)return true;
  const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;gain.gain.value=voice?.65:.4;source.connect(gain).connect(voice?this.voiceBus:this.master);this.voices++;this.active.add(source);
  source.onended=()=>{this.voices=Math.max(0,this.voices-1);this.active.delete(source);source.disconnect();gain.disconnect();};source.start();return true;
 }
 ensure(){try{if(this.context)return this.context;const C=root.AudioContext||root.webkitAudioContext;if(!C)return null;const c=new C();this.context=c;if(c.state==='suspended'&&c.resume)void c.resume();this.master=c.createGain();this.master.gain.value=this.playing&&this.enabled?this.mix.effects:0;this.master.connect(c.destination);this.voiceBus=c.createGain();this.voiceBus.gain.value=this.playing&&this.enabled?this.mix.voice:0;this.voiceBus.connect(c.destination);const n=c.createBuffer(1,c.sampleRate*.18,c.sampleRate);let d=n.getChannelData(0);let seed=74793;for(let i=0;i<d.length;i++){seed=(seed*1664525+1013904223)>>>0;d[i]=(seed/4294967296*2-1);}this.noise=n;return c;}catch{return null;}}
 envGain(g,t,attack,peak,dur){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+dur);}
 osc(freq,end,dur,shape='triangle',vol=.07){const c=this.ensure();if(!c||this.voices>=Math.min(this.voiceLimit,this.maxVoices))return;this.voices++;const t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type=shape;o.frequency.setValueAtTime(Math.max(20,freq),t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+dur);this.envGain(g,t,.009,vol,dur);this.active.add(o);o.onended=()=>{this.active.delete(o);this.voices=Math.max(0,this.voices-1);o.disconnect();g.disconnect();};o.connect(g).connect(this.master);o.start(t);o.stop(t+dur+.01);}
 noiseBurst(dur=.12,volume=.08,cutoff=1000){const c=this.ensure();if(!c||!this.noise||this.voices>=Math.min(this.voiceLimit,this.maxVoices))return;this.voices++;const t=c.currentTime,src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();src.buffer=this.noise;f.type='bandpass';f.frequency.setValueAtTime(cutoff,t);f.Q.value=.65;this.envGain(g,t,.004,volume,dur);this.active.add(src);src.onended=()=>{this.active.delete(src);this.voices=Math.max(0,this.voices-1);src.disconnect();f.disconnect();g.disconnect();};src.connect(f).connect(g).connect(this.master);src.start(t);src.stop(t+dur+.01);}
 play(event,enabled=true){if(!enabled)return;const kind=event.kind;this.voiceLimit=['hurt','unseal','boss','reason'].includes(kind)?this.maxVoices:this.maxVoices-3;if(this.voices>=this.maxVoices-3&&!['hurt','unseal','boss','reason'].includes(kind))return;const now=typeof performance!=='undefined'?performance.now():Date.now();if((kind==='bumper'||kind==='ricochet'||kind==='corebounce')&&now-(this.last.get(kind)||0)<60)return;this.last.set(kind,now);if(['hurt','unseal','boss','reason'].includes(kind)){this.duckUntil=Date.now()+700;if(this.music)this.music.volume=this.mix.music*.3;}
 try{if(this.context?.state==='suspended')void this.context.resume();if(this.sample(event))return;switch(kind){
 case'fire':if(event.n===3){this.osc(180,270,.3,'sine',.05);this.osc(360,540,.22,'triangle',.025);}else if(event.n===4){this.noiseBurst(.26,.06,3400);}else if(event.n===5){this.osc(95,60,.12,'square',.03);this.noiseBurst(.09,.07,1500);}else if(event.n===6){this.osc(950,1300,.14,'sine',.035);this.osc(620,950,.09,'sine',.02);}else if(event.n===2){this.osc(420,175,.24,'sine',.046);this.noiseBurst(.11,.042,1750);}else{this.osc(220,105,.14,'sawtooth',.06);this.noiseBurst(.095,.10,750);}break;
 case'impact':{const material=event.material;if(material==='power'){this.osc(470,90,.19,'sawtooth',.04);this.noiseBurst(.12,.05,3100);}else if(material==='dust'){this.osc(85,40,.16,'sine',.07);this.noiseBurst(.18,.09,470);}else if(material==='load'){this.osc(76,35,.23,'triangle',.09);this.noiseBurst(.12,.06,850);}else{this.osc(165,65,.17,'triangle',.08);this.osc(780,290,.1,'sine',.03);this.noiseBurst(.1,.06,1850);}break;}
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
