import type {DefenseTowerDefinition,DefenseTowerState,DefenseTowerLevelDefinition} from '../domain/defense';
export function guardEvolutionState(definition:DefenseTowerDefinition,tower:DefenseTowerState,level:DefenseTowerLevelDefinition,resource:number,ultimateAvailable:boolean){
 if(level.id===tower.levelId)return 'current';
 let parent=definition.levels.find(l=>l.id===tower.levelId)?.from;
 while(parent){if(parent===level.id)return 'completed';parent=definition.levels.find(l=>l.id===parent)?.from;}
 if(level.id.startsWith('L4')&&!ultimateAvailable)return 'campaign-locked';
 if(level.from===tower.levelId)return resource<level.cost?'resource':'available';
 return 'other-branch';
}
