import {it,expect} from 'vitest';
import {authoredBootSoles} from '../src/ui/survivors-authored-joints';
it('finds an airborne sole above the floor instead of inventing a floor contact',()=>{
 const width=40,height=100,pixels=new Uint8ClampedArray(width*height*4);
 const paint=(x:number,y:number,r:number,g:number,b:number)=>{const i=(y*width+x)*4;pixels.set([r,g,b,255],i);};
 for(let x=5;x<12;x++)for(let y=70;y<77;y++)paint(x,y,35,36,37);
 for(let x=26;x<33;x++)for(let y=91;y<99;y++)paint(x,y,35,36,37);
 // Navy trousers extend below the airborne boot in the opposite half of its crop.
 for(let y=77;y<96;y++)paint(17,y,20,30,55);
 const feet=authoredBootSoles(pixels,width,height,20,false);
 expect(feet[0]!.y).toBe(76);expect(feet[1]!.y).toBe(98);
 expect(feet[0]!.x).toBe(8);expect(feet[1]!.x).toBe(29);
});
