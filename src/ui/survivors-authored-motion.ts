import type {SpritePose} from './survivors-sprite-motion';
export const AUTHORED_POSES={idle:0,walk:1,run:9,pivotLeft:13,pivotRight:14,command:15,brace:18,recover:19} as const;
/** Playback contract for genuine 20-pose direction sheets; never relabels legacy frames. */
export function authoredMotionWeights(pose:SpritePose):{direction:number;frame:number;weight:number}[]{
 const angle=Number.isFinite(pose.visualAngle)?pose.visualAngle!:(pose.direction??2)*Math.PI/4;
 const direction=((Math.round(angle/(Math.PI/4))%8)+8)%8;
 const cycle=pose.contactCycle??pose.authoredCycle??pose.cycle,tau=Math.PI*2;
 const phase=((Number.isFinite(cycle)?cycle:0)%tau+tau)%tau/tau;
 if(!pose.moving&&pose.reaction>0)return [{direction,frame:pose.reaction>.45?18:19,weight:1}];
 if(!pose.moving&&(pose.action>0||(pose.equipmentCheck??0)>0)){const progress=Math.max(0,Math.min(.999,(pose.equipmentCheck??0)>0?pose.equipmentCheck!:pose.actionProgress??0)),t=Math.max(0,Math.min(1,progress/.12,(1-progress)/.16)),blend=t*t*(3-2*t);return [{direction,frame:0,weight:1-blend},{direction,frame:15+Math.min(2,Math.floor(progress*3)),weight:blend}].filter(f=>f.weight>0);}
 if(!pose.moving&&pose.turning){
  const heading=((angle/(Math.PI/4)%8)+8)%8,lower=Math.floor(heading),fraction=heading-lower;
  const t=Math.max(0,Math.min(1,(fraction-.44)/.12)),blend=t*t*(3-2*t);
  return [{direction:lower,frame:14,weight:1-blend},{direction:(lower+1)%8,frame:13,weight:blend}].filter(f=>f.weight>0);
 }
 if(!pose.moving)return [{direction,frame:0,weight:1}];
 const running=pose.mode==='run'||pose.speed>145,count=running?4:8,start=running?9:1;
 const cursor=phase*count,index=Math.floor(cursor),t=Math.max(0,(cursor-index-.88)/.12),blend=t*t*(3-2*t);
 const gait=Math.max(0,Math.min(1,Number.isFinite(pose.gaitBlend)?pose.gaitBlend:0));
 return [{direction,frame:0,weight:1-gait},{direction,frame:start+index,weight:gait*(1-blend)},
  {direction,frame:start+(index+1)%count,weight:gait*blend}].filter(f=>f.weight>0);
}
