// @vitest-environment jsdom
import { afterEach,expect,it,vi } from 'vitest';
import { SurvivorsSessionAudio } from '../src/ui/survivors-session-audio';
afterEach(()=>{vi.unstubAllGlobals();});
it('ducking and silence preserve the user Music bus volume and overlapping alert hold',()=>{
 const params: Array<{value:number;setValueAtTime:ReturnType<typeof vi.fn>;linearRampToValueAtTime:ReturnType<typeof vi.fn>;cancelScheduledValues:ReturnType<typeof vi.fn>}> = [];
 const ctx={state:'running',currentTime:2,destination:{},createGain:()=>{
  const gain={value:1,setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),cancelScheduledValues:vi.fn()};params.push(gain);return {gain,connect:vi.fn(),disconnect:vi.fn()};
 }};
 vi.stubGlobal('AudioContext',vi.fn(function(){return ctx;}));
 const audio=new SurvivorsSessionAudio();audio.setVolume('Music',.2);audio.duckMusic(2);ctx.currentTime=2.3;audio.duckMusic(.1);
 const duck=params.find(p=>p.setValueAtTime.mock.calls.some(call=>call[0]===.35))!;
 expect(duck.linearRampToValueAtTime).toHaveBeenLastCalledWith(1,4.18);
 audio.silence();expect(params.some(p=>p.value===.2)).toBe(true);
});
