// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {RECORDED_SFX,recordedEquipmentCue} from '../src/app/survivors-sfx-assets';
import ingest from '../content/survivors-sfx-v1-ingest.json';
import {SurvivorsSessionAudio} from '../src/ui/survivors-session-audio';
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
function context(){
  const sources:Array<{start:ReturnType<typeof vi.fn>;stop:ReturnType<typeof vi.fn>}>=[];
  const gain=()=>({connect:vi.fn(),disconnect:vi.fn(),gain:{value:1,setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),cancelScheduledValues:vi.fn()}});
  const ctx={state:'running',currentTime:0,destination:{},createGain:gain,close:vi.fn(async()=>{}),decodeAudioData:vi.fn(async()=>({duration:.48})),createBufferSource:vi.fn(()=>{
    const source={connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),onended:null};sources.push(source);return source;
  })};
  vi.stubGlobal('AudioContext',vi.fn(function(){return ctx;}));
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(16)})));
  return {ctx,sources};
}
it('validates all supplied files, applies only explicit mappings and preserves candidate status',()=>{
  expect(ingest).toHaveLength(15);expect(RECORDED_SFX).toHaveLength(8);
  expect(ingest.filter(entry=>entry.id===null)).toHaveLength(7);
  expect(ingest.every(entry=>entry.duration>0&&entry.decodedOverFullScaleSamples===0&&!entry.listeningApproval)).toBe(true);
  for(const asset of RECORDED_SFX){
    expect(asset.status).toBe('CANDIDATE');expect(asset.loop).toBe(false);expect(asset.bus).toBe('SFX');
    expect(createHash('sha256').update(readFileSync('public'+asset.uri)).digest('hex')).toBe(asset.sha256);
    expect(ingest.find(entry=>entry.id===asset.id)!.gainDb).toBeLessThanOrEqual(12);
  }
});
it('maps trigger discharge not projectile expiry and preserves calm worker confirmations',()=>{
  const event={projectileId:'p',kind:'radio' as const,phase:'launch' as const,x:0,y:0,angle:0,radius:4};
  expect(recordedEquipmentCue(event)).toBe('radio_release');
  expect(recordedEquipmentCue({...event,kind:'hunter_beam'})).toBe('drone_release');
  expect(recordedEquipmentCue({...event,kind:'tesla_bolt',phase:'impact'})).toBe('tesla_control');
  expect(recordedEquipmentCue({...event,phase:'release'})).toBeUndefined();
  expect(recordedEquipmentCue({...event,worker:true})).toBeUndefined();
  expect(recordedEquipmentCue({...event,kind:'extinguisher'})).toBeUndefined();
});
it('preloads eight once and replaces repeated shot synthesis with a rate-limited recording',async()=>{
  const {sources}=context(),audio=new SurvivorsSessionAudio();
  expect(await audio.preloadEquipmentRecordings()).toBe(true);expect(await audio.preloadEquipmentRecordings()).toBe(true);
  expect(fetch).toHaveBeenCalledTimes(8);
  for(let i=0;i<100;i++)audio.playEquipmentFeedback({projectileId:String(i),kind:'radio',phase:'launch',x:0,y:0,angle:0,radius:4},{x:0,y:0});
  await vi.waitFor(()=>expect(sources).toHaveLength(1));expect(audio.voiceCount).toBe(1);
  audio.silence();expect(sources[0]!.stop).toHaveBeenCalled();expect(audio.voiceCount).toBe(0);audio.dispose();
});
it('cancels delayed decoded recordings after mute and avoids phantom initial docking sounds',async()=>{
  const {ctx,sources}=context(),audio=new SurvivorsSessionAudio();let resolve!:(value:{duration:number})=>void;
  ctx.decodeAudioData.mockImplementation(()=>new Promise(done=>{resolve=done;}));
  audio.playRecordedEffect('ui_equip');await vi.waitFor(()=>expect(resolve).toBeDefined());
  audio.setMuted(true);resolve({duration:.48});await Promise.resolve();await Promise.resolve();expect(sources).toHaveLength(0);
  const play=vi.spyOn(audio,'playRecordedEffect').mockReturnValue(true);
  audio.playInspectionPhase('docked',true);expect(play).not.toHaveBeenCalled();
  audio.playInspectionPhase('launching',true);audio.playInspectionPhase('launching',true);expect(play).toHaveBeenCalledTimes(1);
  audio.silence();audio.playInspectionPhase('launching',true);expect(play).toHaveBeenCalledTimes(1);
  audio.playInspectionPhase('returning',false);audio.playInspectionPhase('returning',true);audio.playInspectionPhase('docked',true);
  expect(play.mock.calls.map(call=>call[0])).toEqual(['drone_launch','drone_dock']);audio.dispose();
});
