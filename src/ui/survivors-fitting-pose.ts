import type {SpritePose} from './survivors-sprite-motion';
import {attackEnvelope,type AttackMotion} from './survivors-attack-motion';
export type FittingMotion='idle'|'walk'|'action';
/** Isolated presentation clock: no engine input, damage, or inventory mutation. */
export function fittingPose(clock:number,motion:FittingMotion,facing:1|-1,reduced:boolean,attackKind:AttackMotion='shot'):SpritePose {
 const t=reduced?0:Math.max(0,Number.isFinite(clock)?clock:0),moving=!reduced&&motion==='walk';
 const action=!reduced&&motion==='action'?attackEnvelope(t%1.4,attackKind):0;
 const cycle=moving?t*120*Math.PI*2/54:0;
 return {moving,cycle,facing,lean:moving?facing*.024:0,scaleY:1-(moving?Math.abs(Math.sin(cycle))*.018:reduced?0:(1+Math.sin(t*2.4))*.002),reaction:0,action,speed:moving?120:0,gaitBlend:moving?1:0,stride:54,travel:moving?t*120:0,directionY:0,mode:moving?'walk':action>0?'action':'idle'};
}
