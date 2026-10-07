import {expect,it} from 'vitest';
import type {Hazard} from '../src/domain/patrol-survivors';
import {createBossCombat} from '../src/engine/survivors-boss-combat';
import {bossGameplayForStage} from '../src/engine/survivors-boss-gameplay';
import {bossCombatHint,bossCombatReadout} from '../src/ui/survivors-boss-readout';
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
