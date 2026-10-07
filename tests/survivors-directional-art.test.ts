import {it,expect} from 'vitest';
import {movementDirection,directionalFrame,directionalFrameWeights} from '../src/ui/survivors-directional-art';
import {SpriteMotionTracker} from '../src/ui/survivors-sprite-motion';
it('selects eight actual travel directions and retains facing on stop/noisy input',()=>{
 for(let direction=0;direction<8;direction++){const angle=direction*Math.PI/4;expect(movementDirection(Math.cos(angle),Math.sin(angle),2)).toBe(direction);}
 expect(movementDirection(0,0,7)).toBe(7);expect(movementDirection(NaN,1,4)).toBe(4);
 expect(movementDirection(Math.cos(.4),Math.sin(.4),0)).toBe(0);expect(movementDirection(Math.cos(.5),Math.sin(.5),0)).toBe(1);
});
it('interpolates authored phases and settles to contact without alpha loss or state changes',()=>{
 for(const cycle of [-9,0,.13,1,3,6.27,9,NaN])for(const gait of [0,.25,.5,.75,1]){
  const weights=directionalFrameWeights(cycle,true,gait);
  expect(weights.reduce((sum,w)=>sum+w.weight,0)).toBeCloseTo(1,12);
  expect(weights.every(w=>w.frame>=0&&w.frame<10&&w.weight>0)).toBe(true);
 }
 expect(directionalFrameWeights(2,false,0)).toEqual([{frame:4,weight:1}]);
 expect(directionalFrameWeights(Math.PI/8,true,1)).toEqual([{frame:0,weight:1}]);
 const middle=directionalFrameWeights(.91/8*Math.PI*2,true,1);
 expect(middle.map(w=>w.frame)).toEqual([0,1]);for(const w of middle)expect(w.weight).toBeCloseTo(.5,12);
 const tracker=new SpriteMotionTracker(),actor={};tracker.sample(actor,0,0,0);
 const moved=tracker.sample(actor,10,0,.1),stopped=tracker.sample(actor,10,0,.12);
 expect(stopped.moving).toBe(false);expect(stopped.gaitBlend).toBeGreaterThan(0);
 expect(stopped.authoredCycle).toBe(moved.authoredCycle);
 expect(tracker.sample(actor,10,0,.12)).toBe(stopped);
 expect(tracker.sample(actor,10,0,.3).gaitBlend).toBe(0);
});
it('renders each authored passing pose between strides and keeps contact poses on stopping',()=>{
 for(const [phase,frame] of [[1.65,8],[5.65,9]] as const){
  expect(directionalFrameWeights(phase/8*Math.PI*2,true,1)).toEqual([{frame,weight:1}]);
  expect(directionalFrameWeights(phase/8*Math.PI*2,false,0).every(w=>w.frame===0||w.frame===4)).toBe(true);
 }
 const transition=directionalFrameWeights(1.455/8*Math.PI*2,true,1);
 expect(transition.map(w=>w.frame)).toEqual([1,8]);
 for(const sample of transition)expect(sample.weight).toBeCloseTo(.5,12);
 for(let phase=0;phase<8;phase+=.013){
  const weights=directionalFrameWeights(phase/8*Math.PI*2,true,1);
  expect(weights.length).toBeLessThanOrEqual(2);
  expect(weights.reduce((sum,w)=>sum+w.weight,0)).toBeCloseTo(1,12);
 }
});
it('uses authored eight-frame cycles without advancing on a stopped or paused actor',()=>{
 for(let frame=0;frame<8;frame++)expect(directionalFrame((frame+.2)/8*Math.PI*2,true)).toBe(frame);
 expect(directionalFrame(2,false)).toBe(4);expect(directionalFrame(NaN,true)).toBe(0);
 const tracker=new SpriteMotionTracker(),actor={};tracker.sample(actor,0,0,0);
 const moved=tracker.sample(actor,-10,-10,.1);expect(moved.direction).toBe(5);
 expect(tracker.sample(actor,-10,-10,.1)).toBe(moved);expect(tracker.sample(actor,-10,-10,.2).direction).toBe(5);
});
