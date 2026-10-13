import type {CharacterId, PatrolStageDefinition, SurvivorsGameState} from '../domain/patrol-survivors';
import type {OperationHandoff} from '../domain/survivors-operation-handoff';
import {isOperationHandoff} from '../domain/operation-handoff-validation';
import {createTerrain} from '../engine/survivors-terrain';

export type StoryFocus = 'route' | 'stop' | 'zone';
export function storyRole(characterId:CharacterId) {
  return characterId==='park' ? 'kang_taesik' : characterId==='jung'||characterId==='yoon' ? 'player' : characterId;
}
const preferences:Record<ReturnType<typeof storyRole>,readonly StoryFocus[]>={
  player:['zone','route','stop'], kang_taesik:['route','zone','stop'], yoon_sungho:['stop','route','zone'],
  lee_jaehoon:['zone','route','stop'], lim_junho:['stop','route','zone'], safety_monitor:['zone','route','stop'],
};
/** A presentation goal uses only mechanics present in this authored stage. No extra reward or win condition. */
export function operationStoryFocus(characterId:CharacterId,stage:PatrolStageDefinition):StoryFocus|null {
  const available={
    route:createTerrain(stage).some(object=>object.kind==='rubble'),
    stop:stage.hazardMix?.includes('RUNAWAY_CART') || stage.bossType==='RUNAWAY_CART',
    zone:stage.hazards.some(h=>['explosive_barrel','electric_transformer','crane_drop_zone'].includes(h.type)),
  };
  return preferences[storyRole(characterId)].find(focus=>available[focus])??null;
}
export function storyFacts(record:Pick<OperationHandoff,'rubbleCleared'|'cartStops'|'zones'>) {
  return {route:record.rubbleCleared,stop:record.cartStops,zone:record.zones};
}
export function operationStoryResult(record:OperationHandoff|null,stage:PatrolStageDefinition) {
  if(!isOperationHandoff(record)||record.stageId!==stage.id)return null;
  const role=storyRole(record.characterId),focus=operationStoryFocus(record.characterId,stage);
  const facts=storyFacts(record);
  return {role,focus,facts,fulfilled:focus!==null&&facts[focus]>0,retry:record.outcome==='defeat'};
}
export function operationStoryMemory(records:readonly OperationHandoff[],characterId:CharacterId,stage:PatrolStageDefinition) {
  const record=records.filter(isOperationHandoff).filter(row=>row.characterId===characterId).at(-1);
  return record?{record,facts:storyFacts(record),revisit:record.stageId===stage.id,retry:record.outcome==='defeat'}:null;
}
export function operationStoryIntermission(state:SurvivorsGameState,completedWave:number) {
  if(state.stageId!=='stage_12'||state.phase!=='paused'||(completedWave!==1&&completedWave!==2))return null;
  return {wave:completedWave,role:storyRole(state.characterId),facts:storyFacts({
    rubbleCleared:state.terrainRecord?.rubbleCleared??0,cartStops:state.terrainRecord?.cartStops??0,zones:state.operationControlledZones?.length??0,
  })};
}
