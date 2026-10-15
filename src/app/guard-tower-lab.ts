import definition from '../../content/defense/guard-lab-v1.json';
import type {DefenseContent,DefenseLevelId,DefenseTowerId,DefenseWaveDefinition} from '../domain/defense';
import {createDefenseRun,applyDefenseCommand} from '../engine/defense';

export const GUARD_LAB_STATIC_TICKS=definition.staticTicks;
export const GUARD_LAB_MAXIMUM_TICKS=definition.maximumTicks;
export function guardLabContent(content:DefenseContent):DefenseContent{
 return {...content,initialResource:definition.initialResource,waves:definition.waves as readonly DefenseWaveDefinition[]};
}
export function createGuardLabRun(content:DefenseContent,towerId:DefenseTowerId,level:DefenseLevelId){
 const simulation=guardLabContent(content);
 let run=createDefenseRun(simulation,'COORDINATOR','guard-lab');
 run=applyDefenseCommand(run,simulation,{type:'Build',padId:content.map.pads[0]!.id,towerId});
 if(level!=='L1')run=applyDefenseCommand(run,simulation,{type:'Upgrade',towerInstanceId:run.towers[0]!.id,levelId:'L2'});
 if(level.startsWith('L3'))run=applyDefenseCommand(run,simulation,{type:'Upgrade',towerInstanceId:run.towers[0]!.id,levelId:level});
 return applyDefenseCommand(run,simulation,{type:'StartWave'});
}
