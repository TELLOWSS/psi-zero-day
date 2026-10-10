import {availablePinballChoice,type PinballRule,type PinballTheme} from '../domain/survivors-recreation';
import type {PatrolStageId} from '../domain/patrol-survivors';
export const PINBALL_CHOICE_KEY='psi.survivors.pinball.choice.v1';
export function readPinballChoice(clears:number,stages?:readonly PatrolStageId[]){try{return availablePinballChoice(JSON.parse(localStorage.getItem(PINBALL_CHOICE_KEY)??'null'),clears,stages);}catch{return availablePinballChoice(null,clears,stages);}}
export function savePinballChoice(choice:{theme:PinballTheme;rule:PinballRule},clears:number,stages?:readonly PatrolStageId[]){const safe=availablePinballChoice(choice,clears,stages);try{localStorage.setItem(PINBALL_CHOICE_KEY,JSON.stringify(safe));return true;}catch{return false;}}
