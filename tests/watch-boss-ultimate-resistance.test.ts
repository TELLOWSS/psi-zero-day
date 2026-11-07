import {describe,it,expect} from 'vitest';
import {SurvivorsEngine,createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {createBossCombat} from '../src/engine/survivors-boss-combat';
import {bossGameplayForStage} from '../src/engine/survivors-boss-gameplay';
import type {Hazard} from '../src/domain/patrol-survivors';

function setup(difficulty:'standard'|'mastery'='standard'){
 const state=createInitialSurvivorsState('yoon',undefined,'stage_14',difficulty);
 const engine=new SurvivorsEngine(state,83);
 engine.start();
 state.stageBossSpawned=true;
 state.player.x=700;state.player.y=450;state.player.invincibleTime=999;
 state.nextLevelExp=1e9;
 const boss:Hazard={id:'test-boss',type:'CRANE_BOSS',x:700,y:450,hp:1000,maxHp:1000,speed:0,radius:34,damage:0,expValue:1,
  isStageBoss:true,bossEncounterManaged:true,motion:{phase:'warning',timer:1.4,directionX:0,directionY:0},
  bossGameplay:createBossCombat(bossGameplayForStage('stage_14'))};
 boss.bossGameplay!.combatPhase='pattern';
 const ordinary:Hazard={id:'ordinary',type:'UNHELMETED',x:710,y:450,hp:40,maxHp:40,speed:0,radius:18,damage:0,expValue:1};
 state.hazards=[boss,ordinary];
 state.bossEncounter={bossId:boss.id,phase:'combat',remaining:0};
 state.ultimateCharge=state.maxUltimateCharge;
 return {state,engine,boss,ordinary};
}
describe('director ultimate versus authored boss contract',()=>{
 it.each(['standard','mastery'] as const)('retains crowd wipe but does not stun, injure, or bypass a %s boss',difficulty=>{
  const {state,engine,boss,ordinary}=setup(difficulty);
  expect(engine.triggerDirectorShout()).toBe(true);
  expect(state.ultimateCharge).toBe(0);
  expect(state.directorShoutTimer).toBeGreaterThan(0);
  expect(ordinary.hp).toBe(0);expect(ordinary.isStunned).toBe(3.5);
  expect(boss.hp).toBe(1000);expect(boss.isStunned??0).toBe(0);
  expect(boss.bossGameplay?.combatPhase).toBe('pattern');
  for(let i=0;i<8;i++)engine.update(1/60,{moveX:0,moveY:0});
  expect(boss.hp).toBe(1000);
  expect(boss.bossGameplay?.combatPhase).toBe('pattern');
  expect(boss.isStunned??0).toBe(0);
 });
 it('rejects the 9999-damage shockwave even inside a legitimate weak-point burst',()=>{
  const {state,engine,boss}=setup('standard');
  boss.bossGameplay!.combatPhase='burst';
  boss.bossGameplay!.signatureResolvedThisCycle=true;
  boss.bossGameplay!.burstRemaining=4.5;
  state.hazards=[boss];
  expect(engine.triggerDirectorShout()).toBe(true);
  for(let i=0;i<8;i++)engine.update(1/60,{moveX:0,moveY:0});
  expect(boss.hp).toBe(1000);
  expect(boss.bossGameplay?.combatPhase).toBe('burst');
  expect(boss.isStunned??0).toBe(0);
 });
});
