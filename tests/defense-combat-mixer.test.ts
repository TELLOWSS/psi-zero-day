// @vitest-environment jsdom
import {afterEach,describe,it,expect,vi} from 'vitest';
import {DefenseCombatMixer,DEFENSE_COMBAT_VOICES} from '../src/app/defense-combat-mixer';
import type {DefenseCombatShot} from '../src/domain/defense';

const sources:{stop:ReturnType<typeof vi.fn>}[]=[];
const limiters:{curve:Float32Array|null}[]=[];
function node(){return {connect:vi.fn().mockReturnThis(),disconnect:vi.fn(),gain:{value:0,setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn()},frequency:{value:0},pan:{value:0}};}
class Context{
 state='running';currentTime=1;destination={};
 createDynamicsCompressor(){return {...node(),threshold:{value:0},knee:{value:0},ratio:{value:0},attack:{value:0},release:{value:0}};}
 createBufferSource(){const s={...node(),playbackRate:{value:0},buffer:null,onended:null,start:vi.fn(),stop:vi.fn()};sources.push(s);return s;}
 createGain(){return node();}createBiquadFilter(){return node();}createStereoPanner(){return node();}
 createWaveShaper(){const result={...node(),curve:null as Float32Array|null};limiters.push(result);return result;}
 decodeAudioData(){return Promise.resolve({duration:.6,sampleRate:1000,getChannelData:()=>new Float32Array(600).fill(.1)});}resume(){return Promise.resolve();}close(){return Promise.resolve();}
}
afterEach(()=>{vi.unstubAllGlobals();sources.length=0;limiters.length=0;});
describe('sample-based bounded defense combat mixer',()=>{
 it('loads 27 supplied effects once and gives critical cues priority within the shared eight-voice limit',async()=>{
  vi.stubGlobal('AudioContext',Context);vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)}));
  const reports:Record<string,unknown>[]=[];const report=(event:Event)=>reports.push((event as CustomEvent).detail);window.addEventListener('psi:defense-combat-sound',report);
  const mixer=new DefenseCombatMixer(true);
  try{
   mixer.arm();mixer.arm();for(let i=0;i<12;i++)await Promise.resolve();
   expect(fetch).toHaveBeenCalledTimes(27);expect(reports.filter(r=>r.phase==='decoded')).toHaveLength(27);
   for(const family of ['PULSE','BURST','CONTROL','SENSOR'] as const)mixer.play({id:family,towerId:family,levelId:'L3B',padId:'P1',targets:[]},0);
   mixer.critical('CRITICAL_LEAK_ALERT_AUDIO');
   const voices=reports.filter(r=>r.phase==='sample');expect(voices.length).toBeGreaterThan(8);expect(voices.every(r=>Number(r.voices)<=8)).toBe(true);
   expect(voices.at(-1)?.id).toBe('CRITICAL_LEAK_ALERT_AUDIO');expect(sources.some(s=>s.stop.mock.calls.length===1)).toBe(true);
   expect(Math.max(...limiters[0]!.curve!)).toBeCloseTo(.9);expect(Math.min(...limiters[0]!.curve!)).toBeCloseTo(-.9);
   mixer.stop();expect(sources.every(s=>s.stop.mock.calls.length===1)).toBe(true);
  }finally{mixer.dispose();window.removeEventListener('psi:defense-combat-sound',report);}
 });
 it('decodes cached samples once, respects eight scheduled voices and stops them on mute/pause cleanup',async()=>{
  vi.stubGlobal('AudioContext',Context);vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)}));
  const mixer=new DefenseCombatMixer();mixer.arm();mixer.arm();
  for(let i=0;i<12;i++)await Promise.resolve();
  expect(fetch).toHaveBeenCalledTimes(3);
  for(const family of ['PULSE','BURST','CONTROL','SENSOR'] as const){const shot={id:family,towerId:family,levelId:'L3A',padId:'P1',targets:[]} satisfies DefenseCombatShot;mixer.play(shot,3);mixer.play(shot,3);}
  expect(sources).toHaveLength(DEFENSE_COMBAT_VOICES);mixer.stop();expect(sources.every(s=>s.stop.mock.calls.length===1)).toBe(true);mixer.dispose();
 });
 it('does not create voices before arming or after failed decoding',async()=>{
  vi.stubGlobal('AudioContext',Context);vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));
  const mixer=new DefenseCombatMixer(),shot={id:'x',towerId:'PULSE',levelId:'L1',padId:'P1',targets:[]} satisfies DefenseCombatShot;
  mixer.play(shot,0);mixer.arm();for(let i=0;i<12;i++)await Promise.resolve();mixer.play(shot,0);mixer.arm();
  expect(sources).toHaveLength(0);expect(fetch).toHaveBeenCalledTimes(3);mixer.dispose();
 });
});
