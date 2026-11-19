import {describe,it,expect} from 'vitest';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';
import {omegaCombatProbeMode,omegaSetupCombatProbe} from '../src/ui/omega-combat-browser-probe';

const original=(mode:'combatGun'|'combatBlade'|'combatRear'|'combatCover')=>{
 const session=new OmegaProtocolCombatSession(20261108,50,false,{fieldTraversal:true});
 const initialCount=session.engine.state.hazards.length;
 const fixture=omegaSetupCombatProbe(session,mode);
 return {session,initialCount,fixture};
};
describe('M02 DEV-only native zombie combat browser fixture',()=>{
 it('never enables a QA state from an ordinary query',()=>{
  expect(omegaCombatProbeMode('')).toBeNull();
  expect(omegaCombatProbeMode('?omegaQaState=reward')).toBeNull();
  expect(omegaCombatProbeMode('?omegaQaState=combatGun')).toBe('combatGun');
  expect(omegaCombatProbeMode('?omegaQaState=combatBlade')).toBe('combatBlade');
  expect(omegaCombatProbeMode('?omegaQaState=combatRear')).toBe('combatRear');
  expect(omegaCombatProbeMode('?omegaQaState=combatCover')).toBe('combatCover');
 });
 it.each(['combatGun','combatBlade','combatRear','combatCover'] as const)(
  '%s uses the ACTUAL infected Watch hazard and freezes no gameplay engine',
  mode=>{
   const {session,initialCount,fixture}=original(mode);
   expect(initialCount).toBeGreaterThan(1);
   const state=session.engine.state;
   expect(state.hazards).toHaveLength(1);
   expect(state.hazards[0]?.id).toBe(fixture.zombieId);
   expect(state.hazards[0]?.type).toBe('UNHELMETED');
   expect(state.hazards[0]?.hp).toBe(800);
   expect(state.hazards[0]?.speed).toBe(0);
   expect(fixture.initialHp).toBe(800);
   expect(state.phase).toBe('playing');
   expect(state.player.invincibleTime).toBeGreaterThan(100);
   expect(fixture.gunEnabled).toBe(mode==='combatGun'||mode==='combatCover');
  },
 );
 it('positions an IN-RANGE infected zombie across the REAL world barrier',()=>{
  const {session,fixture}=original('combatCover');
  expect(fixture.coverDetour).toBe(true);
  const zombie=session.engine.state.hazards[0]!;
  const hero=session.engine.state.player;
  const distance=Math.hypot(zombie.x-hero.x,zombie.y-hero.y);
  expect(distance).toBeLessThan(105+zombie.radius);
  expect(session.field?.plan.obstacles.some(o=>o.kind==='barrier')).toBe(true);
  const beforeHp=zombie.hp;
  const swing=session.blade(); // native OMEGA sword engine
  expect(swing?.combo).toBe(1);
  expect(swing?.hits).toBe(0);
  expect(zombie.hp).toBe(beforeHp);
 });
 it('starts with a genuine radio weapon and can damage the same zombie in-game',()=>{
  const {session}=original('combatGun');
  const state=session.engine.state;
  const hp=state.hazards[0]!.hp;
  for(let i=0;i<120;i++)session.update(1/60,{moveX:0,moveY:0,triggerAction:true});
  const events=session.engine.drainProjectileFeedback();
  expect(state.hazards[0]!.hp).toBeLessThan(hp);
  expect(events.some(e=>e.kind==='radio'&&e.targetId===state.hazards[0]!.id&&
   e.phase==='impact'&&(e.appliedDamage??0)>0)).toBe(true);
 });
});
