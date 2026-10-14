import type {SpritePose} from './survivors-sprite-motion';
import {turnToward} from './survivors-foot-lock';

/** Breaker-only aim blending. Travel/gait/hit reactions come from the canonical tracker. */
export class BreakerAimMotion {
 private previous?:{clock:number;angle:number;pose:SpritePose};
 sample(pose:SpritePose,clock:number,aim:number):SpritePose {
  const previous=this.previous;
  if(previous&&clock===previous.clock&&pose.entity===previous.pose.entity&&pose.actionKind===previous.pose.actionKind&&pose.actionProgress===previous.pose.actionProgress&&pose.action===previous.pose.action&&pose.reaction===previous.pose.reaction)return previous.pose;
  const reset=!previous||pose.entity!==previous.pose.entity||clock<previous.clock||clock-previous.clock>.5;
  const angle=reset?aim:turnToward(previous.angle,aim,Math.max(0,clock-previous.clock),Math.PI*8);
  const speed=!pose.moving?0:reset?pose.speed:previous.pose.speed+(pose.speed-previous.pose.speed)*(1-Math.exp(-Math.max(0,clock-previous.clock)/.065));
  const difference=Math.atan2(Math.sin(aim-angle),Math.cos(aim-angle));
  const result:SpritePose={...pose,visualAngle:angle,direction:(Math.round(angle/(Math.PI/4))+8)%8,
   facing:(Math.cos(angle)<0?-1:1),attackAngle:aim,turning:!pose.moving&&Math.abs(difference)>.015,speed,
   mode:pose.reaction>0?'brace':pose.moving?(speed>145?'run':'walk'):pose.mode};
  this.previous={clock,angle,pose:result};return result;
 }
}

/** Artwork has a fixed grip-to-tip size; aim and recoil never stretch the held device. */
export function equippedToolPose(muzzle:{x:number;y:number},direction:{x:number;y:number},cell:number,action:number,tier=1){
 const lengths=[32,30,30,32,34,30];
 const length=lengths[Math.max(0,Math.min(5,cell))]!,recoil=Math.max(0,Math.min(1,action))*1.8;
 const x=muzzle.x-direction.x*recoil,y=muzzle.y-direction.y*recoil;
 return {tip:{x,y},grip:{x:x-direction.x*length,y:y-direction.y*length},length,tier:Math.max(1,Math.min(4,tier))};
}
