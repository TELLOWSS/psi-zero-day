import type {OperationHandoff} from './survivors-operation-handoff';
import {isOperationHandoff} from './operation-handoff-validation';
import type {PatrolStageId} from './patrol-survivors';

/** Pilot receiving route only; matching generic terrain IDs across other sites is not evidence. */
export function resolveHandoffCarry(records:readonly OperationHandoff[], stageId:PatrolStageId) {
  if(stageId!=='stage_13')return null;
  const record=records.filter(isOperationHandoff).filter(r=>r.stageId==='stage_12').at(-1);
  if(!record||record.outcome!=='victory'||!record.clearedTerrainIds?.includes('terrain_rubble'))return null;
  return {record,clearedTerrainIds:['terrain_rubble']};
}
