// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {DRONE_V3_ASSETS} from '../src/app/survivors-drone-sfx-v3';
import {SurvivorsSessionAudio} from '../src/ui/survivors-session-audio';

afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});

it('shares fire admission across base, premium and hunter and softens repetition without cutting authored tails',async()=>{
 const sources:Array<{start:ReturnType<typeof vi.fn>;stop:ReturnType<typeof vi.fn>}>=[];
 const gains:Array<{gain:{linearRampToValueAtTime:ReturnType<typeof vi.fn>}}>=[];
 const ctx={state:'running',currentTime:0,destination:{},close:vi.fn(async()=>{}),decodeAudioData:vi.fn(async()=>({duration:.48})),
  createGain:()=>{const node={connect:vi.fn(),disconnect:vi.fn(),gain:{value:1,setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),cancelScheduledValues:vi.fn()}};gains.push(node);return node;},
  createBufferSource:()=>{const node={connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),onended:null,playbackRate:{value:1}};sources.push(node);return node;}};
 vi.stubGlobal('AudioContext',vi.fn(function(){return ctx;}));
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(16)})));
 const audio=new SurvivorsSessionAudio();await audio.preloadEquipmentRecordings();gains.length=0;
 audio.playDroneV3('base_release');await vi.waitFor(()=>expect(sources).toHaveLength(1));
 for(let i=1;i<22;i++){ctx.currentTime=i*.01;audio.playDroneV3(i%2?'premium_release':'hunter_a');}
 expect(sources).toHaveLength(1);
 ctx.currentTime=.23;audio.playDroneV3('hunter_b');await vi.waitFor(()=>expect(sources).toHaveLength(2));
 expect(gains[0]!.gain.linearRampToValueAtTime.mock.calls[0]![0]).toBe(.58);
 expect(gains[1]!.gain.linearRampToValueAtTime.mock.calls[0]![0]).toBeCloseTo(.60*.72);
 expect(sources[0]!.stop).toHaveBeenCalledWith(.483);
 ctx.currentTime=.5;audio.playDroneV3('premium_release',undefined,undefined,true);expect(sources).toHaveLength(2);
 ctx.currentTime=.54;audio.playDroneV3('premium_release',undefined,undefined,true);await vi.waitFor(()=>expect(sources).toHaveLength(3));
 ctx.currentTime=1.5;audio.playDroneV3('premium_release');await vi.waitFor(()=>expect(sources).toHaveLength(4));
 expect(gains[3]!.gain.linearRampToValueAtTime.mock.calls[0]![0]).toBe(.62);
 audio.silence();ctx.currentTime=1.51;audio.playDroneV3('base_release');await vi.waitFor(()=>expect(sources).toHaveLength(5));
 expect(gains[4]!.gain.linearRampToValueAtTime.mock.calls[0]![0]).toBe(.58);audio.dispose();
});

it('locks the six V3 runtime files to their reviewed hashes',()=>{
  expect(DRONE_V3_ASSETS).toHaveLength(6);
  for(const asset of DRONE_V3_ASSETS){
    expect(asset.status).toBe('CANDIDATE');
    expect(asset.loop).toBe(false);
    expect(asset.uri).toContain('/assets/survivors/drone-sfx-v3/');
    expect(createHash('sha256').update(readFileSync('public'+asset.uri)).digest('hex')).toBe(asset.sha256);
  }
});

it('routes base, premium and hunter shots to distinct V3 identities',()=>{
  const audio=new SurvivorsSessionAudio();
  const play=vi.spyOn(audio,'playDroneV3').mockReturnValue(true);
  const event={projectileId:'d',kind:'drone_laser' as const,phase:'launch' as const,x:10,y:20,angle:0,radius:4};
  const listener={x:0,y:0};

  audio.playEquipmentFeedback(event,listener,false,[]);
  audio.playEquipmentFeedback({...event,projectileId:'p'},listener,false,['precision_link']);
  audio.playEquipmentFeedback({...event,projectileId:'h1',kind:'hunter_beam'},listener,false,[]);
  audio.playEquipmentFeedback({...event,projectileId:'h2',kind:'hunter_beam'},listener,false,[]);

  expect(play.mock.calls.map(call=>call[0])).toEqual(['base_release','premium_release','hunter_a','hunter_b']);
  expect(play.mock.calls[0]?.[4]).toBe(.985);
  expect(play.mock.calls[1]?.[4]).toBe(1);
  expect(play.mock.calls[2]?.[4]).toBe(1);
  expect(play.mock.calls[3]?.[4]).toBe(1);
  audio.dispose();
});

it('does not route V3 through gameplay RNG or the rejected V1 drone cue',()=>{
  const random=vi.spyOn(Math,'random');
  const audio=new SurvivorsSessionAudio();
  const play=vi.spyOn(audio,'playDroneV3').mockReturnValue(true);
  const event={projectileId:'d',kind:'drone_laser' as const,phase:'launch' as const,x:0,y:0,angle:0,radius:4};
  for(let i=0;i<6;i++)audio.playEquipmentFeedback({...event,projectileId:String(i)},{x:0,y:0},false,[]);
  expect(play).toHaveBeenCalledTimes(6);
  expect(random).not.toHaveBeenCalled();
  audio.dispose();
});
