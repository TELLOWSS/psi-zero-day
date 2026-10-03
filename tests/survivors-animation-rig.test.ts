import { describe, expect, it } from 'vitest';
import { ACTOR_RIGS, footstep, solveKnee } from '../src/ui/survivors-animation-rig';
import { SpriteMotionTracker } from '../src/ui/survivors-sprite-motion';
describe('articulated construction actors',()=>{
 it('keeps at least one support foot grounded through an entire walk and run cycle',()=>{
  for(const running of [false,true])for(let n=0;n<128;n++){
   const cycle=n/128*Math.PI*2,left=footstep(cycle,false,running),right=footstep(cycle,true,running);
   expect(left.planted||right.planted).toBe(true);
   if(left.planted)expect(left.lift).toBe(0);
   if(right.planted)expect(right.lift).toBe(0);
  }
 });
 it('locks the planted foot in world space while the body advances',()=>{
  for(const running of [false,true]){
   const stride=running?66:54,contact=footstep(0,false,running).offset;
   for(let distance=0;distance<stride*.49;distance++)expect(distance+footstep(distance/stride*Math.PI*2,false,running).offset).toBeCloseTo(contact,9);
  }
 });
 it('connects stance and swing continuously at contact and loop boundaries',()=>{
  for(const boundary of [Math.PI,Math.PI*2]){
   const before=footstep(boundary-1e-6),after=footstep(boundary+1e-6);
   expect(before.offset).toBeCloseTo(after.offset,4);expect(before.lift).toBeCloseTo(after.lift,4);
  }
 });
 it('bends the knee without changing reachable thigh and shin lengths',()=>{
  const hip={x:0,y:0},ankle={x:5,y:32},knee=solveKnee(hip,ankle,19,19,-1);
  expect(Math.hypot(knee.x,knee.y)).toBeCloseTo(19,8);
  expect(Math.hypot(knee.x-ankle.x,knee.y-ankle.y)).toBeCloseTo(19,8);
 });
 it('covers every canonical playable art and worker with anatomically ordered joints',()=>{
  for(const name of ['player','kang-taesik','yoon-sungho','lee-jaehoon','lim-junho'])expect(ACTOR_RIGS[`${name}-map.webp`]).toBeDefined();
  expect(ACTOR_RIGS['safety-monitor-v2.webp']).toBeDefined();expect(ACTOR_RIGS['worker-korean-v2.webp']).toBeDefined();
  for(const rig of Object.values(ACTOR_RIGS))for(const leg of [rig.left,rig.right])expect(leg.hip.y<leg.knee.y&&leg.knee.y<leg.ankle.y&&leg.ankle.y<leg.sole.y).toBe(true);
 });
 it('uses actual speed to switch walk/run and freezes tool gestures during pause',()=>{
  const tracker=new SpriteMotionTracker(),actor={};tracker.sample(actor,0,0,0);
  expect(tracker.sample(actor,5,0,.1).mode).toBe('walk');
  expect(tracker.sample(actor,25,0,.2).mode).toBe('run');
  tracker.act(actor,.3);const action=tracker.sample(actor,25,0,.3);
  expect(action.mode).toBe('action');expect(tracker.sample(actor,25,0,.3)).toEqual(action);
  expect(tracker.sample(actor,25,0,.6).mode).toBe('idle');
 });
 it('does not spin cart wheels at rest and keeps rolling distance across gait wraps',()=>{
  const tracker=new SpriteMotionTracker(),cart={};tracker.sample(cart,0,0,0);
  const pose=tracker.sample(cart,60,0,.5);expect(pose.travel).toBe(60);
  const stop=tracker.sample(cart,60,0,.6);expect(stop.travel).toBe(60);
  expect(tracker.sample(cart,65,0,.7).travel).toBe(65);
 });
});
