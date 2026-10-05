import type {SpritePose} from './survivors-sprite-motion';
interface Sample {clock:number;angle:number;velocity:number;facing:number}
/** A bounded presentation spring. The socket remains fixed; only the tool pivots. */
export class EquipmentMotion {
 private samples=new WeakMap<object,Sample>();
 sample(entity:object,clock:number,pose:SpritePose,reduced=false):number {
  const time=Number.isFinite(clock)?Math.max(0,clock):0;
  const previous=this.samples.get(entity);
  if(reduced){this.samples.delete(entity);return 0;}
  if(!previous||time<previous.clock||time-previous.clock>.25||previous.facing!==pose.facing){
   this.samples.set(entity,{clock:time,angle:0,velocity:0,facing:pose.facing});return 0;
  }
  if(time===previous.clock)return previous.angle;
  const target=Math.max(-.10,Math.min(.10,-pose.lean*1.4+Math.sin(pose.cycle-.55)*pose.gaitBlend*.025-pose.action*.055));
  const dt=time-previous.clock,steps=Math.ceil(dt/(1/120)),step=dt/steps;
  let {angle,velocity}=previous;
  for(let i=0;i<steps;i++){
   velocity+=((target-angle)*180-velocity*20)*step;
   angle+=velocity*step;
  }
  angle=Math.max(-.12,Math.min(.12,angle));
  this.samples.set(entity,{clock:time,angle,velocity,facing:pose.facing});return angle;
 }
}
