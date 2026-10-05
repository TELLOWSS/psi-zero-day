// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {afterEach,expect,it,vi} from 'vitest';
import {PatrolSurvivorsGame} from '../src/ui/PatrolSurvivorsGame';
import {SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();localStorage.clear();});
it('pauses live purchases, applies gear without restarting, blocks resume keys, and settles wear/reward once',()=>{
 localStorage.setItem('psi.survivors.store_wallet',JSON.stringify({credits:10000,inventory:{owned:['voice_lens'],equipped:['voice_lens']}}));
 let frame:FrameRequestCallback=()=>{},engine!:SurvivorsEngine;
 vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>{frame=callback;return 1;});vi.stubGlobal('cancelAnimationFrame',vi.fn());
 const ctx=new Proxy({}, {get:(_,key)=>key==='createLinearGradient'||key==='createRadialGradient'?()=>({addColorStop:vi.fn()}):key==='measureText'?()=>({width:10}):vi.fn(),set:()=>true});
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(ctx as CanvasRenderingContext2D);
 const start=SurvivorsEngine.prototype.start;
 vi.spyOn(SurvivorsEngine.prototype,'start').mockImplementation(function(this:SurvivorsEngine){engine=this;start.call(this);});
 const host=document.createElement('div'),root=createRoot(host);
 const click=(text:string)=>act(()=>[...host.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent?.trim()===text)!.click());
 const tick=()=>act(()=>frame(performance.now()+16));
 try{
  act(()=>root.render(<PatrolSurvivorsGame onExit={()=>{}} audioMuted/>));click('순찰 시작하기');
  engine.state.player.hp=40;engine.state.gameTime=100;
  click('PSI 상점');expect(engine.state.phase).toBe('paused');
  act(()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyP'})));expect(engine.state.phase).toBe('paused');
  const mantle=[...host.querySelectorAll('article')].find(card=>card.textContent?.includes('충격 흡수 맨틀'))!;
  act(()=>mantle.querySelector<HTMLButtonElement>('button')!.click());
  expect(JSON.parse(localStorage.getItem('psi.survivors.store_wallet')!).credits).toBe(4800);
  act(()=>mantle.querySelector<HTMLButtonElement>('button')!.click());
  expect(engine.state.premiumGear?.equipped).toEqual(['voice_lens','shock_mantle']);
  expect(engine.state.player.maxHp).toBe(120);expect(engine.state.player.hp).toBe(40);expect(engine.state.gameTime).toBe(100);
  act(()=>host.querySelector<HTMLButtonElement>('[aria-label="장비실 닫기"]')!.click());expect(engine.state.phase).toBe('paused');
  click('순찰 재개');expect(engine.state.phase).toBe('playing');
  vi.spyOn(engine,'update').mockImplementation(()=>{engine.state.phase='victory';engine.state.psiCredits=50;engine.state.starsEarned=[true,false,false];});
  tick();tick();tick();
  const wallet=JSON.parse(localStorage.getItem('psi.survivors.store_wallet')!);
  expect(wallet.credits).toBe(4850);expect(wallet.inventory.durability).toEqual({voice_lens:85,shock_mantle:85});
  expect(host.querySelector('.survivors-clear-maintenance')?.textContent).toContain('85/100');
  expect(host.querySelector('.survivors-results-grid')?.textContent).toContain('+50 PSI');
  const starts=vi.mocked(SurvivorsEngine.prototype.start).mock.calls.length;
  click('같은 작전 다시 준비');
  expect(vi.mocked(SurvivorsEngine.prototype.start).mock.calls.length).toBe(starts);
  expect(host.textContent).toContain('순찰 시작하기');
  expect(JSON.parse(localStorage.getItem('psi.survivors.store_wallet')!).credits).toBe(4850);
 }finally{act(()=>root.unmount());}
});
