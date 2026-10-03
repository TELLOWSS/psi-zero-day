// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { PatrolSurvivorsGame } from '../src/ui/PatrolSurvivorsGame';
import { PERK_CATALOG, SurvivorsEngine } from '../src/engine/patrol-survivors-engine';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
it('selects numbered upgrades, ignores held-key repeats and installs the global listener once',()=>{
  let frame:FrameRequestCallback=()=>{};
  vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{frame=cb;return 1;});
  vi.stubGlobal('cancelAnimationFrame',vi.fn());
  const gradient={addColorStop:vi.fn()};
  const ctx=new Proxy({}, {get:(_,key)=>key==='createLinearGradient'||key==='createRadialGradient'?()=>gradient:key==='measureText'?()=>({width:10}):vi.fn(),set:()=>true});
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(ctx as CanvasRenderingContext2D);
  const events=vi.spyOn(window,'addEventListener');
  let engine:SurvivorsEngine;
  const original=SurvivorsEngine.prototype.start;
  vi.spyOn(SurvivorsEngine.prototype,'start').mockImplementation(function(this:SurvivorsEngine){engine=this;original.call(this);});
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  const tick=()=>act(()=>frame(performance.now()+20));
  try {
    act(()=>root.render(<PatrolSurvivorsGame onExit={()=>{}} audioMuted />));
    act(()=>[...host.querySelectorAll('button')].find(b=>b.textContent==='순찰 시작하기')!.click());
    vi.spyOn(engine!,'update').mockImplementation(()=>{});
    const levelup=()=>{engine!.state.phase='playing';vi.mocked(engine!.update).mockImplementationOnce(()=>{engine!.state.phase='levelup';engine!.state.perkOptions=[{...PERK_CATALOG.steel_boots,level:1},{...PERK_CATALOG.magnet_beacon,level:1}];});tick();};
    levelup();
    expect(host.querySelector('button.survivors-perk-card')?.getAttribute('aria-keyshortcuts')).toBe('1');
    act(()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'Digit2',cancelable:true})));
    expect(engine!.state.activePerks.magnet_beacon).toBe(1);expect(engine!.state.phase).toBe('playing');
    levelup();
    act(()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'Digit1',repeat:true})));
    expect(engine!.state.phase).toBe('levelup');expect(engine!.state.activePerks.steel_boots).toBe(0);
    act(()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'Digit1',cancelable:true})));
    expect(engine!.state.activePerks.steel_boots).toBe(1);expect(engine!.state.phase).toBe('playing');
    vi.mocked(engine!.update).mockImplementationOnce(()=>engine!.addExp(100));
    tick();
    let queuedChoices=0;
    while(engine!.state.phase==='levelup' && queuedChoices<8) {
      const beforeLevel=engine!.state.level;
      const card=host.querySelector<HTMLButtonElement>('button.survivors-perk-card')!;
      expect(card).toBeTruthy();
      expect(card.textContent).toContain(`LV ${engine!.state.perkOptions[0]!.level}`);
      act(()=>card.click());queuedChoices++;
      if(engine!.state.phase==='levelup') expect(engine!.state.level).toBe(beforeLevel+1);
    }
    expect(queuedChoices).toBeGreaterThan(1);expect(engine!.state.phase).toBe('playing');
    tick();tick();
    expect(events.mock.calls.filter(([name])=>name==='keydown')).toHaveLength(1);
  } finally {act(()=>root.unmount());host.remove();vi.restoreAllMocks();vi.unstubAllGlobals();localStorage.clear();}
});
