import {describe,it,expect} from 'vitest';
import {drawOmegaDirectionalGear,drawOmegaDirectionalHead,omegaDirectionProfile}
 from '../src/ui/omega-protocol-directional-identity';
import {OMEGA_DIRECTIONS} from '../src/ui/omega-protocol-actor-render';

const calls=()=>{
 const log:Array<{method:string;args:unknown[]}>= [];
 const ctx=new Proxy({},{
  get(_target,key){return (...args:unknown[])=>{
   log.push({method:String(key),args});
  };},
  set(){return true},
 }) as unknown as CanvasRenderingContext2D;
 return {ctx,log};
};
describe('AIRA direction-specific facial and gear landmarks',()=>{
 it('shows no front-facing eyes on back views, one goggle side-on, two in front',()=>{
  const profile=Object.fromEntries(OMEGA_DIRECTIONS.map(heading=>
   [heading,omegaDirectionProfile(heading)]));
  expect(profile.N?.eyeCount).toBe(0);
  expect(profile.NE?.eyeCount).toBe(0);
  expect(profile.NW?.eyeCount).toBe(0);
  expect(profile.W?.eyeCount).toBe(1);
  expect(profile.E?.eyeCount).toBe(1);
  expect(profile.S?.eyeCount).toBe(2);
  expect(profile.SE?.eyeCount).toBe(2);
  expect(profile.SW?.eyeCount).toBe(2);
  for(const heading of OMEGA_DIRECTIONS){
   const sample=calls();
   drawOmegaDirectionalHead(sample.ctx,heading,0);
   const lens=sample.log.filter(c=>c.method==='arc'&&
    [3.4,4,5].includes(c.args[2] as number)).length;
   expect(lens).toBe(profile[heading]!.eyeCount);
   expect(sample.log.filter(c=>c.method==='save')).toHaveLength(1);
   expect(sample.log.filter(c=>c.method==='restore')).toHaveLength(1);
  }
 });
 it('renders tactical rear pack and side shoulder independently of face',()=>{
  const rear=calls(),front=calls(),side=calls();
  drawOmegaDirectionalGear(rear.ctx,'N',1);
  drawOmegaDirectionalGear(front.ctx,'S',1);
  drawOmegaDirectionalGear(side.ctx,'E',1);
  expect(rear.log.filter(c=>c.method==='fillRect').length).toBeGreaterThan(
   front.log.filter(c=>c.method==='fillRect').length);
  expect(side.log.filter(c=>c.method==='lineTo').length).toBeGreaterThan(0);
 });
});
