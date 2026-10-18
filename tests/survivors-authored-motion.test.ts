import {it,expect} from 'vitest';
import {authoredMotionWeights} from '../src/ui/survivors-authored-motion';
import {SpriteMotionTracker} from '../src/ui/survivors-sprite-motion';
import {fittingPose} from '../src/ui/survivors-fitting-pose';
it('plays all eight walk phases and four run phases without escaping the sheet',()=>{
 for(const [speed,start,count] of [[120,1,8],[220,9,4]] as const){
  const frames=new Set<number>();for(let i=0;i<240;i++){
   const weights=authoredMotionWeights({...fittingPose(i/60,'walk',1,false),speed,contactCycle:i/240*Math.PI*2});
   expect(weights.reduce((sum,f)=>sum+f.weight,0)).toBeCloseTo(1);
   for(const f of weights){expect(f.frame).toBeGreaterThanOrEqual(start!);expect(f.frame).toBeLessThan(start!+count!);frames.add(f.frame);}
  }expect(frames.size).toBe(count);
 }
});
it('keeps actions, pivot and impact separate from walking',()=>{
 const pose=fittingPose(0,'idle',1,false);
 expect(authoredMotionWeights({...pose,turning:true,visualAngle:.1})[0]!.frame).toBe(14);
 expect(authoredMotionWeights({...pose,turning:true,visualAngle:-.1})[0]!.frame).toBe(13);
 expect(authoredMotionWeights({...pose,reaction:.8}).at(-1)!.frame).toBe(18);
 expect(authoredMotionWeights({...pose,reaction:.2}).at(-1)!.frame).toBe(19);
 expect(authoredMotionWeights({...pose,action:1,actionProgress:.9}).at(-1)!.frame).toBe(17);
});

it('settles a stopped walk or run into idle while keeping cadence and paused samples frozen',()=>{
 for(const speed of [120,220]){
  const tracker=new SpriteMotionTracker(),actor={};
  tracker.sample(actor,0,0,0);
  const moving=tracker.sample(actor,speed*.1,0,.1);
  let lastGait=1;
  for(const clock of [.125,.15,.175]){
   const pose=tracker.sample(actor,speed*.1,0,clock);
   const weights=authoredMotionWeights({...pose,turning:false});
   expect(pose.moving).toBe(false);
   expect(pose.contactCycle).toBe(moving.contactCycle);
   expect(pose.locomotionMode).toBe(speed>145?'run':'walk');
   expect(pose.gaitBlend).toBeLessThan(lastGait);lastGait=pose.gaitBlend;
   expect(weights.reduce((sum,f)=>sum+f.weight,0)).toBeCloseTo(1);
   expect(weights.some(f=>f.frame===0&&f.weight>0&&f.weight<1)).toBe(true);
   expect(weights.some(f=>f.frame>=(speed>145?9:1)&&f.frame<=(speed>145?12:8))).toBe(true);
   const paused=tracker.sample(actor,speed*.1,0,clock);
   expect(authoredMotionWeights({...paused,turning:false})).toEqual(weights);
  }
  const idle=tracker.sample(actor,speed*.1,0,.25);
  expect(authoredMotionWeights({...idle,turning:false})).toEqual([{direction:idle.direction!,frame:0,weight:1}]);
 }
});
