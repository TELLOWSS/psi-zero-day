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
