import {describe,expect,it} from 'vitest';
import {GangformMomentDirection} from '../src/ui/survivors-gangform-moment-direction';
import type {Hazard,PatrolStageId} from '../src/domain/patrol-survivors';

function gangformBoss():Hazard {
 return {
  id:'incident_14',isStageBoss:true,hp:350,x:680,y:390,radius:46,
  bossGameplay:{
   bossId:'incident_14',patternId:'PENDULUM_DEBRIS',weakPointId:'DROP_ZONE_BREAK',
   combatPhase:'pattern',phaseIndex:1,signatureResolvedThisCycle:false,
   patternContact:false,burstRemaining:0,remaining:0,cycleCount:0,
   gangform:{step:'pendulum_warning',remaining:1.2,anchorX:680,anchorY:390,zones:[]},
  }
 } as Hazard;
}
function observe(d:GangformMomentDirection,h:Hazard,stageId:PatrolStageId='stage_14',phase:'arrival'|'combat'|'secured'='combat'){
 return d.observe(stageId,phase,[h]);
}
describe('ST14 gangform production cue lock',()=>{
 it('fires once per actual pendulum and falling-debris transition, never per frame',()=>{
  const h=gangformBoss(),d=new GangformMomentDirection(),g=h.bossGameplay!.gangform!;
  expect(observe(d,h)?.kind).toBe('swing_warning');
  expect(observe(d,h)).toBeNull();
  g.step='pendulum';expect(observe(d,h)?.kind).toBe('swing');
  expect(observe(d,h)).toBeNull();
  g.step='debris_warning';
  g.zones=[{x:380,y:420,radius:38,hp:60,maxHp:60},{x:480,y:420,radius:38,hp:60,maxHp:60}];
  expect(observe(d,h)).toMatchObject({kind:'debris_warning',x:380,y:420});
  g.step='debris';expect(observe(d,h)).toMatchObject({kind:'debris_impact',sfx:'impact_concrete'});
  expect(observe(d,h)).toBeNull();
 });
 it('distinguishes first protected target, exactly one cleared target, and authentic burst',()=>{
  const h=gangformBoss(),d=new GangformMomentDirection(),g=h.bossGameplay!.gangform!;
  g.step='drop_zone';
  g.zones=[{x:380,y:420,radius:38,hp:60,maxHp:60},{x:480,y:420,radius:38,hp:60,maxHp:60}];
  h.bossGameplay!.combatPhase='weak_point';
  expect(observe(d,h)).toMatchObject({kind:'zone_exposure',label:'위험지점 2곳'});
  g.zones[0]!.hp=0;
  expect(observe(d,h)).toMatchObject({kind:'zone_secured',label:'위험지점 1/2',x:380});
  expect(observe(d,h)).toBeNull();
  g.zones[1]!.hp=0;h.bossGameplay!.combatPhase='burst';
  // No congratulatory burst unless the engine has actually secured its signature.
  expect(observe(d,h)).toBeNull();
  h.bossGameplay!.signatureResolvedThisCycle=true;
  expect(observe(d,h)).toMatchObject({kind:'burst',label:'핵심부 개방 · 4.5초',cameraStrength:5});
  expect(observe(d,h)).toBeNull();
 });
 it('suppresses all non-ST14 scenes and boss arrival, and safely resets between runs',()=>{
  const h=gangformBoss(),d=new GangformMomentDirection();
  expect(observe(d,h,'stage_13')).toBeNull();
  expect(observe(d,h,'stage_14','arrival')).toBeNull();
  expect(observe(d,h)?.kind).toBe('swing_warning');
  expect(observe(d,h,'stage_15')).toBeNull();
  expect(observe(d,h)?.kind).toBe('swing_warning');
  expect(observe(d,h,'stage_14','secured')).toBeNull();
  expect(observe(d,h)?.kind).toBe('swing_warning');
  const next=gangformBoss();
  expect(observe(d,next)?.kind).toBe('swing_warning');
 });
 it('does not claim mechanical victory after recovery or change source HP/zone state',()=>{
  const h=gangformBoss(),d=new GangformMomentDirection();
  const snap=JSON.stringify(h);
  d.observe('stage_14','combat',[h]);
  expect(JSON.stringify(h)).toBe(snap);
  h.bossGameplay!.combatPhase='recovery';
  expect(observe(d,h)).toBeNull();
  h.bossGameplay!.combatPhase='pattern';
  h.bossGameplay!.gangform!.step='pendulum_warning';
  h.bossGameplay!.cycleCount=1;
  expect(observe(d,h)?.kind).toBe('swing_warning');
  const unrelated={...h,bossGameplay:{...h.bossGameplay,patternId:'OTHER'}} as Hazard;
  expect(d.observe('stage_14','combat',[unrelated])).toBeNull();
 });
});
