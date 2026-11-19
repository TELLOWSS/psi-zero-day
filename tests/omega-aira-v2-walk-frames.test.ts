import {afterEach,describe,it,expect,vi} from 'vitest';
import {
 OMEGA_AIRA_E_WALK_STUDY,OmegaAiraV2WalkFrames,
 omegaAiraWalkPaintedFrameAt,omegaAiraWalkPaintedSourceRect,
} from '../src/ui/omega-aira-v2-walk-frames';
import type {OmegaActorView} from '../src/ui/omega-protocol-actor-render';

afterEach(()=>vi.unstubAllGlobals());
const on=(phase:number,active=true):OmegaActorView=>({
 facingX:1,facingY:0,time:3,moving:active,dashing:false,shooting:false,
 gait:{active,phase,distanceTravelled:38*phase,
  left:{x:-9,y:0,planted:true},right:{x:9,y:0,planted:true}},
});
const canvas=()=>{
 const draws:unknown[][]=[];
 const ctx={drawImage:(...args:unknown[])=>draws.push(args)} as unknown as CanvasRenderingContext2D;
 return {ctx,draws};
};
describe('AIRA V2 E original four hand-illustrated distance-driven walk poses',()=>{
 it('uses four discrete original illustrated frames from native measured gait phase',()=>{
  expect([0,.124,.249,.25,.499,.5,.749,.75,.99,1].map(
   omegaAiraWalkPaintedFrameAt)).toEqual([0,0,0,1,1,2,2,3,3,0]);
  expect(omegaAiraWalkPaintedFrameAt(NaN)).toBe(0);
  expect(omegaAiraWalkPaintedFrameAt(-.01)).toBe(3);
  expect(OMEGA_AIRA_E_WALK_STUDY.count).toBe(4);
  expect(OMEGA_AIRA_E_WALK_STUDY.productionApproved).toBe(false);
 });
 it('keeps four distinct cropping positions, a common 227px sole pivot, and immutable geometry',()=>{
  const frames=([0,1,2,3] as const).map(k=>omegaAiraWalkPaintedSourceRect(k,136*1.22));
  expect(frames.map(f=>f.sx)).toEqual([0,240,480,720]);
  expect(frames.every(f=>f.sw===240&&f.sh===232&&f.sy===0)).toBe(true);
  expect(frames.every(f=>Math.abs(f.dy+f.dh*227/232)<1e-8)).toBe(true);
  expect(frames.every(f=>f.dx===-f.dw/2)).toBe(true);
  expect(()=>omegaAiraWalkPaintedSourceRect(0,0)).toThrow(RangeError);
  expect(()=>omegaAiraWalkPaintedSourceRect(2,NaN)).toThrow(RangeError);
 });
 it('loads one real committed atlas; draws only E while collision-corrected gait is active',()=>{
  const requests:string[]=[];
  class Decoded{
   complete=true;naturalWidth=960;naturalHeight=232;decoding='';
   onload:(()=>void)|null=null;onerror:(()=>void)|null=null;
   private value='';
   set src(v:string){this.value=v;requests.push(v);}
   get src(){return this.value;}
  }
  vi.stubGlobal('Image',Decoded);
  const frames=new OmegaAiraV2WalkFrames();
  expect(frames.ready).toBe(false);
  frames.prepare();frames.prepare();expect(frames.ready).toBe(true);
  expect(requests).toEqual([OMEGA_AIRA_E_WALK_STUDY.path]);
  const {ctx,draws}=canvas();
  for(const [p,idx] of [[.05,0],[.35,1],[.60,2],[.89,3]] as const){
   expect(frames.draw(ctx,'E',on(p),136*1.22)).toBe(true);
   expect(draws.at(-1)?.slice(1)).toEqual(
    Object.values(omegaAiraWalkPaintedSourceRect(idx,136*1.22)));
  }
  expect(draws).toHaveLength(4);
  // There are ZERO painted frames for other headings; do not flip E art.
  for(const h of ['SE','S','SW','W','NW','N','NE'] as const)
   expect(frames.draw(ctx,h,on(.5),136)).toBe(false);
  expect(frames.draw(ctx,'E',on(.5,false),136)).toBe(false);
  expect(frames.draw(ctx,'E',{...on(.5),gait:undefined},136)).toBe(false);
  for(const flags of [{shooting:true},{dashing:true},{hurt:true},
    {ultimate:true},{finished:true}]){
   expect(frames.draw(ctx,'E',{...on(.3),...flags},136)).toBe(false);
  }
  expect(frames.draw(ctx,'E',on(NaN),136)).toBe(false);
  expect(draws).toHaveLength(4);
 });
 it('fails closed on broken Atlas instead of showing a corrupted player silhouette',()=>{
  class Invalid{
   complete=true;naturalWidth=4;naturalHeight=2;decoding='';
   onload:(()=>void)|null=null;onerror:(()=>void)|null=null;src='';
  }
  vi.stubGlobal('Image',Invalid);
  const frames=new OmegaAiraV2WalkFrames();frames.prepare();
  const {ctx,draws}=canvas();
  expect(frames.ready).toBe(false);
  expect(frames.draw(ctx,'E',on(.25),136)).toBe(false);
  expect(draws).toHaveLength(0);
 });
});
