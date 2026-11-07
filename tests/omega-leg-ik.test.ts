import {describe,it,expect} from 'vitest';
import {omegaFootCycle,omegaWrapCycle,omegaSolveLeg,omegaTwoFootGuides} from '../src/ui/omega-leg-ik';

describe('OMEGA skeletal production helper — numerical 2-bone IK only',()=>{
 it('wraps time without discontinuity at cycle boundaries',()=>{
  expect(omegaWrapCycle(1)).toBe(0);
  expect(omegaWrapCycle(-1)).toBe(0);
  expect(omegaWrapCycle(-.5)).toBe(.5);
  expect(omegaWrapCycle(Number.NaN)).toBe(0);
  const start=omegaFootCycle(0,'left',30,12);
  const finish=omegaFootCycle(.999999,'left',30,12);
  expect(start.x).toBeCloseTo(finish.x,3);
  expect(start.lift).toBeCloseTo(0,3);
  expect(finish.lift).toBeGreaterThanOrEqual(0);
 });
 it('makes opposing contact/swing phases without inventing planted-world IK',()=>{
  for(let i=0;i<100;i++){
   const t=i/100;
   const a=omegaFootCycle(t,'left',32,11);
   const b=omegaFootCycle(t,'right',32,11);
   expect(a.planted||b.planted).toBe(true);
   for(const foot of [a,b]){
    expect(Number.isFinite(foot.x)).toBe(true);
    expect(foot.lift).toBeGreaterThanOrEqual(0);
    if(foot.planted)expect(foot.lift).toBe(0);
    else expect(foot.lift).toBeLessThanOrEqual(11);
   }
  }
  expect(omegaFootCycle(.8,'left',32,11).planted).toBe(false);
  expect(omegaFootCycle(.8,'left',32,11).lift).toBeGreaterThan(10);
  expect(omegaFootCycle(.8,'right',32,11).planted).toBe(true);
 });
 it('returns finite knee/ankle targets preserving both limb lengths',()=>{
  for(const bend of [-1,1] as const)for(let x=-35;x<=35;x+=7){
   const hip={x:0,y:0},target={x,y:65};
   const rig=omegaSolveLeg(hip,target,36,36,bend);
   expect(rig).not.toBeNull();
   if(!rig)continue;
   const upper=Math.hypot(rig.knee.x-hip.x,rig.knee.y-hip.y);
   const lower=Math.hypot(rig.knee.x-rig.ankle.x,rig.knee.y-rig.ankle.y);
   expect(upper).toBeCloseTo(36,3);
   expect(lower).toBeCloseTo(36,3);
  }
 });
 it('clamps unreachable and degenerate targets without NaNs or unbounded coordinates',()=>{
  const far=omegaSolveLeg({x:0,y:0},{x:500,y:200},40,38)!;
  expect(far.adjustedForReach).toBe(true);
  expect(Math.hypot(far.ankle.x,far.ankle.y)).toBeLessThan(78);
  const same=omegaSolveLeg({x:0,y:0},{x:0,y:0},40,40)!;
  expect(same.adjustedForReach).toBe(true);
  expect(Number.isFinite(same.knee.x)).toBe(true);
  expect(omegaSolveLeg({x:0,y:0},{x:Number.NaN,y:3},30,20)).toBeNull();
  expect(omegaSolveLeg({x:0,y:0},{x:3,y:3},-1,20)).toBeNull();
 });
 it('provides two separate leg guides but no claim of sprite compositing',()=>{
  const pose=omegaTwoFootGuides(.2,63,30,12,38,36);
  expect(pose.left).not.toBeNull();
  expect(pose.right).not.toBeNull();
  expect(pose.leftFoot.phase).toBeCloseTo(.2);
  expect(pose.rightFoot.phase).toBeCloseTo(.7);
 });
});
