import {expect,it} from 'vitest';
import {cachedGaitPhase,GAIT_PHASES} from '../src/ui/survivors-gait-phase';
import {SpriteMotionTracker} from '../src/ui/survivors-sprite-motion';
it('retains 32 distinct leg poses in a wrapped cycle including intermediate half steps',()=>{
 const phases=Array.from({length:GAIT_PHASES},(_,i)=>cachedGaitPhase((i+.25)/GAIT_PHASES*Math.PI*2));
 expect(new Set(phases).size).toBe(32);expect(phases[1]).toBe(.5);
 expect(cachedGaitPhase(Math.PI*2)).toBe(0);
 expect(cachedGaitPhase(-Math.PI/2)).toBe(12);expect(cachedGaitPhase(NaN)).toBe(0);
});
it('eases torso lean after stopping and remains deterministic during pause',()=>{
 const tracker=new SpriteMotionTracker(),actor={};tracker.sample(actor,0,0,0);
 const moving=tracker.sample(actor,10,0,.1);
 const stopped=tracker.sample(actor,10,0,.116);
 expect(stopped.lean).toBeGreaterThan(0);expect(stopped.lean).toBeLessThan(moving.lean);
 expect(tracker.sample(actor,10,0,.116)).toEqual(stopped);
 expect(tracker.sample(actor,10,0,1).lean).toBeLessThan(.0001);
});
it('produces equivalent lean response at 30, 60 and 120 render samples',()=>{
 const values=[30,60,120].map(rate=>{
  const tracker=new SpriteMotionTracker(),actor={};tracker.sample(actor,0,0,0);
  let lean=0;for(let i=1;i<=rate;i++)lean=tracker.sample(actor,100*i/rate,0,i/rate).lean;
  return lean;
 });
 expect(values[0]).toBeCloseTo(values[1]!,8);expect(values[1]).toBeCloseTo(values[2]!,8);
});
