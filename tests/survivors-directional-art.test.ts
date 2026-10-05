import {it,expect} from 'vitest';
import {movementDirection,directionalFrame} from '../src/ui/survivors-directional-art';
import {SpriteMotionTracker} from '../src/ui/survivors-sprite-motion';
it('selects eight actual travel directions and retains facing on stop/noisy input',()=>{
 for(let direction=0;direction<8;direction++){const angle=direction*Math.PI/4;expect(movementDirection(Math.cos(angle),Math.sin(angle),2)).toBe(direction);}
 expect(movementDirection(0,0,7)).toBe(7);expect(movementDirection(NaN,1,4)).toBe(4);
 expect(movementDirection(Math.cos(.4),Math.sin(.4),0)).toBe(0);expect(movementDirection(Math.cos(.5),Math.sin(.5),0)).toBe(1);
});
it('uses authored eight-frame cycles without advancing on a stopped or paused actor',()=>{
 for(let frame=0;frame<8;frame++)expect(directionalFrame((frame+.2)/8*Math.PI*2,true)).toBe(frame);
 expect(directionalFrame(2,false)).toBe(0);expect(directionalFrame(NaN,true)).toBe(0);
 const tracker=new SpriteMotionTracker(),actor={};tracker.sample(actor,0,0,0);
 const moved=tracker.sample(actor,-10,-10,.1);expect(moved.direction).toBe(5);
 expect(tracker.sample(actor,-10,-10,.1)).toBe(moved);expect(tracker.sample(actor,-10,-10,.2).direction).toBe(5);
});
