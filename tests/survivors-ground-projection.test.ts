import {describe,expect,it} from 'vitest';
import {groundFacingAngle} from '../src/ui/survivors-ground-projection';

describe('ground-facing projection',()=>{
 it('keeps all eight displayed axes aligned with movement after vertical compression',()=>{
  for(let i=0;i<8;i++){
   const angle=i*Math.PI/4,projected=groundFacingAngle(angle,.58);
   const x=Math.cos(projected),y=Math.sin(projected)*.58,length=Math.hypot(x,y);
   expect(x/length).toBeCloseTo(Math.cos(angle),10);
   expect(y/length).toBeCloseTo(Math.sin(angle),10);
  }
 });
 it('preserves an uncompressed plane and rejects invalid transforms',()=>{
  expect(groundFacingAngle(.7,1)).toBeCloseTo(.7);
  expect(groundFacingAngle(NaN,.58)).toBe(0);
  expect(groundFacingAngle(.7,0)).toBe(0);
  expect(groundFacingAngle(.7,-1)).toBe(0);
 });
});
