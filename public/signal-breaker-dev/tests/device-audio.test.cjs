const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('device streams never duplicate across frames, pause, mute and resume',()=>{
 const audio=[];class Audio{constructor(url){this.url=url;this.paused=true;this.starts=0;audio.push(this);}play(){this.paused=false;this.starts++;return Promise.resolve();}pause(){this.paused=true;}}
 const context={window:{Audio},Math,Map,Date,performance:{now:()=>1000}};vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../src/premium-sound.js'),'utf8'),context);
 const s=new context.window.SignalBreakerPremiumSound.SoundDirector(),game={state:'playing',time:1,config:{conveyor:true,tension:true},conveyorDirection:1,tensionLockUntil:0};s.setSession(true,true);for(let i=0;i<100;i++)s.setScene(game,'player');assert.equal(audio.length,3);assert.ok(audio.every(a=>a.starts===1));
 s.setSession(false,true);assert.ok(audio.every(a=>a.paused));s.setSession(true,true);s.setScene(game,'player');assert.ok(audio.every(a=>a.starts===2));game.conveyorDirection=0;game.tensionLockUntil=5;s.setScene(game,'player');assert.ok(audio.filter(a=>a.loop&&a.url.includes('mechanism')||a.url.includes('motor')).every(a=>a.paused));s.setSession(true,false);assert.ok(audio.every(a=>a.paused));
});
test('voice volume is independent from muted effects and follows session state',()=>{
 const node=()=>({gain:{value:0},connect(){return this}});class Context{constructor(){this.destination={};this.sampleRate=100;}createGain(){return node();}createBuffer(){return {getChannelData:()=>new Float32Array(18)}}}
 const context={window:{AudioContext:Context},Math,Map,Date};vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../src/premium-sound.js'),'utf8'),context);const s=new context.window.SignalBreakerPremiumSound.SoundDirector();s.setSession(true,true);s.ensure();s.setMix({effects:0,voice:.6});assert.equal(s.master.gain.value,0);assert.equal(s.voiceBus.gain.value,.6);s.setSession(false,true);assert.equal(s.voiceBus.gain.value,0);
});
