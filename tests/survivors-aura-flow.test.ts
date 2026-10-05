import {expect,it} from 'vitest';
import {auraFlow} from '../src/ui/survivors-aura-flow';
it('uses continuous simulation time, mirrored flow and bounded material opacity',()=>{
 for(let i=0;i<3;i++)for(let t=0;t<10;t+=.016){
  const a=auraFlow(t,i,1,0),b=auraFlow(t+.001,i,1,0),mirror=auraFlow(t,i,-1,0);
  expect(a.alpha).toBeGreaterThanOrEqual(0);expect(a.alpha).toBeLessThanOrEqual(.24);
  expect(Math.abs(a.alpha-b.alpha)).toBeLessThan(.002);
  expect(mirror.x).toBe(-a.x);expect(mirror.rotation).toBe(-a.rotation);
  expect(auraFlow(t,i,1,0)).toEqual(a);
 }
});
it('fades recycled wisps to zero and isolates attack response',()=>{
 expect(auraFlow(0,0,1,0).alpha).toBe(0);
 expect(auraFlow(.4,0,1,1).width).toBeGreaterThan(auraFlow(.4,0,1,0).width);
 expect(auraFlow(NaN,0,1,0)).toEqual(auraFlow(0,0,1,0));
});
