import {describe,it,expect} from 'vitest';
import {guardContents} from '../src/content/guard-campaign';
import {createGuardLabRun,guardLabContent} from '../src/app/guard-tower-lab';
import {advanceDefenseWithCombat} from '../src/engine/defense';
describe('guard engine-backed branch lab',()=>{
 it('can equip all 16 legal stages without mutating campaign content and produces different A/B judgments',()=>{
  const content=guardContents[0]!,original=JSON.stringify(content),simulation=guardLabContent(content);
  for(const tower of content.towers){
   const results=new Map();
   for(const level of tower.levels){const run=createGuardLabRun(content,tower.id,level.id);expect(run.towers[0]?.levelId).toBe(level.id);const frame=advanceDefenseWithCombat(run,simulation,240);results.set(level.id,JSON.stringify(frame.shots.map(s=>s.targets)));}
   expect(results.get('L3A')).not.toBe(results.get('L3B'));
  }
  expect(JSON.stringify(content)).toBe(original);
 });
});
