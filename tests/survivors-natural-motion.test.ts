import {expect,it} from 'vitest';
import {SpriteMotionTracker} from '../src/ui/survivors-sprite-motion';
import {EquipmentMotion} from '../src/ui/survivors-equipment-motion';

it('connects stride continuously across the former run boundary',()=>{
 const poses=[144.99,145,145.01].map(speed=>{const t=new SpriteMotionTracker(),e={};t.sample(e,0,0,0);return t.sample(e,speed/60,0,1/60);});
 expect(Math.abs(poses[2]!.stride-poses[0]!.stride)).toBeLessThan(.01);
});
it('eases startup, brakes without extra steps and settles on simulation time',()=>{
 const t=new SpriteMotionTracker(),e={};t.sample(e,0,0,0);
 let p=t.sample(e,2,0,.01);expect(p.gaitBlend).toBeCloseTo(.028);expect(p.lean).toBeGreaterThan(0);
 for(let i=2;i<=60;i++)p=t.sample(e,i*2,0,i*.01);
 const cycle=p.cycle;
 const brake=t.sample(e,120,0,.61);expect(brake.lean).toBeLessThan(p.lean);expect(brake.gaitBlend).toBeCloseTo(.972);
 expect(t.sample(e,120,0,.61)).toBe(brake);
 for(let i=62;i<=160;i++)p=t.sample(e,120,0,i*.01);
 expect(p.cycle).toBe(cycle);expect(p.gaitBlend).toBe(0);expect(Math.abs(p.lean)).toBeLessThan(.0001);
});
it('restarts inference after rewinds or long gaps without residual lean',()=>{
 const t=new SpriteMotionTracker(),e={};t.sample(e,0,0,0);t.sample(e,10,0,.1);
 const reset=t.sample(e,400,0,1);expect(reset.moving).toBe(false);expect(reset.lean).toBe(0);
 const rewind=t.sample(e,400,0,.2);expect(rewind.travel).toBe(0);expect(rewind.gaitBlend).toBe(0);
});
it('integrates a held spring target identically at 30/60/120Hz',()=>{
 const base=new SpriteMotionTracker().sample({},0,0,0),pose={...base,lean:.02,action:1};
 const angles=[30,60,120].map(rate=>{const motion=new EquipmentMotion(),e={};motion.sample(e,0,pose);let a=0;for(let i=1;i<=rate;i++)a=motion.sample(e,i/rate,pose);return a;});
 expect(angles[0]).toBeCloseTo(angles[1]!,10);expect(angles[1]).toBeCloseTo(angles[2]!,10);
});
it('does not mirror inertia for authored directional bodies',()=>{
 const base=new SpriteMotionTracker().sample({},0,0,0),pose={...base,directional:true,lean:.02};
 const m=new EquipmentMotion(),e={};m.sample(e,0,pose);const a=m.sample(e,.1,pose);
 expect(m.sample(e,.1,{...pose,facing:-1})).toBe(a);
});
