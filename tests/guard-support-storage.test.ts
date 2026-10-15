import {describe,it,expect} from 'vitest';
import {guardContents} from '../src/content/guard-campaign';
import {advanceDefenseWithCombat,applyDefenseCommand,createDefenseRun} from '../src/engine/defense';
import {encodeDefenseSave,decodeDefenseSave,emptyDefenseSaveDocument,DEFENSE_SAVE_KEY} from '../src/app/defense-save';
import {guardStoragePort,GUARD_SAVE_KEY} from '../src/app/guard-storage';
import type {DefenseEnemyState,DefenseRunState} from '../src/domain/defense';

const content=guardContents[0]!;
const enemy:DefenseEnemyState={id:'a',enemyId:'ARMORED',hp:140,distance:100,spawnSequence:1,revealUntilTick:0,slowEffects:[],bossPhaseTriggered:false,bossArmorFromTick:0,bossArmorUntilTick:0};
function battle(support:'REBAR_LEAD'|'ENGINEER'):DefenseRunState{
 let run=createDefenseRun(content,support,'support-contract');run=applyDefenseCommand(run,content,{type:'Build',towerId:'PULSE',padId:'P1'});
 return {...run,status:'RUNNING',enemies:[enemy],spawnedByGroup:content.waves[0]!.groups.map(g=>g.count)};
}
describe('guard supports and separate campaign storage',()=>{
 it('marks one visible armored core, increases physical damage and never multiplies PURE damage',()=>{
  const base=battle('REBAR_LEAD'),marked=applyDefenseCommand(base,content,{type:'UseSupport'});
  expect(marked.enemies[0]?.armorExposedUntilTick).toBe(80);expect(base.enemies[0]).not.toHaveProperty('armorExposedUntilTick');
  expect(advanceDefenseWithCombat(marked,content).shots[0]!.targets[0]!.damage).toBeGreaterThan(advanceDefenseWithCombat(base,content).shots[0]!.targets[0]!.damage);
  const pure={...base,towers:[{...base.towers[0]!,towerId:'SENSOR' as const}]};
  expect(advanceDefenseWithCombat(applyDefenseCommand(pure,content,{type:'UseSupport'}),content).shots[0]!.targets[0]!.damage).toBe(advanceDefenseWithCombat(pure,content).shots[0]!.targets[0]!.damage);
  const decoded=decodeDefenseSave(encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:marked},content,1));expect(decoded?.payload.activeRun?.enemies[0]).toEqual(marked.enemies[0]);
 });
 it('readies exactly one attack with greatest remaining cooldown, preserving reveal cooldown and economy',()=>{
  const base=battle('ENGINEER'),a=base.towers[0]!;const before={...base,towers:[{...a,attackCooldown:8,revealCooldown:13},{...a,id:'tower-2',padId:'P2',attackCooldown:24,revealCooldown:17}]};
  const after=applyDefenseCommand(before,content,{type:'UseSupport'});
  expect(after.towers.map(t=>t.attackCooldown)).toEqual([8,0]);expect(after.towers.map(t=>t.revealCooldown)).toEqual([13,17]);expect(after.resource).toBe(before.resource);
  expect(()=>applyDefenseCommand(after,content,{type:'UseSupport'})).toThrow('cooling');
 });
 it('does not spend cooldown on missing targets, hidden armor or paused use',()=>{
  const base=battle('REBAR_LEAD');expect(()=>applyDefenseCommand({...base,enemies:[]},content,{type:'UseSupport'})).toThrow('eligible');
  expect(()=>applyDefenseCommand({...base,paused:true},content,{type:'UseSupport'})).toThrow('active');
  expect(base.supportCooldownRemaining).toBe(0);
 });
 it('writes and removes only the guard key, preserving legacy active training bytes',async()=>{
  const data=new Map([[DEFENSE_SAVE_KEY,'legacy-active-run']]);
  const source={read:async(k:string)=>data.get(k)??null,write:async(k:string,v:string)=>{data.set(k,v);},remove:async(k:string)=>{data.delete(k);},keys:async()=>[...data.keys()]};
  const port=guardStoragePort(source);await port.write(DEFENSE_SAVE_KEY,'guard-run');expect(data.get(DEFENSE_SAVE_KEY)).toBe('legacy-active-run');expect(data.get(GUARD_SAVE_KEY)).toBe('guard-run');expect(await port.read(DEFENSE_SAVE_KEY)).toBe('guard-run');await port.remove(DEFENSE_SAVE_KEY);expect(data.get(DEFENSE_SAVE_KEY)).toBe('legacy-active-run');
 });
});
