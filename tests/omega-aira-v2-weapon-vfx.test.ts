import {describe,it,expect} from 'vitest';
import {omegaAiraV2ShotFrame,drawOmegaAiraV2ShotVfx} from '../src/ui/omega-aira-v2-weapon-vfx';
import type {OmegaActorView} from '../src/ui/omega-protocol-actor-render';
const make=(override:Partial<OmegaActorView>={}):OmegaActorView=>({
 facingX:-1,facingY:0,weaponFacingX:1,weaponFacingY:0,
 shooting:true,moving:false,dashing:false,time:4.2,actionAge:.025,
 ...override,
});
function mockCanvas(){
 const events:Array<{op:string;args:unknown[]}>= [];
 const gradient={addColorStop:(...args:unknown[])=>{events.push({op:'stop',args});}};
 const ctx=new Proxy({},{
  get(_target,key){
   if(key==='createRadialGradient'||key==='createLinearGradient')
    return (...args:unknown[])=>{events.push({op:String(key),args});return gradient;};
   return (...args:unknown[])=>{events.push({op:String(key),args});};
  },
  set(){return true;},
 }) as unknown as CanvasRenderingContext2D;
 return {ctx,events};
}
describe('AIRA V2 artist-identity-preserving native tactical sidearm overlay',()=>{
 it('keeps muzzle tied to actual fired vector even while body faces west',()=>{
  const v=make(),p=omegaAiraV2ShotFrame(v,'W',136);
  expect(p.drawn).toBe(true);
  expect(p.directionRadians).toBe(0);
  const {ctx,events}=mockCanvas();drawOmegaAiraV2ShotVfx(ctx,v,'W',136);
  const rotations=events.filter(e=>e.op==='rotate');
  expect(rotations).toHaveLength(1);expect(rotations[0]?.args).toEqual([0]);
  expect(events.filter(e=>e.op==='createRadialGradient')).toHaveLength(1);
  expect(events.filter(e=>e.op==='fillRect').length).toBeGreaterThan(2);
 });
 it('renders neither a false muzzle flash nor a painted gun from expired or non-firing events',()=>{
  const samples=[
   make({shooting:false}),make({hurt:true}),make({dashing:true}),
   make({finished:true}),make({weaponFacingX:0,weaponFacingY:0,
    facingX:0,facingY:0}),
   make({actionAge:.16}),make({actionAge:Infinity}),make({time:2,shooting:false}),
  ];
  for(const view of samples){
   expect(omegaAiraV2ShotFrame(view,'S',126).drawn).toBe(false);
   const {ctx,events}=mockCanvas();
   drawOmegaAiraV2ShotVfx(ctx,view,'S',126);expect(events).toEqual([]);
  }
 });
 it('has bounded recoil and a true distinct shooter angle at all 8 headings',()=>{
  for(const [heading,x,y] of [
   ['E',1,0],['SE',1,1],['S',0,1],['SW',-1,1],
   ['W',-1,0],['NW',-1,-1],['N',0,-1],['NE',1,-1],
  ] as const){
   const frame=omegaAiraV2ShotFrame(make({weaponFacingX:x,weaponFacingY:y}),heading,136);
   expect(frame.drawn).toBe(true);
   expect(frame.directionRadians).toBeCloseTo(Math.atan2(y,x),9);
   expect(frame.gripY).toBeLessThan(-65);
   expect(frame.gripX).toBeGreaterThan(-35);
   expect(frame.gripX).toBeLessThan(35);
   expect(frame.intensity).toBeGreaterThan(0);
   expect(frame.intensity).toBeLessThanOrEqual(1);
  }
 });
});
