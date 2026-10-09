import {describe,it,expect} from 'vitest';
import type {Hazard} from '../src/domain/patrol-survivors';
import {createInitialSurvivorsState,SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
import {bossGameplayForStage} from '../src/engine/survivors-boss-gameplay';
import {createBossCombat,bossCombatDamage,tickBossCombat,resolveBossSignature} from '../src/engine/survivors-boss-combat';
import {createStaleRoute,tickStaleRoute} from '../src/engine/survivors-boss-stale-route';
import {terrainHit} from '../src/engine/survivors-terrain';

function fixture(){
 const state=createInitialSurvivorsState('lim_junho',undefined,'stage_25');
 const boss:Hazard={id:'stale-route-boss',type:'CRANE_BOSS',x:900,y:330,hp:750,maxHp:750,speed:50,radius:35,damage:25,expValue:1,
  isStageBoss:true,bossEncounterManaged:true,bossGameplay:createBossCombat(bossGameplayForStage('stage_25')),
  motion:{phase:'approach',timer:0,directionX:0,directionY:0}};
 boss.bossGameplay!.combatPhase='pattern';
 return {state,boss};
}
describe('ST25 stale-route is physical puzzle, not narrative-only',()=>{
 it('places three unique ordered and traversable points, never inside old solid geometry',()=>{
  const {state,boss}=fixture();
  const route=createStaleRoute(state.player,boss,state.terrain??[]);
  expect(route).not.toBeNull();
  expect(route!.points).toHaveLength(3);
  expect(route!.verified).toBe(0);
  let previous={x:state.player.x,y:state.player.y};
  for(const point of route!.points){
   expect(terrainHit(state.terrain??[],point,point,19)).toBeUndefined();
   expect(terrainHit(state.terrain??[],previous,point,19)).toBeUndefined();
   previous=point;
  }
  expect(new Set(route!.points.map(p=>p.x+':'+p.y)).size).toBe(3);
 });
 it('finds a three-point corridor near world edges instead of dead-ending after the first',()=>{
  const {state}=fixture();
  for(const origin of [{x:70,y:70},{x:1330,y:70},{x:70,y:830},{x:1330,y:830},{x:700,y:450}]){
   const boss={x:Math.max(80,Math.min(1320,origin.x+120)),y:Math.max(80,Math.min(820,origin.y-105))};
   const route=createStaleRoute(origin,boss,state.terrain??[]);
   expect(route,JSON.stringify({origin,boss})).not.toBeNull();
   expect(route?.points).toHaveLength(3);
   let previous=origin;
   for(const point of route!.points){expect(terrainHit(state.terrain??[],previous,point,19)).toBeUndefined();previous=point;}
  }
 });
 it('warns and rolls back one verified checkpoint on the old marked route without HP loss',()=>{
  const {state,boss}=fixture();
  const p=boss.bossGameplay!;
  expect(tickStaleRoute(boss,state.player,state.terrain??[],1/60)).toBe(true);
  const route=p.staleRoute!;
  expect(route.oldMarkEnabled).toBe(true);
  const health=state.player.hp, bossHealth=boss.hp;
  state.player.x=route.points[0].x;state.player.y=route.points[0].y;
  tickStaleRoute(boss,state.player,state.terrain??[],1/60);
  expect(route.verified).toBe(1);
  state.player.x=route.oldMark.x;state.player.y=route.oldMark.y;
  tickStaleRoute(boss,state.player,state.terrain??[],1/60);
  expect(route).toMatchObject({verified:0,misreads:1,oldRouteArmed:false});
  expect(route.warningRemaining).toBeGreaterThan(1);
  for(let i=0;i<10;i++)tickStaleRoute(boss,state.player,state.terrain??[],1/60);
  expect(route.misreads).toBe(1); // Staying in place never stacks damage/penalty.
  expect(state.player.hp).toBe(health);
  expect(boss.hp).toBe(bossHealth);
  expect(p.combatPhase).toBe('pattern');
  state.player.x=route.points[0].x;state.player.y=route.points[0].y;
  tickStaleRoute(boss,state.player,state.terrain??[],1/60);
  expect(route.verified).toBe(0); // Warning-time recovery is deliberately short.
  for(let i=0;i<75;i++)tickStaleRoute(boss,state.player,state.terrain??[],1/60);
  expect(route.warningRemaining).toBe(0);
  expect(route.verified).toBe(1);
  for(let i=1;i<3;i++){
    state.player.x=route.points[i]!.x;state.player.y=route.points[i]!.y;
    tickStaleRoute(boss,state.player,state.terrain??[],1/60);
  }
  expect(route.verified).toBe(3);
  expect(p.combatPhase).toBe('burst');
  expect(p.burstRemaining).toBe(4.5);
 });
 it('keeps obsolete lane outside every required traversable route segment',()=>{
  const {state,boss}=fixture(),start={x:state.player.x,y:state.player.y};
  const route=createStaleRoute(start,boss,state.terrain??[])!;
  if(!route.oldMarkEnabled)return;
  const chain=[start,...route.points];
  for(let i=1;i<chain.length;i++){
    const a=chain[i-1]!,b=chain[i]!,p=route.oldMark;
    const dx=b.x-a.x,dy=b.y-a.y;
    const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));
    const distance=Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);
    expect(distance).toBeGreaterThan(61);
  }
  expect(terrainHit(state.terrain??[],route.oldMark,route.oldMark,19)).toBeUndefined();
 });
 it('does not allow boss damage or signature shortcut before three verified visits',()=>{
  const {state,boss}=fixture(),p=boss.bossGameplay!;
  const hp=boss.hp;
  expect(tickStaleRoute(boss,state.player,state.terrain??[])).toBe(true);
  resolveBossSignature(boss);
  expect(p.combatPhase).toBe('pattern');
  bossCombatDamage(boss,1e7,bossGameplayForStage('stage_25'),true);
  expect(boss.hp).toBe(hp);
  // A passive gear upgrade cannot automatically visit a spatial checkpoint.
  for(let i=0;i<180;i++)tickStaleRoute(boss,state.player,state.terrain??[]);
  expect(p.staleRoute?.verified).toBe(0);
  expect(p.combatPhase).toBe('pattern');
 });
 it('requires all three visits in order and opens exactly one 4.5s burst',()=>{
  const {state,boss}=fixture(),p=boss.bossGameplay!;
  tickStaleRoute(boss,state.player,state.terrain??[]);
  const route=p.staleRoute!;
  for(let i=0;i<3;i++){
   const target=route.points[i]!;
   state.player.x=target.x;state.player.y=target.y;
   expect(tickStaleRoute(boss,state.player,state.terrain??[])).toBe(true);
   expect(route.verified).toBe(i+1);
   expect(p.combatPhase).toBe(i===2?'burst':'pattern');
  }
  expect(p.signatureResolvedThisCycle).toBe(true);
  expect(p.burstRemaining).toBe(4.5);
  bossCombatDamage(boss,80,bossGameplayForStage('stage_25'),true);
  expect(boss.hp).toBeLessThan(boss.maxHp);
  expect(tickStaleRoute(boss,state.player,state.terrain??[])).toBe(false);
  tickBossCombat(boss,4.5);tickBossCombat(boss,1.2);
  expect(p.combatPhase).toBe('pattern');
  expect(p.staleRoute).toBeUndefined();
 });
 it('really gates the live SurvivorsEngine rather than only rendering waypoints',()=>{
  const {state,boss}=fixture(),engine=new SurvivorsEngine(state,456);
  state.hazards=[boss];state.stageBossSpawned=true;state.bossEncounter={bossId:boss.id,phase:'combat',remaining:0};
  engine.start();engine.update(1/60,{moveX:0,moveY:0});
  const route=boss.bossGameplay!.staleRoute;
  expect(route).toBeDefined();
  for(let i=0;i<3;i++){
   const point=route!.points[i]!;
   state.player.x=point.x;state.player.y=point.y;
   engine.update(1/60,{moveX:0,moveY:0});
   expect(route!.verified).toBe(i+1);
   expect(boss.bossGameplay!.combatPhase).toBe(i===2?'burst':'pattern');
  }
  expect(state.stageBossNeutralized).not.toBe(true);
 });
 it('does not apply ST25 route state to any other pattern',()=>{
  const {state,boss}=fixture();
  boss.bossGameplay=createBossCombat(bossGameplayForStage('stage_14'));
  boss.bossGameplay.combatPhase='pattern';
  expect(tickStaleRoute(boss,state.player,state.terrain??[])).toBe(false);
  expect(boss.bossGameplay.staleRoute).toBeUndefined();
 });
});
