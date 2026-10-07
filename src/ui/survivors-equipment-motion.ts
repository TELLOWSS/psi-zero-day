import type {SpritePose} from './survivors-sprite-motion';
interface Sample {clock:number;angle:number;velocity:number;facing:number}
export type EquipmentJoint='tool'|'radio'|'spray'|'armor'|'pack'|'wrist'|'dock'|'belt';
const JOINTS:Record<EquipmentJoint,{stiffness:number;damping:number;phase:number;sway:number;attack:number;limit:number}>={
 tool:{stiffness:180,damping:20,phase:.55,sway:.025,attack:.055,limit:.12},
 radio:{stiffness:240,damping:25,phase:.2,sway:.018,attack:.035,limit:.07},
 spray:{stiffness:130,damping:18,phase:.8,sway:.038,attack:.07,limit:.12},
 armor:{stiffness:300,damping:30,phase:0,sway:.006,attack:.012,limit:.025},
 pack:{stiffness:110,damping:17,phase:1.1,sway:.028,attack:.02,limit:.065},
 wrist:{stiffness:220,damping:24,phase:.4,sway:.02,attack:.055,limit:.085},
 dock:{stiffness:260,damping:28,phase:.75,sway:.012,attack:.015,limit:.035},
 belt:{stiffness:160,damping:21,phase:1.4,sway:.024,attack:.025,limit:.065},
};
/** A bounded presentation spring. The socket remains fixed; only the tool pivots. */
export class EquipmentMotion {
 private samples=new WeakMap<object,Map<string,Sample>>();
 sample(entity:object,clock:number,pose:SpritePose,reduced=false,id='tool',joint:EquipmentJoint='tool'):number {
  const time=Number.isFinite(clock)?Math.max(0,clock):0;
  let channels=this.samples.get(entity);
  if(!channels){channels=new Map();this.samples.set(entity,channels);}
  const previous=channels.get(id),profile=JOINTS[joint];
  if(reduced){channels.delete(id);return 0;}
  if(!previous||time<previous.clock||time-previous.clock>.25||previous.facing!==pose.facing){
   channels.set(id,{clock:time,angle:0,velocity:0,facing:pose.facing});return 0;
  }
  if(time===previous.clock)return previous.angle;
  const target=Math.max(-profile.limit,Math.min(profile.limit,-pose.lean*1.4+Math.sin(pose.cycle-profile.phase)*pose.gaitBlend*profile.sway-pose.action*profile.attack));
  const dt=time-previous.clock,steps=Math.ceil(dt/(1/120)),step=dt/steps;
  let {angle,velocity}=previous;
  for(let i=0;i<steps;i++){
   velocity+=((target-angle)*profile.stiffness-velocity*profile.damping)*step;
   angle+=velocity*step;
  }
  angle=Math.max(-profile.limit,Math.min(profile.limit,angle));
  channels.set(id,{clock:time,angle,velocity,facing:pose.facing});return angle;
 }
}
