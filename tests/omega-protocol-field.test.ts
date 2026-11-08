import {describe,it,expect} from 'vitest';
import {
 omegaFieldPlan,omegaFieldDistance,omegaFieldResolveCollision,
 omegaFieldCanInteract,OMEGA_FIELD_INTERACT_RADIUS,omegaFieldTargetGuide,omegaFieldInitialProgress,omegaFieldNativeTerrain,
} from '../src/domain/omega-protocol-field';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';
import {terrainHit,terrainWaypoint} from '../src/engine/survivors-terrain';
const idle={moveX:0,moveY:0,triggerAction:false};
const completeCombat=(s:OmegaProtocolCombatSession)=>{
 s.engine.state.hazards=[];
 s.update(1/60,idle);
};
const finishField=(s:OmegaProtocolCombatSession)=>{
 const field=s.field;
 if(!field)throw Error('Missing field plan');
 for(const [i,step] of field.plan.event.steps.entries()){
  s.engine.state.player.x=step.target.x;
  s.engine.state.player.y=step.target.y;
  expect(s.interact()).toEqual({success:true,reason:i===field.plan.event.steps.length-1?'EVENT_COMPLETE':'STEP_COMPLETE'});
  expect(s.field?.progress.completedSteps).toBe(i+1);
 }
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
  expect(plans.filter(p=>p.event.kind==='power_lockout').every(p=>p.event.steps.length===3)).toBe(true);
  expect(plans.filter(p=>p.event.kind==='worker_evacuation').every(p=>p.event.steps.length===2)).toBe(true);
  expect(plans.filter(p=>p.event.kind==='structure_stabilization').every(p=>p.event.steps.length===3)).toBe(true);
  expect(plans.every(p=>new Set(p.event.steps.map(step=>step.id)).size===p.event.steps.length)).toBe(true);
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
 it('points a screen-relative compass at each on-map mission step and then the exit',()=>{
  const plan=omegaFieldPlan(20261108,1);
  const start=omegaFieldInitialProgress();
  expect(omegaFieldTargetGuide(plan,start,plan.entry)).toBeNull();
  const step=plan.event.steps[0]!;
  const active={...start,phase:'objective' as const};
  const guide=omegaFieldTargetGuide(plan,active,plan.entry)!;
  expect(guide).not.toBeNull();
  expect(guide.label).toBe(step.label);
  expect(guide.ready).toBe(false);
  const atStep=omegaFieldTargetGuide(plan,active,step.target)!;
  expect(atStep.distance).toBe(0);
  expect(atStep.ready).toBe(true);
  const opened={...active,phase:'exit' as const,completedSteps:plan.event.steps.length,exitUnlocked:true,eventComplete:true};
  const exit=omegaFieldTargetGuide(plan,opened,plan.entry)!;
  expect(exit.label).toBe('출구');
  expect(exit.distance).toBeGreaterThan(100);
  expect(exit.degrees).toBeGreaterThan(-180);
  expect(exit.degrees).toBeLessThanOrEqual(180);
  expect(omegaFieldTargetGuide(plan,opened,{x:NaN,y:20})).toBeNull();
 });
 it('blocks entry into solid industrial props without changing normal Watch physics',()=>{
  const p=omegaFieldPlan(11,1);
  const c=p.obstacles[0]!;
  const left={x:c.x-24,y:c.y+c.height/2};
  const inside={x:c.x+10,y:c.y+c.height/2};
  const corrected=omegaFieldResolveCollision(left,inside,p.obstacles,21);
  expect(corrected.x).toBe(c.x-21); // swept stop at the collision boundary
  expect(corrected.y).toBe(left.y);
  // Swept collision is not defeated by a 250px displacement in one frame.
  const dashed=omegaFieldResolveCollision(left,{x:c.x+c.width+40,y:left.y},p.obstacles,21);
  expect(dashed.x).toBe(c.x-21);
  expect(dashed.y).toBe(left.y);
  expect(()=>omegaFieldResolveCollision(left,{x:NaN,y:0},p.obstacles)).toThrow(RangeError);
 });
 it('makes industrial props real native Watch cover for enemy routing and projectiles',()=>{
  const run=new OmegaProtocolCombatSession(20261108,10,false,{fieldTraversal:true});
  const plan=run.field!.plan;
  const native=run.engine.state.terrain??[];
  expect(native).toEqual(omegaFieldNativeTerrain(plan));
  expect(native).toHaveLength(plan.obstacles.length);
  const first=plan.obstacles[0]!;
  const from={x:first.x-62,y:first.y+first.height/2};
  const behind={x:first.x+first.width+62,y:first.y+first.height/2};
  const hit=terrainHit(native,from,behind,1);
  expect(hit?.object.id).toBe('omega:1:'+first.id);
  const waypoint=terrainWaypoint(native,from,behind,14);
  expect(waypoint).not.toEqual(behind);
  expect(waypoint.x).toBeGreaterThanOrEqual(0);
  expect(waypoint.y).toBeGreaterThanOrEqual(0);
  expect(native.every(t=>t.kind==='cover'||t.kind==='pillar')).toBe(true);
  const original=new OmegaProtocolCombatSession(20261108,10);
  expect(original.engine.state.terrain??[]).toHaveLength(0);
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
  expect(s.interact()).toEqual({success:true,reason:'STEP_COMPLETE'});
  expect(s.interact()).toEqual({success:false,reason:'OUT_OF_RANGE'});
  for(const [i,step] of s.field!.plan.event.steps.entries()){
   if(i===0)continue;
   s.engine.state.player.x=step.target.x;s.engine.state.player.y=step.target.y;
   expect(s.interact().reason).toBe(i===s.field!.plan.event.steps.length-1?'EVENT_COMPLETE':'STEP_COMPLETE');
  }
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
  const before=s.engine.state.player.x;
  s.engine.state.player.x=before;s.engine.state.player.y=450;
  expect(s.engine.state.player.x).toBe(before);
  s.engine.state.player.hp=0;
  s.update(1/60,idle);
  expect(s.run.phase).toBe('defeat');
  expect(s.interact().success).toBe(false);
 });
});
