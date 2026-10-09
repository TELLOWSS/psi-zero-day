import type {PinballRule} from '../domain/survivors-recreation';
export const PINBALL_RECORD_KEY='psi.survivors.pinball.best.v1';
export const PINBALL_PRACTICE_RECORD_KEY='psi.survivors.pinball.practice.best.v1';
export interface PinballBest {score:number;combo:number;}
export function readPinballBest(mode:'bonus'|'practice'='bonus',rule:PinballRule='classic'):PinballBest {
 try{const value=JSON.parse(localStorage.getItem((mode==='practice'?PINBALL_PRACTICE_RECORD_KEY:PINBALL_RECORD_KEY)+(rule==='classic'?'':'.'+rule))??'null');
  if(value?.version===1&&Number.isSafeInteger(value.score)&&value.score>=0&&value.score<=1e8
    &&Number.isSafeInteger(value.combo)&&value.combo>=0&&value.combo<=1e6)return {score:value.score,combo:value.combo};
 }catch{/* Optional personal record does not block the game. */}
 return {score:0,combo:0};
}
export function savePinballBest(value:PinballBest,mode:'bonus'|'practice'='bonus',rule:PinballRule='classic'):PinballBest {
 const previous=readPinballBest(mode,rule);
 if(!Number.isSafeInteger(value.score)||value.score<0||value.score>1e8||!Number.isSafeInteger(value.combo)||value.combo<0||value.combo>1e6)return previous;
 const next={score:Math.max(previous.score,value.score),combo:Math.max(previous.combo,value.combo)};
 try{localStorage.setItem((mode==='practice'?PINBALL_PRACTICE_RECORD_KEY:PINBALL_RECORD_KEY)+(rule==='classic'?'':'.'+rule),JSON.stringify({version:1,...next}));}catch{/* Credits are already saved independently. */}
 return next;
}
