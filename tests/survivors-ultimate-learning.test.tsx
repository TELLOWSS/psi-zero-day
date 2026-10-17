// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect,vi} from 'vitest';
import {SurvivorsUltimateCoach,SurvivorsUltimateControl} from '../src/ui/SurvivorsUltimateControl';
import {readUltimateLesson,rememberUltimateUse,ultimateReadiness,ULTIMATE_LESSON_KEY} from '../src/ui/survivors-ultimate-learning';
import {SurvivorsEngine,createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
describe('ultimate discovery and explicit activation',()=>{
 it('uses the engine maximum and rejects invalid readiness',()=>{
  expect(ultimateReadiness(75,150)).toEqual({ready:false,percent:50});
  expect(ultimateReadiness(200,150)).toEqual({ready:true,percent:100});
  expect(ultimateReadiness(0,0)).toEqual({ready:false,percent:0});
 });
 it('shows charging, ready and temporarily locked commands',()=>{
  const host=document.createElement('div'),root=createRoot(host),activate=vi.fn();
  try{
   act(()=>root.render(<SurvivorsUltimateControl charge={50} max={200} locked={false} onActivate={activate}/>));
   expect(host.textContent).toContain('충전 25%');expect(host.querySelector('button')!.disabled).toBe(true);
   act(()=>root.render(<SurvivorsUltimateControl charge={200} max={200} locked={true} onActivate={activate}/>));
   expect(host.textContent).toContain('연출 종료 후 사용');expect(host.querySelector('button')!.disabled).toBe(true);
   act(()=>root.render(<SurvivorsUltimateControl charge={200} max={200} locked={false} onActivate={activate}/>));
   act(()=>host.querySelector('button')!.click());expect(activate).toHaveBeenCalledOnce();
  }finally{act(()=>root.unmount());}
 });
 it('focuses the actual cast and allows Escape without activating',()=>{
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),activate=vi.fn(),skip=vi.fn();
  try{
   act(()=>root.render(<SurvivorsUltimateCoach onActivate={activate} onSkip={skip}/>));
   expect(document.activeElement).toBe(host.querySelector('button'));
   act(()=>document.activeElement!.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true})));
   expect(skip).toHaveBeenCalledOnce();expect(activate).not.toHaveBeenCalled();
   act(()=>document.activeElement!.dispatchEvent(new KeyboardEvent('keydown',{key:'f',code:'KeyF',bubbles:true})));
   expect(activate).toHaveBeenCalledOnce();
  }finally{act(()=>root.unmount());host.remove();}
 });
 it('persists successful-use memory without requiring available storage',()=>{
  localStorage.removeItem(ULTIMATE_LESSON_KEY);expect(readUltimateLesson()).toBe(false);
  rememberUltimateUse();expect(readUltimateLesson()).toBe(true);localStorage.removeItem(ULTIMATE_LESSON_KEY);
  const spy=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('blocked');});
  expect(()=>rememberUltimateUse()).not.toThrow();spy.mockRestore();
 });
 it('preserves charge and simulation time during learning, then consumes only a real cast',()=>{
  const state=createInitialSurvivorsState('yoon'),engine=new SurvivorsEngine(state);engine.start();
  state.ultimateCharge=state.maxUltimateCharge-1;expect(engine.triggerDirectorShout()).toBe(false);
  state.ultimateCharge=state.maxUltimateCharge;engine.setPaused(true);const time=state.gameTime;
  engine.update(1,{moveX:1,moveY:0});expect(state.gameTime).toBe(time);expect(state.ultimateCharge).toBe(state.maxUltimateCharge);
  expect(engine.triggerDirectorShout()).toBe(false);engine.setPaused(false);
  expect(engine.triggerDirectorShout()).toBe(true);expect(state.ultimateCharge).toBe(0);expect(state.directorCutinPhase).toBe('cutin');
  expect(engine.triggerDirectorShout()).toBe(false);
 });
});
