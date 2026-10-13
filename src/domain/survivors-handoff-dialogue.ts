import type {OperationHandoff} from './survivors-operation-handoff';
import {isOperationHandoff} from './operation-handoff-validation';
export const HANDOFF_DIALOGUE_EVENT='player.stage12.handoff.v1';
export type HandoffDialogueChoice='together'|'explain';
export interface HandoffDialogueRecord {version:1;eventId:typeof HANDOFF_DIALOGUE_EVENT;choice:HandoffDialogueChoice;}
export function canShowHandoffDialogue(record:OperationHandoff) {
 return isOperationHandoff(record)&&record.characterId==='player'&&record.stageId==='stage_12'&&record.outcome==='victory'&&record.rubbleCleared>0;
}
export function isHandoffDialogueRecord(value:unknown):value is HandoffDialogueRecord {
 if(!value||typeof value!=='object')return false;
 const row=value as Partial<HandoffDialogueRecord>;
 return row.version===1&&row.eventId===HANDOFF_DIALOGUE_EVENT&&(row.choice==='together'||row.choice==='explain');
}
