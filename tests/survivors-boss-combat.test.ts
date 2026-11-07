import {expect,it} from 'vitest';
import type {Hazard} from '../src/domain/patrol-survivors';
import {bossGameplayForStage} from '../src/engine/survivors-boss-gameplay';
import {createBossCombat,resolveBossSignature,tickBossCombat,bossCombatDamage} from '../src/engine/survivors-boss-combat';
import {advanceBossPhase,bossCoreStatus,masteryBossCycleFloor} from '../src/engine/survivors-boss-pattern';
import {isHazardContactActive} from '../src/engine/patrol-hazard-motion';

function fixture(){
 const definition=bossGameplayForStage('stage_14');
 const h:Hazard={id:'test',type:'CRANE_BOSS',x:0,y:0,hp:1000,maxHp:1000,speed:60,radius:34,damage:35,expValue:1,isStageBoss:true,bossEncounterManaged:true,
   bossGameplay:createBossCombat(definition),motion:{phase:'fall',timer:.1,directionX:0,directionY:0}};
 h.bossGameplay!.combatPhase='pattern';return {h,definition,p:h.bossGameplay!};
}
it('blocks pre-burst raw DPS and passive activation, then uses the configured 4.5s window',()=>{
 const {h,definition,p}=fixture();bossCombatDamage(h,1e8,definition,true);expect(h.hp).toBe(1000);expect(p.combatPhase).toBe('pattern');
 resolveBossSignature(h);expect(p.combatPhase).toBe('weak_point');expect(p.cycleCount).toBe(1);
 bossCombatDamage(h,1e8,definition);expect(p.combatPhase).toBe('weak_point');
 bossCombatDamage(h,1,definition,true);expect(p.combatPhase).toBe('burst');expect(p.burstRemaining).toBe(4.5);expect(h.hp).toBe(1000);
 expect(isHazardContactActive(h)).toBe(false);bossCombatDamage(h,500,definition);expect(h.hp).toBe(0);expect(p.combatPhase).toBe('secured');
});
it('makes stronger builds matter and returns insufficient damage through recovery to a fresh pattern',()=>{
 const a=fixture(),b=fixture();
 for(const f of [a,b]){resolveBossSignature(f.h);bossCombatDamage(f.h,1,f.definition,true);}
 bossCombatDamage(a.h,10,a.definition,true);bossCombatDamage(b.h,100,b.definition,true);expect(1000-b.h.hp).toBe(10*(1000-a.h.hp));
 tickBossCombat(a.h,4.5);expect(a.p.combatPhase).toBe('recovery');expect(a.h.hp).toBe(980);
 tickBossCombat(a.h,1.2);expect(a.p.combatPhase).toBe('pattern');expect(a.p.signatureResolvedThisCycle).toBe(false);expect(a.h.motion!.phase).toBe('approach');
});
it('does not count invulnerable contact as a successful dodge and expires untouched weak points',()=>{
 const {h,p}=fixture();p.patternContact=true;resolveBossSignature(h);expect(p.combatPhase).toBe('recovery');expect(p.signatureResolvedThisCycle).toBe(false);
 tickBossCombat(h,1.2);resolveBossSignature(h);expect(p.combatPhase).toBe('weak_point');tickBossCombat(h,2);expect(p.combatPhase).toBe('recovery');
});
it('latches phase two only at recovery and does not alter ordinary hazards',()=>{
 const {h,p}=fixture();h.hp=400;h.bossAttackCycles=1;h.motion!.phase='spent';p.combatPhase='burst';expect(advanceBossPhase(h)).toBe(false);
 p.combatPhase='recovery';expect(advanceBossPhase(h)).toBe(true);expect(advanceBossPhase(h)).toBe(false);
 const ordinary={...h,bossGameplay:undefined,isStageBoss:false};expect(tickBossCombat(ordinary,1)).toBe(false);
});

it('mastery requires four separate clean boss weak-point bursts, preserving extreme instant damage',()=>{
 const {h,definition,p}=fixture();
 const originalMax=h.maxHp;
 for(let cycle=1;cycle<=4;cycle++){
  p.combatPhase='pattern';p.patternContact=false;
  resolveBossSignature(h);
  expect(p.combatPhase).toBe('weak_point');
  bossCombatDamage(h,1,definition,true,true);
  expect(p.combatPhase).toBe('burst');
  bossCombatDamage(h,1e8,definition,true,true);
  expect(h.hp).toBeCloseTo(originalMax*(1-cycle/4),5);
  if(cycle<4){
   expect(p.combatPhase).toBe('burst');
   tickBossCombat(h,definition.burstWindowSeconds);
   expect(p.combatPhase).toBe('recovery');
  }
 }
 expect(h.hp).toBe(0);expect(p.combatPhase).toBe('secured');
});

it('reports interlocked mastery cores when maximum damage per exposure has been reached',()=>{
 const {h,definition,p}=fixture();resolveBossSignature(h);bossCombatDamage(h,1,definition,true,true);bossCombatDamage(h,1e8,definition,true,true);
 expect(h.hp).toBe(750);expect(bossCoreStatus(h,true)).toBe('interlocked');
 expect(bossCoreStatus(h,false)).toBe('exposed');
 const finalBoss={...h,bossGameplay:undefined,bossPhase:1,bossAttackCycles:0,hp:1000};
 expect(masteryBossCycleFloor(finalBoss)).toBe(1000);
 expect(bossCoreStatus(finalBoss,true)).toBe('interlocked');
 finalBoss.bossAttackCycles=1;finalBoss.hp=750;
 expect(masteryBossCycleFloor(finalBoss)).toBe(750);
 finalBoss.bossPhase=2;finalBoss.bossAttackCycles=4;finalBoss.hp=0;
 expect(masteryBossCycleFloor(finalBoss)).toBe(0);
});
