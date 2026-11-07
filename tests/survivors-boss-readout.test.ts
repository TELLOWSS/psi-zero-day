import {expect,it} from 'vitest';
import type {Hazard} from '../src/domain/patrol-survivors';
import {createBossCombat} from '../src/engine/survivors-boss-combat';
import {bossGameplayForStage} from '../src/engine/survivors-boss-gameplay';
import {bossCombatHint,bossCombatReadout,bossPatternReadCount} from '../src/ui/survivors-boss-readout';
import text from '../content/localization/survivors-boss-ko.json';

it('uses localized action cues for every boss phase without changing combat state',()=>{
 const boss:Hazard={id:'readout',type:'RUNAWAY_CART',x:0,y:0,hp:100,maxHp:100,speed:1,radius:20,damage:1,expValue:1,
  bossGameplay:createBossCombat(bossGameplayForStage('stage_01'))};
 const progress=boss.bossGameplay!;
 for(const phase of ['arrival','pattern','weak_point','burst','recovery','secured'] as const){
  progress.combatPhase=phase;progress.burstRemaining=2.5;
  const before=JSON.stringify(boss);
  expect(bossCombatHint(boss)).toBe(text.combatHint[phase]);
  expect(bossCombatReadout(boss)).toBe(text.combat[phase]+(phase==='burst'?' 2.5s':''));
  expect(JSON.stringify(boss)).toBe(before);
 }
 expect(text.combatHint.weak_point).toContain('자동 조치');
 expect(text.combatHint.burst).toContain('사거리');
});

it('reports stage-50 boss phase reads precisely for each difficulty without changing combat state',()=>{
 const boss:Hazard={id:'final',type:'CRANE_BOSS',x:0,y:0,hp:1000,maxHp:1000,speed:0,radius:32,damage:1,expValue:1,
   isStageBoss:true,bossEncounterManaged:true,bossAttackCycles:0,motion:{phase:'warning',timer:1.4,directionX:0,directionY:0}};
 const original=JSON.stringify(boss);
 expect(bossPatternReadCount(boss,'mastery')).toBe('P1 0/2');
 expect(bossCombatReadout(boss,'mastery')).toContain('P1 0/2');
 expect(bossCombatHint(boss,'mastery')).toBe(text.interlock);
 expect(JSON.stringify(boss)).toBe(original);
 boss.bossAttackCycles=1;
 expect(bossPatternReadCount(boss,'story')).toBe('P1 1/1');
 expect(bossPatternReadCount(boss,'mastery')).toBe('P1 1/2');
 boss.bossPhase=2;boss.hp=375;
 expect(bossPatternReadCount(boss,'mastery')).toBe('P2 1/4');
 expect(bossPatternReadCount(boss,'hard')).toBe('P2 1/3');
 expect(bossPatternReadCount(boss,'extreme')).toBe('P2 1/3');
 expect(bossPatternReadCount(boss,'standard')).toBe('P2 1/2');
 expect(bossPatternReadCount(boss,'story')).toBe('P2 1/1');
 expect(bossCombatReadout(boss,'mastery')).toContain('인터록 잠김 · P2 1/4');
 expect(bossCombatReadout(boss,'standard')).not.toContain('인터록 잠김');
 boss.bossAttackCycles=99;
 expect(bossPatternReadCount(boss,'mastery')).toBe('P2 4/4');
 boss.bossAttackCycles=Number.NaN;
 expect(bossPatternReadCount(boss,'mastery')).toBe('P2 0/4');
 boss.bossGameplay=createBossCombat(bossGameplayForStage('stage_14'));
 expect(bossPatternReadCount(boss,'mastery')).toBe('');
});
