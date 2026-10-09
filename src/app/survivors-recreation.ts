import {availablePinballChoice,type PinballRule,type PinballTheme} from '../domain/survivors-recreation';
export const PINBALL_CHOICE_KEY='psi.survivors.pinball.choice.v1';
export function readPinballChoice(clears:number){try{return availablePinballChoice(JSON.parse(localStorage.getItem(PINBALL_CHOICE_KEY)??'null'),clears);}catch{return availablePinballChoice(null,clears);}}
export function savePinballChoice(choice:{theme:PinballTheme;rule:PinballRule},clears:number){const safe=availablePinballChoice(choice,clears);try{localStorage.setItem(PINBALL_CHOICE_KEY,JSON.stringify(safe));return true;}catch{return false;}}
