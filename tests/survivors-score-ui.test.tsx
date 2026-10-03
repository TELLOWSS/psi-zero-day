// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { PatrolSurvivorsGame } from '../src/ui/PatrolSurvivorsGame';
import { PERK_CATALOG, SurvivorsEngine } from '../src/engine/patrol-survivors-engine';
import { SurvivorsSessionAudio } from '../src/ui/survivors-session-audio';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
it('preserves evolution cue across perk-choice resume then restores patrol music',()=>{
 let frame:FrameRequestCallback=()=>{}; let clock=0;
 vi.spyOn(performance,'now').mockImplementation(()=>clock);
 vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{frame=cb;return 1;});
 vi.stubGlobal('cancelAnimationFrame',vi.fn());
 const gradient={addColorStop:vi.fn()};
 const ctx=new Proxy({}, {get:(_,key)=>key==='createLinearGradient'||key==='createRadialGradient'?()=>gradient:key==='measureText'?()=>({width:10}):vi.fn(),set:()=>true});
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(ctx as CanvasRenderingContext2D);
 vi.spyOn(SurvivorsSessionAudio.prototype,'getContext').mockReturnValue({currentTime:0} as AudioContext);
 vi.spyOn(SurvivorsSessionAudio.prototype,'preloadApproved').mockResolvedValue(true);
 vi.spyOn(SurvivorsSessionAudio.prototype,'dispose').mockImplementation(()=>{});
 const music=vi.spyOn(SurvivorsSessionAudio.prototype,'auditionScore').mockResolvedValue(true);
 let engine!:SurvivorsEngine;const start=SurvivorsEngine.prototype.start;
 vi.spyOn(SurvivorsEngine.prototype,'start').mockImplementation(function(this:SurvivorsEngine){engine=this;start.call(this);});
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 const tick=()=>act(()=>frame(clock));
 try {
  act(()=>root.render(<PatrolSurvivorsGame onExit={()=>{}} />));
  act(()=>[...host.querySelectorAll('button')].find(b=>b.textContent==='순찰 시작하기')!.click());
  vi.spyOn(engine,'update').mockImplementationOnce(()=>{engine.state.phase='levelup';engine.state.perkOptions=[{...PERK_CATALOG.satellite_broadcast,level:1}];});
  clock=20;tick();music.mockClear();
  act(()=>host.querySelector<HTMLButtonElement>('.survivors-perk-card')!.click());
  expect(engine.state.phase).toBe('playing');
  expect(music.mock.calls.map(([asset])=>asset.id)).toEqual(['patrol.evolution']);
  vi.spyOn(engine,'update').mockImplementation(()=>{});
  clock=500;tick();expect(music.mock.calls).toHaveLength(1);
  clock=4000;tick();expect(music.mock.calls.at(-1)?.[0].id).toBe('patrol.foundation');
 } finally {act(()=>root.unmount());host.remove();vi.restoreAllMocks();vi.unstubAllGlobals();localStorage.clear();}
});
