// @vitest-environment jsdom
import {afterEach,describe,it,expect,vi} from 'vitest';
import {DefenseCombatMixer,DEFENSE_COMBAT_VOICES} from '../src/app/defense-combat-mixer';
import type {DefenseCombatShot} from '../src/domain/defense';

const sources:{stop:ReturnType<typeof vi.fn>}[]=[];
function node(){return {connect:vi.fn().mockReturnThis(),disconnect:vi.fn(),gain:{value:0,setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn()},frequency:{value:0},pan:{value:0}};}
class Context{
 state='running';currentTime=1;destination={};
 createDynamicsCompressor(){return {...node(),threshold:{value:0},knee:{value:0},ratio:{value:0},attack:{value:0},release:{value:0}};}
 createBufferSource(){const s={...node(),playbackRate:{value:0},buffer:null,onended:null,start:vi.fn(),stop:vi.fn()};sources.push(s);return s;}
 createGain(){return node();}createBiquadFilter(){return node();}createStereoPanner(){return node();}
 decodeAudioData(){return Promise.resolve({duration:.6});}resume(){return Promise.resolve();}close(){return Promise.resolve();}
}
afterEach(()=>{vi.unstubAllGlobals();sources.length=0;});
describe('sample-based bounded defense combat mixer',()=>{
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
