const {test}=require('node:test'),a=require('node:assert/strict');
require('../src/ending-sound.js');const EndingSound=global.SignalBreakerEndingSound;
const fake=()=>{const sources=[],nodes=[];const param=()=>({value:0,setTargetAtTime(v){this.value=v;},setValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;}});const node=()=>{const n={connected:false,connect(){this.connected=true;return this;},disconnect(){this.connected=false;}};nodes.push(n);return n;};const source=()=>{const s={...node(),frequency:param(),start(){sources.push(this);this.live=true;},stop(){this.live=false;}};return s;};return {c:{sampleRate:10,currentTime:0,state:'running',destination:{},createGain:()=>({...node(),gain:param()}),createOscillator:source,createBuffer:(_,n)=>({getChannelData:()=>new Float32Array(n)}),createBufferSource:source,createBiquadFilter:()=>({...node(),frequency:param()})},sources,nodes};};
test('ending audio honours mute, pause and bounded replay cleanup',()=>{
 const f=fake(),sound=new EndingSound(()=>f.c),d={stageId:'CH-04',duration:14};sound.start(d,{enabled:false});a.equal(f.sources.length,0);
 for(let i=0;i<20;i++){sound.start(d);a.equal(f.sources.filter(s=>s.live).length,4);sound.update(3,'world');a.ok(sound.music.gain.value>0);sound.pause(true);sound.update(3,'world');a.equal(sound.bus.gain.value,0);sound.pause(false);sound.update(10,'memory');a.equal(sound.sources.size,5);sound.stop();a.equal(f.sources.filter(s=>s.live).length,0);a.equal(sound.sources.size,0);a.ok(sound.nodes.length===0);}
});
test('missing audio context and final fade never prevent an ending completing',()=>{
 const silent=new EndingSound(()=>null);silent.start({stageId:'CH-01',duration:12});a.equal(silent.running,false);silent.pause(true);silent.update(3,'world');silent.stop();
 const f=fake(),sound=new EndingSound(()=>f.c);sound.start({stageId:'CH-05',duration:21});sound.update(.1,'release');a.equal(sound.music.gain.value,0);sound.update(20.9,'hook');a.ok(sound.music.gain.value<.01);sound.update(21,'hook');a.equal(sound.music.gain.value,0);sound.stop();
});
