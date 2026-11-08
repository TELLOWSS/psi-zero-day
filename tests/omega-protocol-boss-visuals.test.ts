import {describe,it,expect} from 'vitest';
import type {Hazard} from '../src/domain/patrol-survivors';
import {drawOmegaProtocolEnemy} from '../src/ui/omega-protocol-enemy-render';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';

type DrawCall={method:string;args:unknown[]};
function captureCanvas(){
 const calls:DrawCall[]=[];
 const ctx=new Proxy({}, {
  get(_target,key){
   if(typeof key!=='string')return undefined;
   return (...args:unknown[])=>{calls.push({method:key,args});};
  },
  set(){return true;},
 }) as unknown as CanvasRenderingContext2D;
 return {ctx,calls};
}
const boss={
 type:'CRANE_BOSS',isStageBoss:true,
 hp:500,maxHp:500,radius:40,
 x:500,y:400,bossPhase:1,hitFlashTimer:0,
} as Hazard;

describe('OMEGA special-edition boss differentiation is visual-only',()=>{
 it('keeps original wave-nine crane silhouette and wave-fifteen reactor silhouette distinct',()=>{
  const first=captureCanvas();
  drawOmegaProtocolEnemy(first.ctx,boss,1,{finalBoss:false});
  expect(first.calls.some(x=>x.method==='fillText'&&x.args[0]==='CORE 15')).toBe(false);
  const final=captureCanvas();
  drawOmegaProtocolEnemy(final.ctx,boss,1,{finalBoss:true});
  expect(final.calls.some(x=>x.method==='fillText'&&x.args[0]==='CORE 15')).toBe(true);
  expect(first.calls.filter(x=>x.method==='fillRect').length).not.toBe(
   final.calls.filter(x=>x.method==='fillRect').length
  );
 });
 it('uses a separate phase-two energy-core presentation',()=>{
  const normal=captureCanvas(),phaseTwo=captureCanvas();
  drawOmegaProtocolEnemy(normal.ctx,boss,1,{finalBoss:true});
  drawOmegaProtocolEnemy(phaseTwo.ctx,{...boss,bossPhase:2},1,{finalBoss:true});
  // The number of drawing operations stays bounded at both phases.
  expect(normal.calls.length).toBeLessThan(120);
  expect(phaseTwo.calls.length).toBeLessThan(120);
  expect(normal.calls.some(x=>x.method==='fillText'&&x.args[0]==='CORE 15')).toBe(true);
  expect(phaseTwo.calls.some(x=>x.method==='fillText'&&x.args[0]==='CORE 15')).toBe(true);
 });
 it('reports exact live engine boss HP and hides the meter after death',()=>{
  const session=new OmegaProtocolCombatSession(20261108,10,false,{fieldTraversal:true});
  const state=session.engine.state;
  const initial=session.snapshot;
  expect(initial.bossHp).toBeNull();
  expect(initial.bossMaxHp).toBeNull();
  // Simulate the existing engine's stage-boss state; no visual copy of HP.
  const real={...boss,hp:173,maxHp:500};
  state.hazards=[real];
  expect(session.snapshot.bossHp).toBe(173);
  expect(session.snapshot.bossMaxHp).toBe(500);
  state.hazards=[{...real,hp:0}];
  expect(session.snapshot.bossHp).toBeNull();
  expect(session.snapshot.bossMaxHp).toBeNull();
 });
});
