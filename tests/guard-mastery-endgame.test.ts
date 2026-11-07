import {describe,it,expect} from 'vitest';
import {guardContents} from '../src/content/guard-campaign';
import {createDefenseRun,applyDefenseCommand,advanceDefense,defenseResult} from '../src/engine/defense';
import {guardMasteryHp,guardMasterySpeed,guardMasteryWaveDirective} from '../src/engine/guard-mastery';
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
  it('does not upgrade normal records or cosmetics using mastery scores and stars',()=>{
    const firstRun={...createDefenseRun(content,'COORDINATOR','ordinary-clear'),status:'WON' as const};
    const veteran={...createDefenseRun(content,'COORDINATOR','master-three-stars',{masteryRun:true}),status:'WON' as const};
    const first=applyDefenseOutcome(emptyDefenseSaveDocument(),content,firstRun,{won:true,stars:1,score:900,completedWaves:3,shield:3},'2026-11-07');
    const after=applyDefenseOutcome(first.document,content,veteran,{won:true,stars:3,score:900000,completedWaves:6,shield:20},'2026-11-07');
    const record=after.document.records[0]!;
    expect(record.clears).toBe(1);
    expect(record.bestStars).toBe(1);
    expect(record.bestScore).toBe(900);
    expect(record.bestShield).toBe(3);
    expect(record.bestCompletedWaves).toBe(3);
    expect(record.bestMasteryStars).toBe(3);
    expect(after.document.claimIds).toEqual(first.document.claimIds);
    expect(after.document.cosmeticIds).toEqual(first.document.cosmeticIds);
    expect(after.document.settledRunIds).toEqual(['ordinary-clear','master-three-stars']);
  });
  it('briefs wave priority and costs extra shield only if that type leaks',()=>{
    const wave=content.waves[1]!,directive=guardMasteryWaveDirective(content,wave.id);
    expect(directive?.enemy).toBeDefined();
    expect(directive?.advice.length).toBeGreaterThan(5);
    expect(guardMasteryWaveDirective(content,1)).toBeNull();
    const make=(mastery:boolean)=>{
      const run=createDefenseRun(content,'COORDINATOR',mastery?'priority-master':'priority-normal',mastery?{masteryRun:true}:{});
      const contact={id:'leak',enemyId:directive!.enemy,hp:1,distance:1e9,spawnSequence:1,revealUntilTick:0,slowEffects:[],bossPhaseTriggered:false,bossArmorFromTick:0,bossArmorUntilTick:0};
      return {...run,status:'RUNNING' as const,waveId:wave.id,shield:20,enemies:[contact],spawnedByGroup:wave.groups.map(g=>g.count)};
    };
    const normal=advanceDefense(make(false),content),mastery=advanceDefense(make(true),content);
    expect(normal.shield-mastery.shield).toBe(directive!.extraLeak);
    expect(normal.leakedByEnemy).toEqual(mastery.leakedByEnemy);
  });
});
