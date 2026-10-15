import definition from '../../content/defense/guard-lab-v1.json';
import type {DefenseContent,DefenseLevelId,DefenseTowerId,DefenseWaveDefinition,DefenseSpawnGroup} from '../domain/defense';
import {createDefenseRun,applyDefenseCommand,advanceDefenseWithCombat} from '../engine/defense';

export const GUARD_LAB_STATIC_TICKS=definition.staticTicks;
export const GUARD_LAB_MAXIMUM_TICKS=definition.maximumTicks;
export type GuardLabFixture='MIXED'|keyof typeof definition.fixtures;
export const GUARD_LAB_FIXTURES:readonly GuardLabFixture[]=['MIXED','NORMAL','SWARM','ARMORED','VEILED'];
export function guardLabContent(content:DefenseContent,fixture:GuardLabFixture='MIXED'):DefenseContent{
 const waves=fixture==='MIXED'?definition.waves as readonly DefenseWaveDefinition[]:[{id:1,groups:definition.fixtures[fixture] as readonly DefenseSpawnGroup[]}];
 return {...content,initialResource:definition.initialResource,waves};
}
export function createGuardLabRun(content:DefenseContent,towerId:DefenseTowerId,level:DefenseLevelId,fixture:GuardLabFixture='MIXED'){
 const simulation=guardLabContent(content,fixture);
 let run=createDefenseRun(simulation,'COORDINATOR','guard-lab');
 run=applyDefenseCommand(run,simulation,{type:'Build',padId:content.map.pads[0]!.id,towerId});
 if(level!=='L1')run=applyDefenseCommand(run,simulation,{type:'Upgrade',towerInstanceId:run.towers[0]!.id,levelId:'L2'});
 if(level.startsWith('L3'))run=applyDefenseCommand(run,simulation,{type:'Upgrade',towerInstanceId:run.towers[0]!.id,levelId:level});
 return applyDefenseCommand(run,simulation,{type:'StartWave'});
}
export function compareGuardBranches(content:DefenseContent,towerId:DefenseTowerId,fixture:GuardLabFixture){
 const simulation=guardLabContent(content,fixture);
 return (['L3A','L3B'] as const).map(level=>{
  const run=createGuardLabRun(content,towerId,level,fixture),frame=advanceDefenseWithCombat(run,simulation,GUARD_LAB_MAXIMUM_TICKS),targets=frame.shots.flatMap(s=>s.targets);
  return {level,damage:targets.reduce((n,t)=>n+t.damage,0),resolved:targets.filter(t=>t.resolved).length,spawned:frame.state.nextEnemySequence-1,hits:targets.length};
 });
}
