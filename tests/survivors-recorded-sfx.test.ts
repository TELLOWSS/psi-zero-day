// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {RECORDED_SFX,RECORDED_SFX_V1,recordedEquipmentCue,recordedSfxFamily} from '../src/app/survivors-sfx-assets';
import ingestV2 from '../content/survivors-sfx-v2-ingest.json';
import {RecordedSfxVariants} from '../src/app/survivors-sfx-variants';
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
  expect(ingest).toHaveLength(15);expect(RECORDED_SFX_V1).toHaveLength(8);expect(RECORDED_SFX).toHaveLength(34);
  expect(ingest.filter(entry=>entry.id===null)).toHaveLength(7);
  expect(ingest.every(entry=>entry.duration>0&&entry.decodedOverFullScaleSamples===0&&!entry.listeningApproval)).toBe(true);
  for(const asset of RECORDED_SFX_V1){
    expect(asset.status).toBe('CANDIDATE');expect(asset.loop).toBe(false);expect(asset.bus).toBe('SFX');
    expect(createHash('sha256').update(readFileSync('public'+asset.uri)).digest('hex')).toBe(asset.sha256);
    expect(ingest.find(entry=>entry.id===asset.id)!.gainDb).toBeLessThanOrEqual(12);
  }
});
it('shares drone cadence across variants, shortens tails and softens sustained fire',async()=>{
 const {ctx,sources}=context(),audio=new SurvivorsSessionAudio();await audio.preloadEquipmentRecordings();
 const gains:ReturnType<typeof ctx.createGain>[]=[];const createGain=ctx.createGain;
 ctx.createGain=()=>{const node=createGain();gains.push(node);return node;};
 audio.playRecordedEffect('drone_release',undefined,undefined,false,1,'base');await vi.waitFor(()=>expect(sources).toHaveLength(1));
 ctx.currentTime=.1;audio.playRecordedEffect('drone_premium_release',undefined,undefined,false,1,'premium');
 expect(sources).toHaveLength(1);
 ctx.currentTime=.23;audio.playRecordedEffect('drone_hunter_burst');await vi.waitFor(()=>expect(sources).toHaveLength(2));
 expect(gains[0]!.gain.linearRampToValueAtTime).toHaveBeenCalledWith(.30,.006);
 expect(gains[1]!.gain.linearRampToValueAtTime.mock.calls[0]![0]).toBe(.22);
 expect(gains[1]!.gain.linearRampToValueAtTime.mock.calls[0]![1]).toBeCloseTo(.236);
 expect(sources[0]!.stop).toHaveBeenCalledWith(.123);
 expect(sources[1]!.stop).toHaveBeenCalledWith(.393);
 ctx.currentTime=.46;audio.playRecordedEffect('drone_release',undefined,undefined,true);expect(sources).toHaveLength(2);
 ctx.currentTime=1.2;audio.playRecordedEffect('drone_release');await vi.waitFor(()=>expect(sources).toHaveLength(3));
 expect(gains[2]!.gain.linearRampToValueAtTime.mock.calls[0]![0]).toBe(.30);audio.dispose();
});
it('maps trigger discharge not projectile expiry and preserves calm worker confirmations',()=>{
  const event={projectileId:'p',kind:'radio' as const,phase:'launch' as const,x:0,y:0,angle:0,radius:4};
  expect(recordedEquipmentCue(event)).toBe('radio_release');
  expect(recordedEquipmentCue({...event,kind:'hunter_beam'})).toBeUndefined();
  expect(recordedEquipmentCue({...event,kind:'drone_laser'},['precision_link'])).toBeUndefined();
  expect(recordedEquipmentCue({...event,kind:'drone_laser'},['shock_mantle'])).toBeUndefined();
  expect(recordedEquipmentCue({...event,kind:'tesla_bolt',phase:'impact'})).toBe('tesla_control');
  expect(recordedEquipmentCue({...event,phase:'release'})).toBeUndefined();
  expect(recordedEquipmentCue({...event,worker:true})).toBeUndefined();
  expect(recordedEquipmentCue({...event,kind:'extinguisher'})).toBe('extinguisher_release');
  expect(recordedEquipmentCue({...event,phase:'impact',actorKind:'RUNAWAY_CART'})).toBe('impact_steel');
  expect(recordedEquipmentCue({...event,phase:'impact',actorKind:'FALLING_DEBRIS'})).toBe('impact_concrete');
  expect(recordedEquipmentCue({...event,phase:'impact',actorKind:'GAS_LEAK'})).toBeUndefined();
});
it('preloads Wave 1 once and replaces repeated shot synthesis with a rate-limited recording',async()=>{
  const {sources}=context(),audio=new SurvivorsSessionAudio();
  expect(await audio.preloadEquipmentRecordings()).toBe(true);expect(await audio.preloadEquipmentRecordings()).toBe(true);
  expect(fetch).toHaveBeenCalledTimes(30);
  for(let i=0;i<100;i++)audio.playEquipmentFeedback({projectileId:String(i),kind:'radio',phase:'launch',x:0,y:0,angle:0,radius:4},{x:0,y:0});
  await vi.waitFor(()=>expect(sources).toHaveLength(1));expect(audio.voiceCount).toBe(1);
  audio.silence();expect(sources[0]!.stop).toHaveBeenCalled();expect(audio.voiceCount).toBe(0);audio.dispose();
});
it('validates all V2 hashes, decoded peak headroom and pending listening status',()=>{
 expect(ingestV2).toHaveLength(43);
 for(const row of ingestV2){
  expect(createHash('sha256').update(readFileSync('public'+row.uri)).digest('hex')).toBe(row.sha256);
  expect(row.status).toBe('CANDIDATE');expect(row.listeningApproval).toBe(false);
  expect(row.runtimeOverFullScaleSamples).toBe(0);expect(row.runtimePeakDbfs).toBeLessThan(0);
 }
 expect(recordedSfxFamily('radio_release')).toHaveLength(3);expect(recordedSfxFamily('drone_hunter_burst')).toHaveLength(2);
 expect(RECORDED_SFX.every(asset=>!asset.id.startsWith('footstep')&&asset.id!=='site_night')).toBe(true);
});
it('shuffles complete bags with no adjacent repeats and does not consume global randomness',()=>{
 const random=vi.spyOn(Math,'random').mockImplementation(()=>{throw new Error('Gameplay randomness consumed');});
 for(const count of [1,2,3,4]){
  const a=new RecordedSfxVariants(),b=new RecordedSfxVariants();
  const frames=Array.from({length:count*20},()=>a.next('radio',count));
  expect(frames).toEqual(Array.from({length:count*20},()=>b.next('radio',count)));
  for(let i=0;i<frames.length;i+=count)expect(new Set(frames.slice(i,i+count)).size).toBe(count);
  if(count>1)expect(frames.every((frame,i)=>!i||frame!==frames[i-1])).toBe(true);
 }
 expect(random).not.toHaveBeenCalled();expect(()=>new RecordedSfxVariants().next('empty',0)).toThrow();
});
it('routes secured only once per designated boss and retains V1 rollback',async()=>{
 const {sources}=context(),audio=new SurvivorsSessionAudio(),run={};
 const play=vi.spyOn(audio,'playRecordedEffect').mockReturnValue(true);
 expect(audio.playEncounterPhase({bossId:'b',phase:'combat'},true,run)).toBe(false);
 expect(audio.playEncounterPhase({bossId:'b',phase:'secured'},false,run)).toBe(false);
 expect(audio.playEncounterPhase({bossId:'b',phase:'secured'},true,run)).toBe(true);
 expect(audio.playEncounterPhase({bossId:'b',phase:'secured'},true,run)).toBe(false);
 expect(play).toHaveBeenCalledExactlyOnceWith('incident_secured');play.mockRestore();
 audio.setRecordedSfxVersion('v1');expect(await audio.preloadEquipmentRecordings()).toBe(true);
 expect(fetch).toHaveBeenCalledTimes(11);expect(audio.playRecordedEffect('incident_secured')).toBe(false);
 audio.playEquipmentFeedback({projectileId:'p',kind:'hunter_beam',phase:'launch',x:0,y:0,angle:0,radius:4},{x:0,y:0});
 await vi.waitFor(()=>expect(sources).toHaveLength(1));audio.dispose();
});
it('caps asynchronous admitted effects at 24 voices and cancels pending pause/dispose playback',async()=>{
 const {ctx,sources}=context(),audio=new SurvivorsSessionAudio();await audio.preloadEquipmentRecordings();
 for(let i=0;i<100;i++){ctx.currentTime=i*.12;audio.playRecordedEffect('radio_release');await Promise.resolve();}
 expect(sources).toHaveLength(100);expect(audio.voiceCount).toBe(24);
 expect(sources.filter(source=>source.stop.mock.calls.length>1).length).toBe(76);audio.dispose();expect(audio.voiceCount).toBe(0);
 for(const cancel of ['silence','dispose'] as const){
  const current=context(),session=new SurvivorsSessionAudio();let resolve!:(value:{duration:number})=>void;
  current.ctx.decodeAudioData.mockImplementation(()=>new Promise(done=>{resolve=done;}));
  session.playRecordedEffect('boss_alert');await vi.waitFor(()=>expect(resolve).toBeDefined());session[cancel]();
  resolve({duration:1.4});await Promise.resolve();await Promise.resolve();expect(current.sources).toHaveLength(0);session.dispose();
 }
});
it('cancels delayed decoded recordings after mute and avoids phantom initial docking sounds',async()=>{
  const {ctx,sources}=context(),audio=new SurvivorsSessionAudio();let resolve!:(value:{duration:number})=>void;
  ctx.decodeAudioData.mockImplementation(()=>new Promise(done=>{resolve=done;}));
  audio.playRecordedEffect('ui_equip');await vi.waitFor(()=>expect(resolve).toBeDefined());
  audio.setMuted(true);resolve({duration:.48});await Promise.resolve();await Promise.resolve();expect(sources).toHaveLength(0);
  const play=vi.spyOn(audio,'playDroneV3').mockReturnValue(true);
  audio.playInspectionPhase('docked',true);expect(play).not.toHaveBeenCalled();
  audio.playInspectionPhase('launching',true);audio.playInspectionPhase('launching',true);expect(play).toHaveBeenCalledTimes(1);
  audio.silence();audio.playInspectionPhase('launching',true);expect(play).toHaveBeenCalledTimes(1);
  audio.playInspectionPhase('returning',false);audio.playInspectionPhase('returning',true);audio.playInspectionPhase('docked',true);
  expect(play.mock.calls.map(call=>call[0])).toEqual(['launch','dock']);audio.dispose();
});
