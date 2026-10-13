import {HANDOFF_DIALOGUE_EVENT,isHandoffDialogueRecord,type HandoffDialogueChoice,type HandoffDialogueRecord} from '../domain/survivors-handoff-dialogue';
export const HANDOFF_DIALOGUE_KEY='psi.survivors.handoff-dialogue.v1';
type DialogueStorage=Pick<Storage,'getItem'|'setItem'>;
function storage():DialogueStorage|null {try{return typeof window==='undefined'?null:window.localStorage;}catch{return null;}}
export function readHandoffDialogue(target=storage()):HandoffDialogueRecord|null {
 try{const value:unknown=JSON.parse(target?.getItem(HANDOFF_DIALOGUE_KEY)??'null');return isHandoffDialogueRecord(value)?value:null;}catch{return null;}
}
export function saveHandoffDialogue(choice:HandoffDialogueChoice,target=storage()):boolean {
 if(!target||!isHandoffDialogueRecord({version:1,eventId:HANDOFF_DIALOGUE_EVENT,choice}))return false;
 try{
  const existing=readHandoffDialogue(target);
  if(existing)return existing.choice===choice;
  target.setItem(HANDOFF_DIALOGUE_KEY,JSON.stringify({version:1,eventId:HANDOFF_DIALOGUE_EVENT,choice}));return true;
 }catch{return false;}
}
