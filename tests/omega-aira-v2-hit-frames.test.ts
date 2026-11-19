import {afterEach,describe,expect,it,vi} from 'vitest';
import type {OmegaActorView} from '../src/ui/omega-protocol-actor-render';
import {
 OMEGA_AIRA_E_HIT_STUDY,OMEGA_AIRA_E_HIT_DURATION,
 OmegaAiraV2HitFrames,omegaAiraHitKeyframeAt,omegaAiraHitSourceRect,
} from '../src/ui/omega-aira-v2-hit-frames';

afterEach(()=>vi.unstubAllGlobals());
const hit:OmegaActorView={
 facingX:1,facingY:0,moving:false,time:5,
 dashing:false,shooting:false,hurt:true,actionAge:.08,
};
const mockCanvas=()=>{
 const calls:unknown[][]=[];
 const ctx={drawImage:(...args:unknown[])=>{calls.push(args);}} as unknown as CanvasRenderingContext2D;
 return {ctx,calls};
};
describe('User-selected AIRA V2 E independent original three-key HIT poses',()=>{
 it('indexes native hit age, not gameTime or fabricated recoil',()=>{
  expect([0,.03,.051,.052,.07,.107,.108,.15,.17].map(omegaAiraHitKeyframeAt))
   .toEqual([0,0,0,1,1,1,2,2,2]);
  expect(omegaAiraHitKeyframeAt(NaN)).toBe(0);
  expect(omegaAiraHitKeyframeAt(-1)).toBe(0);
  expect(OMEGA_AIRA_E_HIT_DURATION).toBeCloseTo(.18);
  expect(OMEGA_AIRA_E_HIT_STUDY.atlasWidth)
   .toBe(OMEGA_AIRA_E_HIT_STUDY.columns*OMEGA_AIRA_E_HIT_STUDY.cellWidth);
  expect(OMEGA_AIRA_E_HIT_STUDY.binaryPresent).toBe(true);
  expect(OMEGA_AIRA_E_HIT_STUDY.productionApproved).toBe(false);
 });
 it('keeps boot pivot stable across 3 different original source image crops',()=>{
  const rects=([0,1,2] as const).map(i=>omegaAiraHitSourceRect(i,163.2));
  expect(rects.map(r=>r.sx)).toEqual([0,260,520]);
  expect(rects.every(r=>r.sy===0&&r.sw===260&&r.sh===215)).toBe(true);
  expect(rects.every(r=>Math.abs(r.dy+r.dh*205/215)<1e-8)).toBe(true);
  expect(rects.every(r=>r.dx===-r.dw/2)).toBe(true);
  expect(()=>omegaAiraHitSourceRect(0,0)).toThrow(RangeError);
  expect(()=>omegaAiraHitSourceRect(2,NaN)).toThrow(RangeError);
 });
 it('renders only E direction with an actual native hurt cue, no mirroring or fake hit',()=>{
  const urls:string[]=[];
  class ReadyAtlas{
   complete=true;naturalWidth=780;naturalHeight=215;decoding='';
   onload:(()=>void)|null=null;onerror:(()=>void)|null=null;
   private p='';
   set src(v:string){this.p=v;urls.push(v);}
   get src(){return this.p;}
  }
  vi.stubGlobal('Image',ReadyAtlas);
  const loader=new OmegaAiraV2HitFrames();
  expect(loader.ready).toBe(false);
  loader.prepare();loader.prepare();
  expect(loader.ready).toBe(true);
  expect(urls).toEqual([OMEGA_AIRA_E_HIT_STUDY.path]);
  const {ctx,calls}=mockCanvas();
  for(const [age,frame] of [[0,0],[.075,1],[.15,2]] as const){
   expect(loader.draw(ctx,'E',{...hit,actionAge:age},163.2)).toBe(true);
   expect(calls.at(-1)?.slice(1)).toEqual(
    Object.values(omegaAiraHitSourceRect(frame,163.2)));
  }
  for(const heading of ['SE','S','SW','W','NW','N','NE'] as const)
   expect(loader.draw(ctx,heading,hit,163.2)).toBe(false);
  for(const patch of [
   {hurt:false},{finished:true},{ultimate:true},
   {actionAge:-1},{actionAge:NaN},{actionAge:Infinity},{actionAge:.2},
  ])expect(loader.draw(ctx,'E',{...hit,...patch},163.2)).toBe(false);
  expect(calls).toHaveLength(3);
 });
 it('fails closed if art cannot decode or dimensions mismatch',()=>{
  class BadSource{
   complete=true;naturalWidth=260;naturalHeight=215;decoding='';
   onload:(()=>void)|null=null;onerror:(()=>void)|null=null;src='';
  }
  vi.stubGlobal('Image',BadSource);
  const rig=new OmegaAiraV2HitFrames();rig.prepare();
  expect(rig.ready).toBe(false);
  const {ctx,calls}=mockCanvas();
  expect(rig.draw(ctx,'E',hit,163.2)).toBe(false);
  expect(calls).toEqual([]);
 });
});
