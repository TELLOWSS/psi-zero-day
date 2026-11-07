import {describe,it,expect} from 'vitest';
import {guardContents} from '../src/content/guard-campaign';
import {createDefenseRun,applyDefenseCommand,advanceDefense,defenseResult} from '../src/engine/defense';
import {guardMasteryHp,guardMasterySpeed} from '../src/engine/guard-mastery';
import {emptyDefenseSaveDocument,decodeDefenseSave,encodeDefenseSave,applyDefenseOutcome} from '../src/app/defense-save';
import type {DefenseRunState} from '../src/domain/defense';

describe('Signal Guard mastery replay',()=>{
  const content=guardContents[0]!;
  it('preserves normal waves and adds enemy-role pressure only when explicitly selected',()=>{
    const regular=createDefenseRun(content,'COORDINATOR','normal');
    const veteran=createDefenseRun(content,'COORDINATOR','master',{masteryRun:true});
    expect(regular.masteryRun).toBeUndefined();
    expect(veteran.masteryRun).toBe(true);
    expect(regular.resource).toBe(veteran.resource);
    expect(regular.shield).toBe(veteran.shield);
    expect(regular.spawnedByGroup).toEqual(veteran.spawnedByGroup);
    expect(guardMasteryHp(140,'ARMORED',5)).toBeGreaterThan(guardMasteryHp(140,'ARMORED',1));
    expect(guardMasterySpeed('SWIFT')).toBeGreaterThan(guardMasterySpeed('ARMORED'));
    let a=applyDefenseCommand(regular,content,{type:'StartWave'});
    let b=applyDefenseCommand(veteran,content,{type:'StartWave'});
    for(let i=0;i<60&&!a.enemies.length;i++){a=advanceDefense(a,content);b=advanceDefense(b,content);}
    expect(a.enemies.length).toBeGreaterThan(0);
    expect(a.enemies.map(e=>e.enemyId)).toEqual(b.enemies.map(e=>e.enemyId));
    expect(b.enemies[0]!.hp).toBeGreaterThan(a.enemies[0]!.hp);
  });
  it('persists an explicit mastery flag while retaining old checkpoints and rejecting malformed flags',()=>{
    const regular=createDefenseRun(content,'COORDINATOR','original');
    const mastery=createDefenseRun(content,'COORDINATOR','mastery',{masteryRun:true});
    for(const run of [regular,mastery]){
      const payload=encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:run},content,1);
      expect(decodeDefenseSave(payload)?.payload.activeRun).toEqual(run);
    }
    const bad={...mastery,masteryRun:false} as unknown as DefenseRunState;
    expect(decodeDefenseSave(encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:bad},content,1))).toBeNull();
  });
  it('keeps normal three-star progress and grant identities while separately tracking mastery stars',()=>{
    const regular={...createDefenseRun(content,'COORDINATOR','won-regular'),status:'WON' as const};
    const mastery={...createDefenseRun(content,'COORDINATOR','won-mastery',{masteryRun:true}),status:'WON' as const,shield:17};
    const first=applyDefenseOutcome(emptyDefenseSaveDocument(),content,regular,defenseResult(regular));
    const after=applyDefenseOutcome(first.document,content,mastery,defenseResult(mastery));
    expect(after.document.records[0]?.bestStars).toBe(3);
    expect(after.document.records[0]?.bestMasteryStars).toBe(2);
    expect(after.document.claimIds).toEqual(first.document.claimIds);
    expect(applyDefenseOutcome(after.document,content,mastery,defenseResult(mastery)).applied).toBe(false);
  });
});
