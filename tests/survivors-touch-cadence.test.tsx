// @vitest-environment jsdom
import {act,Profiler} from 'react';
import {createRoot} from 'react-dom/client';
import {it,expect,vi} from 'vitest';
import {PatrolSurvivorsGame} from '../src/ui/PatrolSurvivorsGame';
import {SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
it('updates touch direction immediately without a React commit per move and clears release input',()=>{
 let frame:FrameRequestCallback=()=>{};vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{frame=cb;return 1;});vi.stubGlobal('cancelAnimationFrame',vi.fn());
 const gradient={addColorStop:vi.fn()},ctx=new Proxy({},{get:(_,key)=>key==='createLinearGradient'||key==='createRadialGradient'?()=>gradient:key==='measureText'?()=>({width:10}):vi.fn(),set:()=>true});
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(ctx as CanvasRenderingContext2D);
 let engine!:SurvivorsEngine;const start=SurvivorsEngine.prototype.start;
 vi.spyOn(SurvivorsEngine.prototype,'start').mockImplementation(function(this:SurvivorsEngine){engine=this;start.call(this);});
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);let commits=0;
 const touch=(kind:string,x:number,y:number)=>act(()=>{const e=new Event(kind,{bubbles:true,cancelable:true});Object.defineProperty(e,'changedTouches',{value:[{identifier:1,clientX:x,clientY:y}]});host.querySelector('.survivors-container')!.dispatchEvent(e);});
 try{
  act(()=>root.render(<Profiler id="touch" onRender={()=>commits++}><PatrolSurvivorsGame onExit={()=>{}} audioMuted/></Profiler>));
  act(()=>[...host.querySelectorAll('button')].find(b=>b.textContent==='시그널 워치 시작')!.click());
  const update=vi.spyOn(engine,'update').mockImplementation(()=>{});
  touch('touchstart',100,200);const before=commits;
  for(let i=0;i<20;i++)touch('touchmove',110+i,200);
  expect(commits).toBe(before);expect(host.querySelector<HTMLElement>('.survivors-touch-knob')!.style.transform).toBe('translate3d(29px,0px,0)');
  act(()=>frame(performance.now()+20));expect(update.mock.calls.at(-1)![1].moveX).toBeGreaterThan(0);
  touch('touchmove',45,200);act(()=>frame(performance.now()+40));expect(update.mock.calls.at(-1)![1].moveX).toBe(-1);
  touch('touchend',45,200);act(()=>frame(performance.now()+60));expect(update.mock.calls.at(-1)![1]).toMatchObject({moveX:0,moveY:0});
 }finally{act(()=>root.unmount());host.remove();vi.restoreAllMocks();vi.unstubAllGlobals();localStorage.clear();}
});
