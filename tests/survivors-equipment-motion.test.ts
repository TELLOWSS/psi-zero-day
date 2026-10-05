import {expect,it} from 'vitest';
import {EquipmentMotion} from '../src/ui/survivors-equipment-motion';
import {SpriteMotionTracker} from '../src/ui/survivors-sprite-motion';
const base=new SpriteMotionTracker().sample({},0,0,0);
it('lags attack motion, remains bounded and settles after movement ends',()=>{
 const motion=new EquipmentMotion(),entity={};motion.sample(entity,0,base);
 const pose={...base,action:1,lean:.03,gaitBlend:1,cycle:1};
 const first=motion.sample(entity,1/60,pose);
 const later=motion.sample(entity,2/60,pose);
 expect(first).toBeLessThan(0);expect(Math.abs(later)).toBeGreaterThan(Math.abs(first));
 expect(motion.sample(entity,2/60,base)).toBe(later);
 let angle=later;
 for(let i=3;i<180;i++){angle=motion.sample(entity,i/60,base);expect(Math.abs(angle)).toBeLessThanOrEqual(.12);}
 expect(Math.abs(angle)).toBeLessThan(.0001);
});
it('resets on reduced motion, clock jumps and facing changes without touching the pose',()=>{
 const motion=new EquipmentMotion(),entity={},pose={...base,action:1};
 const before=JSON.stringify(pose);motion.sample(entity,0,pose);motion.sample(entity,.1,pose);
 expect(motion.sample(entity,.1,pose,true)).toBe(0);
 expect(motion.sample(entity,.2,pose)).toBe(0);
 motion.sample(entity,.3,pose);expect(motion.sample(entity,.31,{...pose,facing:-1})).toBe(0);
 expect(motion.sample(entity,2,pose)).toBe(0);expect(motion.sample(entity,0,pose)).toBe(0);
 expect(JSON.stringify(pose)).toBe(before);
});
