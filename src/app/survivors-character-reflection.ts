import type {CharacterId} from '../domain/patrol-survivors';
import type {OperationHandoff} from '../domain/survivors-operation-handoff';
import {isOperationHandoff} from '../domain/operation-handoff-validation';
import {canShowHandoffDialogue} from '../domain/survivors-handoff-dialogue';

export type ReflectionEvidence='route'|'stop'|'zone'|'retry';
export function characterReflection(records:readonly OperationHandoff[],characterId:CharacterId) {
 const record=records.filter(isOperationHandoff).filter(row=>row.characterId===characterId).at(-1);
 if(!record)return null;
 const evidence:ReflectionEvidence[]=[];
 if(record.rubbleCleared>0)evidence.push('route');
 if(record.cartStops>0)evidence.push('stop');
 if(record.zones>0)evidence.push('zone');
 if(record.outcome==='defeat')evidence.push('retry');
 return {record,evidence};
}

export function hasPlayerHandoffScene(record:OperationHandoff) {
 return canShowHandoffDialogue(record);
}
export function playerHandoffSceneRecord(records:readonly OperationHandoff[]) {
 const record=records.filter(isOperationHandoff).filter(row=>row.characterId==='player'&&row.stageId==='stage_12').at(-1);
 return record&&hasPlayerHandoffScene(record)?record:null;
}
export function confirmedHandoffScene(record:OperationHandoff|null,records:readonly OperationHandoff[]) {
 if(!record||!hasPlayerHandoffScene(record))return null;
 const saved=playerHandoffSceneRecord(records);
 if(!saved)return null;
 return saved.rubbleCleared===record.rubbleCleared&&saved.cartStops===record.cartStops&&saved.zones===record.zones&&saved.damageTaken===record.damageTaken&&saved.stars.length===record.stars.length&&saved.stars.every((star,index)=>star===record.stars[index])?record:null;
}
