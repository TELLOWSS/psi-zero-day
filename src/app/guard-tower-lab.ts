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
export function createGuardLabRun(content:DefenseContent,towerId:DefenseTowerId,level:DefenseLevelId,fixture:GuardLabFixture='MIXED',padId=content.map.pads[0]!.id){
 const simulation=guardLabContent(content,fixture);
 let run=createDefenseRun(simulation,'COORDINATOR','guard-lab',{ultimateUnlocked:true});
 run=applyDefenseCommand(run,simulation,{type:'Build',padId,towerId});
 if(level!=='L1')run=applyDefenseCommand(run,simulation,{type:'Upgrade',towerInstanceId:run.towers[0]!.id,levelId:'L2'});
 if(level.startsWith('L3'))run=applyDefenseCommand(run,simulation,{type:'Upgrade',towerInstanceId:run.towers[0]!.id,levelId:level});
 if(level.startsWith('L4')){run=applyDefenseCommand(run,simulation,{type:'Upgrade',towerInstanceId:run.towers[0]!.id,levelId:level==='L4A'?'L3A':'L3B'});run=applyDefenseCommand(run,simulation,{type:'Upgrade',towerInstanceId:run.towers[0]!.id,levelId:level});}
 return applyDefenseCommand(run,simulation,{type:'StartWave'});
}
export function compareGuardBranches(content:DefenseContent,towerId:DefenseTowerId,fixture:GuardLabFixture,tier:'L3'|'L4'='L3',padId=content.map.pads[0]!.id){
 const simulation=guardLabContent(content,fixture);
 return (tier==='L4'?['L4A','L4B'] as const:['L3A','L3B'] as const).map(level=>{
  let run=createGuardLabRun(content,towerId,level,fixture,padId),damage=0,resolved=0,hits=0,slowTicks=0,revealTicks=0;
  for(let tick=0;tick<GUARD_LAB_MAXIMUM_TICKS&&run.status==='RUNNING';tick++){
   const frame=advanceDefenseWithCombat(run,simulation);run=frame.state;
   for(const shot of frame.shots)for(const hit of shot.targets){damage+=hit.damage;hits++;if(hit.resolved)resolved++;}
   for(const enemy of run.enemies){
    if((enemy.lockedUntilTick??0)>run.tick||enemy.slowEffects.some(s=>s.startTick<=run.tick&&s.endTick>run.tick))slowTicks++;
    if(content.enemies.find(e=>e.id===enemy.enemyId)!.hidden&&enemy.revealUntilTick>run.tick)revealTicks++;
   }
  }
  return {level,damage,resolved,spawned:run.nextEnemySequence-1,hits,slowEnemySeconds:slowTicks*content.tickMs/1000,revealedEnemySeconds:revealTicks*content.tickMs/1000};
 });
}
