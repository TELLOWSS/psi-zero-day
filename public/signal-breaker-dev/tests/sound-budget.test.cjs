const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('audio bursts stay within voice cap and release every finished voice',()=>{
 const nodes=[];const param={value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}};
 const node=()=>{const n={gain:param,frequency:param,Q:param,connect(){return this},disconnect(){},start(){},stop(){}};nodes.push(n);return n;};
 class Context{constructor(){this.currentTime=0;this.sampleRate=100;this.destination={};}createGain(){return node();}createOscillator(){return node();}createBufferSource(){return node();}createBiquadFilter(){return node();}createBuffer(){return {getChannelData(){return new Float32Array(18)}};}}
 const window={AudioContext:Context},ctx={window,Math,Map,performance:{now:()=>1000}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../src/premium-sound.js'),'utf8'),ctx);
 const sound=new window.SignalBreakerPremiumSound.SoundDirector();for(let i=0;i<100;i++)sound.play({kind:'capture'});assert.equal(sound.voices,21);
 for(const n of nodes)if(n.onended)n.onended();assert.equal(sound.voices,0);
 sound.play({kind:'impact',material:'dust'});assert.equal(sound.voices,2);
});
