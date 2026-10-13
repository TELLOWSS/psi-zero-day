// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { SurvivorsEngine } from '../src/engine/patrol-survivors-engine';
import { PlayerVoiceDirection } from '../src/ui/survivors-player-voice-direction';
import { SurvivorsSessionAudio } from '../src/ui/survivors-session-audio';
import { PLAYER_VOICE_ASSETS, PLAYER_VOICE_BANKS, playerVoiceAsset, sanitizePlayerVoiceVersion, playerVoiceGain } from '../src/app/survivors-player-voice';
import { DIRECTOR_SHOUT_VOICE } from '../src/app/survivors-audio-manifest';
import p0 from '../content/survivors-player-voice-v1-ingest.json';
import p1 from '../content/survivors-player-voice-p1-v1-ingest.json';
import covert from '../content/survivors-player-voice-covert-v1-ingest.json';
import engineer from '../content/survivors-player-voice-engineer-v1-ingest.json';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it('keeps all voice banks complete, original bytes intact and conservative sample-peak gain',()=>{
  expect(sanitizePlayerVoiceVersion('unknown')).toBe('original');
  for(const version of ['original','covert','engineer'] as const){
    expect(sanitizePlayerVoiceVersion(version)).toBe(version);
    expect(PLAYER_VOICE_BANKS[version]).toHaveLength(26);
    for(const original of PLAYER_VOICE_ASSETS){
      const match=original.id.match(/^PSI_V_PLAYER_(.+)_([AB])_v01$/)!;
      const asset=playerVoiceAsset(match[1] as Parameters<typeof playerVoiceAsset>[0],match[2]==='A'?0:1,version);
      const row=[...p0.assets,...p1.assets,...covert.assets,...engineer.assets].find(row=>row.file.replace('.wav','')===asset.id)!;
      expect(asset.status).toBe('CANDIDATE');
      expect(createHash('sha256').update(readFileSync('public'+asset.uri)).digest('hex')).toBe(asset.sha256);
      expect(row.peakDbFS+20*Math.log10(playerVoiceGain(asset))).toBeLessThanOrEqual(-3+1e-9);
    }
  }
});
function context() {
  const sources: Array<{start:ReturnType<typeof vi.fn>;stop:ReturnType<typeof vi.fn>;onended:(()=>void)|null}> = [];
  const ctx = {state:'running',currentTime:0,destination:{},close:vi.fn(async()=>{}),
    createGain:()=>({connect:vi.fn(),disconnect:vi.fn(),gain:{value:1,setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),cancelScheduledValues:vi.fn()}}),
    decodeAudioData:vi.fn(async()=>({duration:3})),createBufferSource:()=>{
      const source={connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),onended:null as (()=>void)|null}; sources.push(source); return source;
    }};
  vi.stubGlobal('AudioContext',vi.fn(function(){return ctx;}));
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)})));
  return {ctx,sources};
}
it('keeps all 26 supplied recordings intact and does not invent final approval',()=>{
  expect(PLAYER_VOICE_ASSETS).toHaveLength(26);
  for (const asset of PLAYER_VOICE_ASSETS) {
    expect(asset.status).toBe('CANDIDATE');
    const row=[...p0.assets,...p1.assets].find(row=>asset.id===row.file.replace('.wav',''))!;
    expect(playerVoiceGain(asset)).toBeGreaterThan(0);
    expect(row.peakDbFS+20*Math.log10(playerVoiceGain(asset))).toBeLessThanOrEqual(-3+1e-9);
    expect(createHash('sha256').update(readFileSync('public'+asset.uri)).digest('hex')).toBe(asset.sha256);
  }
});
it('secured confirmation is once per boss and warning outranks a simultaneous HP crossing',()=>{
  const e=new SurvivorsEngine(),d=new PlayerVoiceDirection();e.state.characterId='player';e.start();d.observe(e.state);
  e.state.bossEncounter={bossId:'crane',phase:'secured',remaining:2};
  expect(d.observe(e.state)?.cue).toBe('SECURED');expect(d.observe(e.state)).toBeUndefined();
  e.state.player.hp=e.state.player.maxHp*.2;
  e.state.hazards=[{id:'cart',type:'RUNAWAY_CART',x:e.state.player.x,y:e.state.player.y,hp:10,maxHp:10,speed:0,radius:10,damage:0,expValue:0,
    motion:{phase:'warning',timer:1,directionX:1,directionY:0}}];
  expect(d.observe(e.state)?.cue).toBe('CART_WARNING');expect(d.observe(e.state)).toBeUndefined();
});
it('starts once, warns on a crossing with hysteresis/cooldown and never resumes old speech',()=>{
  const engine=new SurvivorsEngine(), direction=new PlayerVoiceDirection(), state=engine.state;state.characterId='player';
  expect(direction.observe(state)).toBeUndefined(); engine.start(); expect(direction.observe(state)?.cue).toBe('START');
  expect(direction.observe(state)).toBeUndefined(); state.player.hp=state.player.maxHp*.29;
  expect(direction.observe(state)?.cue).toBe('LOW_HP'); expect(direction.observe(state)).toBeUndefined();
  state.player.hp=state.player.maxHp*.41; direction.observe(state); state.player.hp=state.player.maxHp*.2;
  expect(direction.observe(state)).toBeUndefined(); state.gameTime=21; state.player.hp=state.player.maxHp*.5; direction.observe(state);
  state.phase='paused';state.player.hp=state.player.maxHp*.2; expect(direction.observe(state)).toBeUndefined();
  state.phase='playing'; expect(direction.observe(state)).toBeUndefined();
});
it('uses nearby real warning transitions, suppresses repeats, and keeps lifting wording specific',()=>{
  const e=new SurvivorsEngine(), d=new PlayerVoiceDirection();e.state.characterId='player'; e.start();d.observe(e.state);
  const h={id:'cart',type:'RUNAWAY_CART' as const,x:e.state.player.x,y:e.state.player.y,hp:10,maxHp:10,speed:0,radius:10,damage:0,expValue:0,
    motion:{phase:'warning' as const,timer:1,directionX:1,directionY:0}};
  e.state.hazards=[h];expect(d.observe(e.state)?.cue).toBe('CART_WARNING');expect(d.observe(e.state)).toBeUndefined();
  e.state.hazards=[];d.observe(e.state);e.state.hazards=[{...h,id:'cart2'}];expect(d.observe(e.state)).toBeUndefined();
  e.state.gameTime=9;e.state.hazards=[{...h,id:'far',x:h.x+1000}];expect(d.observe(e.state)).toBeUndefined();
  e.state.hazards=[{...h,id:'debris',type:'FALLING_DEBRIS'}];expect(d.observe(e.state)).toMatchObject({cue:'FALL_WARNING',variant:0});
});
it('does not speak for other characters and selects a final-map-specific clear',()=>{
  const e=new SurvivorsEngine(),d=new PlayerVoiceDirection();e.state.characterId='kang_taesik';e.start();expect(d.observe(e.state)).toBeUndefined();
  e.state.characterId='player';e.state.stageId='stage_50';e.state.phase='victory';expect(d.observe(e.state)?.cue).toBe('FINAL_CLEAR');
  const other=new SurvivorsEngine(), clear=new PlayerVoiceDirection();other.state.characterId='player';other.start();clear.observe(other.state);
  other.state.phase='victory';expect(clear.observe(other.state)?.cue).toBe('CLEAR');expect(clear.observe(other.state)).toBeUndefined();
});
it('urgent voice replaces low priority, equal priority is dropped, shout owns the voice bus',async()=>{
  const {sources}=context(),audio=new SurvivorsSessionAudio();
  expect(await audio.playPlayerVoice('START',40)).toBe(true);
  expect(await audio.playPlayerVoice('SECURED',30)).toBe(false);
  expect(await audio.playPlayerVoice('CART_WARNING',100)).toBe(true);expect(sources[0]!.stop).toHaveBeenCalled();
  expect(await audio.playPlayerVoice('FALL_WARNING',100)).toBe(false);
  expect(await audio.playApproved([DIRECTOR_SHOUT_VOICE])).toBe(true);
  expect(await audio.playPlayerVoice('LOW_HP',90)).toBe(false);
  sources.at(-1)!.onended!();expect(await audio.playPlayerVoice('CLEAR',85)).toBe(true);audio.dispose();
});
it('cancels pending decoding on pause/mute and discards late warnings without replay',async()=>{
  const {ctx,sources}=context(),audio=new SurvivorsSessionAudio();let resolve!:(value:{duration:number})=>void;
  ctx.decodeAudioData.mockImplementation(()=>new Promise(done=>{resolve=done;}));
  const pending=audio.playPlayerVoice('START',40);await vi.waitFor(()=>expect(ctx.decodeAudioData).toHaveBeenCalledOnce());
  audio.cancelPlayerVoice();resolve({duration:3});expect(await pending).toBe(false);expect(sources).toHaveLength(0);
  const late=audio.playPlayerVoice('CART_WARNING',100);await vi.waitFor(()=>expect(ctx.decodeAudioData).toHaveBeenCalledTimes(2));
  ctx.currentTime=2;resolve({duration:3});expect(await late).toBe(false);expect(sources).toHaveLength(0);
  audio.setMuted(true);expect(await audio.playPlayerVoice('CLEAR',85)).toBe(false);audio.dispose();
});
it('preserves urgent speech when equal-priority effects saturate the shared voice budget',async()=>{
  const {ctx,sources}=context(),audio=new SurvivorsSessionAudio();await audio.playPlayerVoice('CART_WARNING',100);
  const speech=sources[0]!;
  for(let i=0;i<24;i++)audio.track(ctx.createBufferSource() as unknown as AudioBufferSourceNode,ctx.createGain() as unknown as GainNode,4);
  expect(speech.stop).not.toHaveBeenCalled();
  expect(sources[1]!.stop).toHaveBeenCalledOnce();
  expect(await audio.playPlayerVoice('SECURED',30)).toBe(false);
  expect(await audio.playPlayerVoice('FALL_WARNING',100)).toBe(false);
  audio.setMuted(true);expect(speech.stop).toHaveBeenCalled();audio.dispose();
});
it('allows a delayed opening but still expires it and cancels pending speech on pause',async()=>{
  const {ctx,sources}=context(),audio=new SurvivorsSessionAudio();
  const engine=new SurvivorsEngine();engine.state.characterId='player';engine.start();
  const request=new PlayerVoiceDirection().observe(engine.state)!;
  expect(request).toMatchObject({cue:'START',expires:8});
  let resolve!:(value:{duration:number})=>void;
  ctx.decodeAudioData.mockImplementation(()=>new Promise(done=>{resolve=done;}));
  const pending=audio.playPlayerVoice(request.cue,request.priority,request.expires);
  await vi.waitFor(()=>expect(ctx.decodeAudioData).toHaveBeenCalledOnce());
  ctx.currentTime=4;resolve({duration:3});expect(await pending).toBe(true);
  audio.cancelPlayerVoice();expect(sources[0]!.stop).toHaveBeenCalled();
  const late=audio.playPlayerVoice('START',40,request.expires,1);
  await vi.waitFor(()=>expect(ctx.decodeAudioData).toHaveBeenCalledTimes(2));
  ctx.currentTime=13;resolve({duration:3});expect(await late).toBe(false);
  audio.dispose();
});
it('loads the opening recording before issuing the remaining voice requests',async()=>{
  const {ctx}=context(),audio=new SurvivorsSessionAudio();
  let resolve!:(value:{duration:number})=>void;
  ctx.decodeAudioData.mockImplementationOnce(()=>new Promise(done=>{resolve=done;}));
  const pending=audio.preloadPlayerVoice();
  await vi.waitFor(()=>expect(ctx.decodeAudioData).toHaveBeenCalledOnce());
  expect(fetch).toHaveBeenCalledOnce();
  expect(vi.mocked(fetch).mock.calls[0]![0]).toContain('PSI_V_PLAYER_START_A_v01.wav');
  resolve({duration:3});expect(await pending).toBe(true);
  expect(fetch).toHaveBeenCalledTimes(26);audio.dispose();
});
it('preloads only the selected bank and cancels a previous bank pending decode',async()=>{
  const {ctx,sources}=context(),audio=new SurvivorsSessionAudio();
  let resolve!:(value:{duration:number})=>void;
  ctx.decodeAudioData.mockImplementationOnce(()=>new Promise(done=>{resolve=done;}));
  const previous=audio.playPlayerVoice('START',40,8);
  await vi.waitFor(()=>expect(ctx.decodeAudioData).toHaveBeenCalledOnce());
  audio.setPlayerVoiceVersion('covert');resolve({duration:3});
  expect(await previous).toBe(false);expect(sources).toHaveLength(0);
  vi.mocked(fetch).mockClear();expect(await audio.preloadPlayerVoice()).toBe(true);
  expect(fetch).toHaveBeenCalledTimes(26);
  expect(vi.mocked(fetch).mock.calls.every(([uri])=>String(uri).includes('voice-player-covert-v1'))).toBe(true);
  expect(await audio.playPlayerVoice('START',40,8)).toBe(true);
  audio.setPlayerVoiceVersion('engineer');expect(sources[0]!.stop).toHaveBeenCalled();
  expect(await audio.playPlayerVoice('FINAL_CLEAR',85)).toBe(true);
  expect(vi.mocked(fetch).mock.calls.at(-1)![0]).toContain('_FINAL_CLEAR_A_v01_engineer.wav');audio.dispose();
});
