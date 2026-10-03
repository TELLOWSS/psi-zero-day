// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { selectPatrolScore } from '../src/domain/survivors-score';
import { SURVIVORS_SCORE_CANDIDATES } from '../src/app/survivors-audio-manifest';
import { SurvivorsSessionAudio } from '../src/ui/survivors-session-audio';
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
it('uses hysteresis so danger oscillation does not chatter between scores', () => {
 expect(selectPatrolScore(1, 18, false, 'foundation')).toBe('pressure');
 expect(selectPatrolScore(1, 12, false, 'pressure')).toBe('pressure');
 expect(selectPatrolScore(1, 10, false, 'pressure')).toBe('foundation');
 expect(selectPatrolScore(1, 0, true, 'foundation')).toBe('heavy_risk');
 expect(selectPatrolScore(.4, 0, false, 'heavy_risk')).toBe('heavy_risk');
});
function context() {
 const sources: {start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; onended: null | (() => void)}[] = [];
 const gain = () => ({connect: vi.fn(), disconnect: vi.fn(), gain: {value: 1, cancelScheduledValues: vi.fn(), setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn()}});
 const ctx = {state: 'running',currentTime: 0,destination: {},close: vi.fn(async () => {}),createGain: gain,decodeAudioData: vi.fn(async () => ({duration: 77})),createBufferSource: vi.fn(() => {const s={connect: vi.fn(),start: vi.fn(),stop: vi.fn(),disconnect: vi.fn(),onended: null}; sources.push(s);return s;})};
 vi.stubGlobal('AudioContext',vi.fn(function(){return ctx;}));
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)})));
 return {ctx,sources};
}
it('deduplicates score, cancels scheduled loops on mute, restarts on unmute', async () => {
 vi.useFakeTimers(); const {sources}=context();const a=new SurvivorsSessionAudio(); const asset=SURVIVORS_SCORE_CANDIDATES[0]!;
 expect(await a.auditionScore(asset)).toBe(true);await a.auditionScore(asset);expect(sources).toHaveLength(1);
 a.setMuted(true);expect(sources[0]!.stop).toHaveBeenCalled();await vi.runAllTimersAsync();expect(sources).toHaveLength(1);
 a.setMuted(false);await a.auditionScore(asset);expect(sources).toHaveLength(2);a.dispose();expect(vi.getTimerCount()).toBe(0);
});
it('rejects unapproved or incomplete assets and cancels late decode after exit', async () => {
 const {ctx,sources}=context(); let resolve!: (value: {duration:number}) => void;
 ctx.decodeAudioData.mockImplementation(()=>new Promise(r=>{resolve=r;}));
 const a=new SurvivorsSessionAudio(); const asset=SURVIVORS_SCORE_CANDIDATES[0]!;
 expect(await a.auditionScore({...asset,rights:null})).toBe(false);
 const pending=a.auditionScore(asset);await vi.waitFor(()=>expect(resolve).toBeDefined());a.silence();resolve({duration:77});
 expect(await pending).toBe(false);expect(sources).toHaveLength(0);a.dispose();
});
