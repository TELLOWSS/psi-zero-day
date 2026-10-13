import type {CharacterId,PatrolStageId,SurvivorsGameState} from './patrol-survivors';
export interface OperationHandoff {version:1;characterId:CharacterId;stageId:PatrolStageId;stageNumber:number;outcome:'victory'|'defeat';zones:number;cartStops:number;rubbleCleared:number;damageTaken:number;stars:boolean[];clearedTerrainIds?:string[];}
export function operationHandoff(state:SurvivorsGameState):OperationHandoff|null {
 if(state.phase!=='victory'&&state.phase!=='defeat')return null;
 return {version:1,characterId:state.characterId,stageId:state.stageId,stageNumber:state.stage.stageNumber,outcome:state.phase,zones:state.operationControlledZones?.length??0,cartStops:state.terrainRecord?.cartStops??0,rubbleCleared:state.terrainRecord?.rubbleCleared??0,damageTaken:state.terrainRecord?.damageTaken??0,stars:[...state.starsEarned],clearedTerrainIds:state.terrain?.filter(t=>t.kind==='rubble'&&t.hp<=0&&!state.inheritedTerrainIds?.includes(t.id)).map(t=>t.id)??[]};
}
