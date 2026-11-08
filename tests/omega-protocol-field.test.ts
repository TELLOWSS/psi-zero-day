import {describe,it,expect} from 'vitest';
import {
 omegaFieldPlan,omegaFieldDistance,omegaFieldResolveCollision,
 omegaFieldCanInteract,OMEGA_FIELD_INTERACT_RADIUS,
} from '../src/domain/omega-protocol-field';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';
const idle={moveX:0,moveY:0,triggerAction:false};
const completeCombat=(s:OmegaProtocolCombatSession)=>{
 s.engine.state.hazards=[];
 s.update(1/60,idle);
};
const finishField=(s:OmegaProtocolCombatSession)=>{
 const field=s.field;
 if(!field)throw Error('Missing field plan');
 s.engine.state.player.x=field.plan.event.target.x;
 s.engine.state.player.y=field.plan.event.target.y;
 expect(s.interact()).toEqual({success:true,reason:'EVENT_COMPLETE'});
 expect(s.run.wave).toBe(field.plan.wave);
 expect(s.field?.progress.phase).toBe('exit');
 s.engine.state.player.x=field.plan.exit.x;
 s.engine.state.player.y=field.plan.exit.y;
 expect(s.interact()).toEqual({success:true,reason:'EXIT_OPENED'});
};
describe('OMEGA PROTOCOL real field traversal / event / boss mission',()=>{
 it('authors all fifteen navigable nodes with three distinct event mission types',()=>{
  const plans=Array.from({length:15},(_,i)=>omegaFieldPlan(20261108,i+1));
  expect(plans.map(p=>p.sector)).toEqual([
   1,1,1,2,2,2,3,3,3,4,4,4,5,5,5
  ]);
  expect(new Set(plans.map(p=>p.event.kind)).size).toBe(3);
  expect(new Set(plans.map(p=>p.sectorName)).size).toBe(5);
  expect(plans.every(p=>p.entry.x!==p.exit.x&&p.event.target.x!==p.exit.x)).toBe(true);
  for(const p of plans){
   for(const position of [p.entry,p.event.target,p.exit]){
    expect(position.x).toBeGreaterThan(40);
    expect(position.x).toBeLessThan(1360);
    expect(position.y).toBeGreaterThan(40);
    expect(position.y).toBeLessThan(860);
    expect(omegaFieldResolveCollision(position,position,p.obstacles)).toEqual(position);
   }
  }
  expect(omegaFieldDistance({x:0,y:0},{x:3,y:4})).toBe(5);
  expect(omegaFieldCanInteract({x:0,y:0},{x:OMEGA_FIELD_INTERACT_RADIUS,y:0})).toBe(true);
  expect(omegaFieldCanInteract({x:0,y:0},{x:101,y:0})).toBe(false);
  expect(()=>omegaFieldPlan(1,16)).toThrow(RangeError);
 });
 it('blocks entry into solid industrial props without changing normal Watch physics',()=>{
  const p=omegaFieldPlan(11,1);
  const c=p.obstacles[0]!;
  const left={x:c.x-24,y:c.y+c.height/2};
  const inside={x:c.x+10,y:c.y+c.height/2};
  const corrected=omegaFieldResolveCollision(left,inside,p.obstacles,21);
  expect(corrected.x).toBe(left.x);
  expect(corrected.y).toBe(left.y);
  expect(()=>omegaFieldResolveCollision(left,{x:NaN,y:0},p.obstacles)).toThrow(RangeError);
 });
 it('requires clearing ACTUAL enemies, operating a field event in range, and reaching the exit',()=>{
  const s=new OmegaProtocolCombatSession(20261108,10,false,{fieldTraversal:true});
  expect(s.snapshot.field?.progress.phase).toBe('combat');
  expect(s.engine.state.player.x).toBe(s.field?.plan.entry.x);
  expect(s.interact().reason).toBe('NOT_READY');
  completeCombat(s);
  expect(s.run.wave).toBe(1);
  expect(s.field?.progress.phase).toBe('objective');
  expect(s.interact()).toEqual({success:false,reason:'OUT_OF_RANGE'});
  const mission=s.field!.plan.event.target;
  s.engine.state.player.x=mission.x;s.engine.state.player.y=mission.y;
  expect(s.interact()).toEqual({success:true,reason:'EVENT_COMPLETE'});
  expect(s.interact()).toEqual({success:false,reason:'OUT_OF_RANGE'});
  expect(s.snapshot.field?.progress.exitUnlocked).toBe(true);
  const exit=s.field!.plan.exit;
  s.engine.state.player.x=exit.x;s.engine.state.player.y=exit.y;
  expect(s.interact()).toEqual({success:true,reason:'EXIT_OPENED'});
  expect(s.run).toMatchObject({wave:2,phase:'battle',victories:1});
  expect(s.field?.progress.phase).toBe('combat');
  expect(s.engine.state.player.x).toBe(s.field?.plan.entry.x);
 });
 it('still completes 15 physical event-gated nodes, both bosses, and 7 tactical upgrades',()=>{
  const s=new OmegaProtocolCombatSession(37000,10,false,{fieldTraversal:true});
  let bossCount=0,rewardCount=0;
  for(let wave=1;wave<=15;wave++){
   expect(s.run.wave).toBe(wave);
   expect(s.field?.plan.wave).toBe(wave);
   if(s.engine.state.hazards.some(h=>h.isStageBoss))bossCount++;
   completeCombat(s);
   expect(s.run.wave).toBe(wave); // no auto stage clear
   finishField(s);
   if(s.run.phase==='reward'){
    rewardCount++;
    s.selectUpgrade(s.run.offers[0]!);
   }
  }
  expect(bossCount).toBe(2);
  expect(rewardCount).toBe(7);
  expect(s.run).toMatchObject({phase:'victory',wave:16,victories:15});
  expect(s.field?.progress.phase).toBe('exit');
  expect(s.interact().success).toBe(false);
 });
 it('retains current wave while a mandatory event is unresolved; losing still ends it',()=>{
  const s=new OmegaProtocolCombatSession(991,10,false,{fieldTraversal:true});
  completeCombat(s);
  for(let tick=0;tick<100;tick++)s.update(1/60,idle);
  expect(s.run.wave).toBe(1);
  expect(s.field?.progress.eventComplete).toBe(false);
  const x=s.engine.state.player.x;
  s.engine.state.player.x=160;s.engine.state.player.y=450;
  expect(s.engine.state.player.x).toBe(x);
  s.engine.state.player.hp=0;
  s.update(1/60,idle);
  expect(s.run.phase).toBe('defeat');
  expect(s.interact().success).toBe(false);
 });
});
