import type {OperationHandoff} from './survivors-operation-handoff';
import {canShowHandoffDialogue,isHandoffDialogueRecord,type HandoffDialogueRecord} from './survivors-handoff-dialogue';
export type NarrativeDirection='control'|'coordination'|'investigation';
export interface NarrativeDirectionRecord {version:1;characterId:'player';direction:NarrativeDirection;}
export function isNarrativeDirectionRecord(value:unknown):value is NarrativeDirectionRecord {
 if(!value||typeof value!=='object')return false;
 const row=value as Partial<NarrativeDirectionRecord>;
 return row.version===1&&row.characterId==='player'&&['control','coordination','investigation'].includes(row.direction??'');
}
export function canChooseNarrativeDirection(record:OperationHandoff|null,dialogue:HandoffDialogueRecord|null) {
 return Boolean(record&&canShowHandoffDialogue(record)&&isHandoffDialogueRecord(dialogue));
}
