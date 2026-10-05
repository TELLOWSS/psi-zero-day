import {it,expect} from 'vitest';
import {fittingPose} from '../src/ui/survivors-fitting-pose';
it('uses an isolated clock for bounded walk and repeatable firing poses',()=>{
 const walk=fittingPose(.5,'walk',-1,false);
 expect(walk.moving).toBe(true);expect(walk.facing).toBe(-1);expect(walk.speed).toBe(120);expect(Math.abs(walk.lean)).toBeLessThan(.035);
 expect(fittingPose(0,'action',1,false).action).toBe(1);
 expect(fittingPose(.3,'action',1,false).action).toBe(0);
 expect(fittingPose(1.4,'action',1,false).action).toBe(1);
 expect(fittingPose(.5,'walk',1,false)).toEqual(fittingPose(.5,'walk',1,false));
});
it.each(['idle','walk','action'] as const)('keeps %s stable in reduced motion without losing facing',motion=>{
 expect(fittingPose(0,motion,-1,true)).toEqual(fittingPose(10,motion,-1,true));
 expect(fittingPose(10,motion,-1,true).action).toBe(0);
});
it('rejects nonfinite or negative preview clocks without producing invalid transforms',()=>{
 expect(fittingPose(NaN,'walk',1,false)).toEqual(fittingPose(0,'walk',1,false));
 expect(fittingPose(-1,'action',1,false)).toEqual(fittingPose(0,'action',1,false));
});
