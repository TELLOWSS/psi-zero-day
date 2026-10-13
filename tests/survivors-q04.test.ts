// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { SurvivorsEngine } from '../src/engine/patrol-survivors-engine';
import { completedOperation } from './fixtures/survivors-completed-operation';
import { SurvivorsSessionAudio } from '../src/ui/survivors-session-audio';
import { DIRECTOR_SHOUT_VOICE, SURVIVORS_AUDIO_MANIFEST } from '../src/app/survivors-audio-manifest';
import type { SurvivorsAudioAsset } from '../src/domain/survivors-audio';
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
it('engine emits real shots, impacts, controls and terminal events once and drain consumes them',()=>{
 const e=new SurvivorsEngine();e.start();e.state.player.critRate=0;
 e.state.hazards.push({id:'target',type:'UNHELMETED',x:e.state.player.x+100,y:e.state.player.y,hp:1,maxHp:1,speed:0,radius:20,damage:0,expValue:1});
 e.update(1/60,{moveX:0,moveY:0});const first=e.drainAudioEvents();expect(first.some(ev=>ev.type==='shoot')).toBe(true);expect(e.drainAudioEvents()).toEqual([]);
 for(let i=0;i<40;i++)e.update(1/60,{moveX:0,moveY:0});
 const events=e.drainAudioEvents();expect(events.some(ev=>ev.type==='impact')).toBe(true);expect(events.some(ev=>ev.type==='control')).toBe(true);
 expect(new Set([...first,...events].map(ev=>ev.id)).size).toBe(first.length+events.length);
 const result=new SurvivorsEngine();result.start();completedOperation(result.state);result.update(1/60,{moveX:0,moveY:0});result.update(1,{moveX:0,moveY:0});
 expect(result.drainAudioEvents().filter(ev=>ev.type==='win')).toHaveLength(1);
});
it('no missing/unsigned manifest asset can be promoted or trigger decoding',async()=>{
 const audio=new SurvivorsSessionAudio();const fetchMock=vi.fn();vi.stubGlobal('fetch',fetchMock);
 expect(await audio.playApproved(SURVIVORS_AUDIO_MANIFEST)).toBe(false);expect(fetchMock).not.toHaveBeenCalled();
 expect(SURVIVORS_AUDIO_MANIFEST.every(a=>a.status==='MISSING_FINAL' && a.uri===null)).toBe(true);
});
function mockContext() {
 const starts:number[]=[];
 const param={value:1,cancelScheduledValues:vi.fn(),setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn()};
 const gain=()=>({gain:{...param},connect:vi.fn(),disconnect:vi.fn()});
 const context={state:'running',currentTime:2,createGain:gain,destination:{},resume:()=>Promise.resolve(),close:()=>Promise.resolve(),
 decodeAudioData:vi.fn(async()=>({duration:20})),createBufferSource:()=>({connect:vi.fn(),disconnect:vi.fn(),stop:vi.fn(),start:(t:number)=>starts.push(t),onended:null})};
 vi.stubGlobal('AudioContext',vi.fn(function(){return context;}));return {context,starts};
}
const asset=(id:string):SurvivorsAudioAsset=>({id,bus:'Music',uri:`/${id}.ogg`,rights:'test-only fixture',sha256:'fixture',status:'PRODUCTION_APPROVED',loop:true});
it('approved test-fixture stems share a clock, reuse decoded buffers and stop on silence',async()=>{
 const {context,starts}=mockContext();vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)})));
 const audio=new SurvivorsSessionAudio();expect(await audio.playApproved([asset('a'),asset('b')])).toBe(true);
 expect(starts).toEqual([2.05,2.05]);await audio.playApproved([asset('a')]);expect(context.decodeAudioData).toHaveBeenCalledTimes(2);
 audio.silence();expect(audio.voiceCount).toBe(0);audio.dispose();
});
it('decode failure is recorded and asynchronous loading cannot resurrect voices after mute',async()=>{
 const {context}=mockContext();const audio=new SurvivorsSessionAudio();vi.spyOn(console,'warn').mockImplementation(()=>{});
 vi.stubGlobal('fetch',vi.fn(async()=>{throw new Error('offline')}));expect(await audio.playApproved([asset('a')])).toBe(false);expect(audio.failures[0]).toContain('offline');
 let release!:()=>void;const wait=new Promise<void>(resolve=>{release=resolve;});
 vi.stubGlobal('fetch',vi.fn(async()=>{await wait;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(1)};}));
 const pending=audio.playApproved([asset('b')]);audio.silence();release();expect(await pending).toBe(false);expect(audio.voiceCount).toBe(0);
 expect(context.decodeAudioData).toHaveBeenCalledOnce();audio.dispose();
});
it('important alerts cannot be evicted by low-priority chatter and mute blocks new context use',()=>{
 const audio=new SurvivorsSessionAudio();const voice=()=>({disconnect:vi.fn(),stop:vi.fn(),onended:null});
 for(let i=0;i<24;i++)expect(audio.track(voice() as unknown as AudioScheduledSourceNode,{disconnect:vi.fn()} as unknown as AudioNode,4)).toBe(true);
 expect(audio.track(voice() as unknown as AudioScheduledSourceNode,{disconnect:vi.fn()} as unknown as AudioNode,1)).toBe(false);
 expect(audio.voiceCount).toBe(24);audio.setMuted(true);expect(audio.voiceCount).toBe(0);expect(audio.getContext()).toBeNull();audio.dispose();
});

it('supplied shout warms the cache without playing, reuses it once and obeys mute',async()=>{
 const {context,starts}=mockContext();
 const fetchMock=vi.fn(async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)}));vi.stubGlobal('fetch',fetchMock);
 const audio=new SurvivorsSessionAudio();
 expect(await audio.preloadApproved([DIRECTOR_SHOUT_VOICE])).toBe(true);
 expect(starts).toEqual([]);expect(audio.voiceCount).toBe(0);
 expect(await audio.playApproved([DIRECTOR_SHOUT_VOICE])).toBe(true);
 expect(starts).toEqual([2.05]);expect(fetchMock).toHaveBeenCalledOnce();expect(context.decodeAudioData).toHaveBeenCalledOnce();
 audio.setMuted(true);expect(audio.voiceCount).toBe(0);
 expect(await audio.playApproved([DIRECTOR_SHOUT_VOICE])).toBe(false);
 expect(await audio.preloadApproved([DIRECTOR_SHOUT_VOICE])).toBe(false);audio.dispose();
});
