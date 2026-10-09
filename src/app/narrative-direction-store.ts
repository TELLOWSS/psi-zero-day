import {canChooseNarrativeDirection,isNarrativeDirectionRecord,type NarrativeDirection,type NarrativeDirectionRecord} from '../domain/survivors-narrative-direction';
import type {OperationHandoff} from '../domain/survivors-operation-handoff';
import type {HandoffDialogueRecord} from '../domain/survivors-handoff-dialogue';
export const NARRATIVE_DIRECTION_KEY='psi.survivors.narrative-direction.v1';
type DirectionStorage=Pick<Storage,'getItem'|'setItem'>;
function storage():DirectionStorage|null {try{return typeof window==='undefined'?null:window.localStorage;}catch{return null;}}
export function readNarrativeDirection(target=storage()):NarrativeDirectionRecord|null {
 try{const value:unknown=JSON.parse(target?.getItem(NARRATIVE_DIRECTION_KEY)??'null');return isNarrativeDirectionRecord(value)?value:null;}catch{return null;}
}
export function saveNarrativeDirection(direction:NarrativeDirection,record:OperationHandoff|null,dialogue:HandoffDialogueRecord|null,target=storage()):boolean {
 const value:NarrativeDirectionRecord={version:1,characterId:'player',direction};
 if(!target||!canChooseNarrativeDirection(record,dialogue)||!isNarrativeDirectionRecord(value))return false;
 try{if(readNarrativeDirection(target)?.direction===direction)return true;target.setItem(NARRATIVE_DIRECTION_KEY,JSON.stringify(value));return true;}catch{return false;}
}
