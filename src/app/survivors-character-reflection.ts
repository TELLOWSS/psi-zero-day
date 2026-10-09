import type {CharacterId} from '../domain/patrol-survivors';
import type {OperationHandoff} from '../domain/survivors-operation-handoff';
import {isOperationHandoff} from '../domain/operation-handoff-validation';

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
