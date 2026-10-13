import {describe,it,expect} from 'vitest';
import {FootContactTracker,turnToward,swingContactPoints} from '../src/ui/survivors-foot-lock';
import {contactFrameWeights} from '../src/ui/survivors-contact-art';
describe('authored foot contact and turning',()=>{
 it('lands at the exact authored contacts and raises only the swinging boot',()=>{
  const keys=[[{x:8,y:0},{x:-8,y:0}],[{x:0,y:0},{x:0,y:0}],[{x:-8,y:0},{x:8,y:0}],[{x:0,y:0},{x:0,y:0}]];
  expect(swingContactPoints(0,keys,74)).toEqual(keys[0]);expect(swingContactPoints(Math.PI,keys,74)).toEqual(keys[2]);
  const passing=swingContactPoints(Math.PI/2,keys,74);expect(passing[0]!.y).toBe(0);expect(passing[1]!.y).toBeLessThan(-4);
  const opposite=swingContactPoints(Math.PI*1.5,keys,74);expect(opposite[0]!.y).toBeLessThan(-4);expect(opposite[1]!.y).toBe(0);
 });
 it('keeps passing and contact transitions continuous across every key and the cycle seam',()=>{
  const keys=[[{x:8,y:0},{x:-8,y:0}],[{x:0,y:-1},{x:0,y:1}],[{x:-8,y:0},{x:8,y:0}],[{x:0,y:1},{x:0,y:-1}]];
  for(const cycle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){const before=swingContactPoints(cycle-1e-7,keys,74),after=swingContactPoints(cycle+1e-7,keys,74);for(let i=0;i<2;i++)expect(Math.hypot(before[i]!.x-after[i]!.x,before[i]!.y-after[i]!.y)).toBeLessThan(1e-5);}
 });
 it('holds a planted foot in world space while the body travels and the other foot swings',()=>{
  const tracker=new FootContactTracker(),entity={},source=[{x:9,y:-1},{x:-7,y:-3}];
  tracker.sample(entity,100,40,0,source,[true,false]);
  for(let i=1;i<=8;i++){
   const current=tracker.sample(entity,100+i*2,40+i,.01*i,[{x:9-i,y:-1+i*.2},{x:-7+i,y:-5}],[true,false]);
   expect(current[0]!.x+100+i*2).toBe(109);expect(current[0]!.y+40+i).toBe(39);
   expect(current[1]!.x).toBe(-7+i);
  }
  expect(source).toEqual([{x:9,y:-1},{x:-7,y:-3}]);
 });
 it('releases contacts on the swing phase, pauses without drift, and resets after discontinuities',()=>{
  const t=new FootContactTracker(),e={},feet=[{x:3,y:0},{x:-3,y:-1}];
  t.sample(e,0,0,0,feet,[true,true]);
  const moved=t.sample(e,5,0,.1,feet,[false,true]);expect(moved[0]!.x).toBe(3);expect(moved[1]!.x).toBe(-8);
  expect(t.sample(e,5,0,.1,[{x:99,y:99},{x:99,y:99}],[true,true])).toEqual(moved);
  expect(t.sample(e,100,0,.2,feet,[true,true])).toEqual(feet);
  expect(t.sample(e,101,0,0,feet,[true,true])).toEqual(feet);
  expect(t.sample(e,102,0,1,feet,[true,true])).toEqual(feet);
 });
 it('cannot stretch a foot beyond physical reach and isolates actors',()=>{
  const t=new FootContactTracker(),a={},b={},feet=[{x:0,y:0},{x:0,y:0}];
  t.sample(a,0,0,0,feet,[true,true]);
  expect(t.sample(a,40,0,.1,feet,[true,true],20)).toEqual(feet);
  expect(t.sample(b,12,4,.1,feet,[true,true])).toEqual(feet);
 });
 it('turns at the same rate at 30, 60 and 120 Hz and crosses the angle seam by the short route',()=>{
  for(const hz of [30,60,120]){let angle=0;for(let i=0;i<hz/8;i++)angle=turnToward(angle,Math.PI/2,1/hz);expect(angle).toBeCloseTo(Math.PI/2,8);}
  expect(turnToward(Math.PI-.05,-Math.PI+.05,.01)).toBeCloseTo(Math.PI+.05,8);
  expect(turnToward(0,Math.PI,0)).toBe(0);
 });
 it('uses all eight stop views and eight turn bridges with normalized safe frame weights',()=>{
  const stops=new Set<number>(),bridges=new Set<number>();
  for(let i=0;i<16;i++){const weights=contactFrameWeights(0,0,true,i*Math.PI/8);expect(weights.reduce((a,b)=>a+b.weight,0)).toBeCloseTo(1,12);const frame=weights[0]!;(i%2?bridges:stops).add(frame.direction);expect(frame.frame).toBe(i%2);}
  expect(stops.size).toBe(8);expect(bridges.size).toBe(8);
  for(let i=0;i<200;i++){const weights=contactFrameWeights(i*.1,.7,true,i*.2);expect(weights.reduce((a,b)=>a+b.weight,0)).toBeCloseTo(1,12);for(const w of weights){expect(w.direction).toBeGreaterThanOrEqual(0);expect(w.direction).toBeLessThan(8);expect(w.frame).toBeGreaterThanOrEqual(0);expect(w.frame).toBeLessThan(6);}}
  expect(contactFrameWeights(NaN,NaN,true,NaN)).toEqual([{direction:0,frame:0,weight:1}]);
 });
});
