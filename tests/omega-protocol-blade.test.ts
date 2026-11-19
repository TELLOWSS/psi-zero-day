import {describe,it,expect} from 'vitest';
import {
 omegaBladeDamage,omegaBladeEligible,omegaBladeNextCombo,omegaBladeTargetInArc,
 OMEGA_BLADE_COOLDOWN,type OmegaBladeTarget,
} from '../src/domain/omega-protocol-blade';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';

const machine:OmegaBladeTarget={id:'unit-1',x:85,y:0,hp:160,maxHp:160,radius:15,type:'RUNAWAY_CART'};
const input={moveX:1,moveY:0,triggerAction:false};
describe('OMEGA blade is an actual native special-edition hit, not a fake animation',()=>{
 it('honors facing/range and admits fictional helmet-zombies only in this special-edition blade system',()=>{
  const origin={x:0,y:0};
  expect(omegaBladeTargetInArc(origin,machine,{x:1,y:0})).toBe(true);
  expect(omegaBladeTargetInArc(origin,machine,{x:-1,y:0})).toBe(false);
  expect(omegaBladeTargetInArc(origin,{...machine,x:250},{x:1,y:0})).toBe(false);
  // The old Watch compatibility ID UNHELMETED is a helmeted infected
  // zombie in OMEGA; GAS_LEAK is still a non-targetable environment hazard.
  const infected={...machine,type:'UNHELMETED' as const};
  expect(omegaBladeEligible(infected)).toBe(true);
  expect(omegaBladeTargetInArc(origin,infected,{x:1,y:0})).toBe(true);
  expect(omegaBladeDamage(1,infected)).toBeGreaterThan(0);
  const gas={...machine,type:'GAS_LEAK' as const};
  expect(omegaBladeEligible(gas)).toBe(false);
  expect(omegaBladeTargetInArc(origin,gas,{x:1,y:0})).toBe(false);
  expect(omegaBladeDamage(1,gas)).toBe(0);
  expect(omegaBladeTargetInArc(origin,machine,{x:NaN,y:1})).toBe(false);
 });
 it('produces a finite three-hit combo within the real cooldown and boss damage cap',()=>{
  expect(omegaBladeNextCombo(1,.7)).toBe(2);
  expect(omegaBladeNextCombo(2,.7)).toBe(3);
  expect(omegaBladeNextCombo(3,.7)).toBe(1);
  expect(omegaBladeNextCombo(2,1.1)).toBe(1);
  expect(omegaBladeDamage(3,machine)).toBeGreaterThan(omegaBladeDamage(1,machine));
  expect(omegaBladeDamage(1,machine,1,2)).toBeGreaterThan(omegaBladeDamage(1,machine,1,0));
  const boss={...machine,isStageBoss:true,hp:500,maxHp:500,type:'CRANE_BOSS' as const};
  expect(omegaBladeDamage(3,boss,20,3)).toBeLessThanOrEqual(boss.maxHp*.032);
 });
 it('changes only real run-scoped Watch hazards, never normal campaign or paused state',()=>{
  const session=new OmegaProtocolCombatSession(181,50);
  session.engine.state.player.invincibleTime=999;
  const original=session.engine.state.hazards[0]!;
  const target={...original,type:'UNHELMETED' as const};
  session.engine.state.hazards[0]=target;
  session.update(1/60,input);
  const hero=session.engine.state.player;
  target.x=hero.x+65;target.y=hero.y;
  target.radius=18;target.hp=200;target.maxHp=200;target.speed=0;
  const originalHp=target.hp;
  const swing=session.blade();
  expect(swing).not.toBeNull();
  expect(swing?.hits).toBeGreaterThanOrEqual(1);
  expect(target.hp).toBeLessThan(originalHp);
  expect(session.blade()).toBeNull(); // genuine attack cooldown
  expect(session.snapshot.bladeCooldownRemaining).toBeGreaterThan(0);
  for(let t=0;t<35;t++)session.update(1/60,{moveX:0,moveY:0,triggerAction:false});
  const next=session.blade();
  expect(next).not.toBeNull();
  expect(next!.combo).toBe(2);
  expect(OMEGA_BLADE_COOLDOWN).toBeGreaterThan(0);
  session.pause();
  expect(session.blade()).toBeNull();
 });
 it('cannot bypass the 50 extreme unlock gate to obtain a sword',()=>{
  expect(()=>new OmegaProtocolCombatSession(181,49)).toThrow('50 Watch Extreme');
 });
});
