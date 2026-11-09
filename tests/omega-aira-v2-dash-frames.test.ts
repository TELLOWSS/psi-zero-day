import {afterEach,describe,expect,it,vi} from 'vitest';
import type {OmegaActorView} from '../src/ui/omega-protocol-actor-render';
import {
 OMEGA_AIRA_E_DASH_STUDY,OMEGA_AIRA_E_DASH_DURATION,
 OmegaAiraV2DashFrames,omegaAiraDashKeyframeAt,omegaAiraDashSourceRect,
} from '../src/ui/omega-aira-v2-dash-frames';

afterEach(()=>vi.unstubAllGlobals());
const dash:OmegaActorView={
 facingX:1,facingY:0,moving:true,time:5,
 dashing:true,shooting:false,actionAge:.08,
};
const mockCanvas=()=>{
 const calls:unknown[][]=[];
 const ctx={drawImage:(...args:unknown[])=>{calls.push(args);}} as unknown as CanvasRenderingContext2D;
 return {ctx,calls};
};
describe('AIRA V2 E original 3-action dash key poses',()=>{
 it('indexes launch, aerial and crouched recovery from the real native Watch dash timer',()=>{
  expect([0,.03,.064,.065,.08,.149,.15,.2].map(omegaAiraDashKeyframeAt))
   .toEqual([0,0,0,1,1,1,2,2]);
  expect(omegaAiraDashKeyframeAt(-1)).toBe(0);
  expect(omegaAiraDashKeyframeAt(Infinity)).toBe(0);
  expect(OMEGA_AIRA_E_DASH_DURATION).toBeCloseTo(.22);
  expect(OMEGA_AIRA_E_DASH_STUDY.columns).toBe(3);
  expect(OMEGA_AIRA_E_DASH_STUDY.atlasWidth).toBe(
   OMEGA_AIRA_E_DASH_STUDY.columns*OMEGA_AIRA_E_DASH_STUDY.cellWidth);
  expect(OMEGA_AIRA_E_DASH_STUDY.webpSha256).toMatch(/^[a-f0-9]{64}$/);
  expect(OMEGA_AIRA_E_DASH_STUDY.svgSha256).toMatch(/^[a-f0-9]{64}$/);
 });
 it('holds original boot pivot and three unique source cropping positions',()=>{
  const rects=([0,1,2] as const).map(frame=>omegaAiraDashSourceRect(frame,136*1.43));
  expect(rects.map(x=>x.sx)).toEqual([0,280,560]);
  expect(rects.every(x=>x.sy===0&&x.sw===280&&x.sh===220)).toBe(true);
  expect(rects.every(x=>Math.abs(x.dy+x.dh*(210/220))<1e-9)).toBe(true);
  expect(rects.every(x=>x.dx===-x.dw/2)).toBe(true);
  expect(()=>omegaAiraDashSourceRect(0,0)).toThrow(RangeError);
  expect(()=>omegaAiraDashSourceRect(2,NaN)).toThrow(RangeError);
 });
 it('loads the one exact committed local atlas, without fake full-pack approval',()=>{
  const urls:string[]=[];
  class ReadyAtlas{
   complete=true;naturalWidth=840;naturalHeight=220;decoding='';
   onload:(()=>void)|null=null;onerror:(()=>void)|null=null;
   private path='';
   set src(next:string){this.path=next;urls.push(next);}
   get src(){return this.path;}
  }
  vi.stubGlobal('Image',ReadyAtlas);
  const rig=new OmegaAiraV2DashFrames();
  expect(rig.ready).toBe(false);
  rig.prepare();rig.prepare();
  expect(rig.ready).toBe(true);
  expect(urls).toEqual([OMEGA_AIRA_E_DASH_STUDY.path]);
  expect(OMEGA_AIRA_E_DASH_STUDY.binaryPresent).toBe(true);
  expect(OMEGA_AIRA_E_DASH_STUDY.productionApproved).toBe(false);
  const {ctx,calls}=mockCanvas();
  for(const [age,sx] of [[0,0],[.09,280],[.18,560]] as const){
   expect(rig.draw(ctx,'E',{...dash,actionAge:age},136*1.43)).toBe(true);
   expect(calls.at(-1)?.slice(1)).toEqual(
    Object.values(omegaAiraDashSourceRect((sx/280) as 0|1|2,136*1.43)));
  }
  expect(calls).toHaveLength(3);
  for(const heading of ['SE','S','SW','W','NW','N','NE'] as const)
   expect(rig.draw(ctx,heading,dash,136)).toBe(false);
  for(const patch of [
   {dashing:false},{hurt:true},{ultimate:true},{finished:true},
   {actionAge:.23},{actionAge:-1},{actionAge:NaN},
  ]){
   expect(rig.draw(ctx,'E',{...dash,...patch},136)).toBe(false);
  }
  expect(calls).toHaveLength(3);
 });
 it('fails closed if the real SVG fails to decode or has unexpected dimensions',()=>{
  class WrongAtlas{
   complete=true;naturalWidth=280;naturalHeight=220;decoding='';
   onload:(()=>void)|null=null;onerror:(()=>void)|null=null;src='';
  }
  vi.stubGlobal('Image',WrongAtlas);
  const rig=new OmegaAiraV2DashFrames();
  rig.prepare();expect(rig.ready).toBe(false);
  const {ctx,calls}=mockCanvas();
  expect(rig.draw(ctx,'E',dash,136)).toBe(false);
  expect(calls).toEqual([]);
 });
});
