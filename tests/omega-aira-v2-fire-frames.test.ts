import {afterEach,describe,it,expect,vi} from 'vitest';
import {
 OMEGA_AIRA_E_FIRE_STUDY,OMEGA_AIRA_FIRE_STUDY_SHOT_SECONDS,
 OmegaAiraV2FireFrames,omegaAiraFireKeyframeAt,
} from '../src/ui/omega-aira-v2-fire-frames';
import type {OmegaActorView} from '../src/ui/omega-protocol-actor-render';

afterEach(()=>vi.unstubAllGlobals());
const actor:OmegaActorView={facingX:1,facingY:0,shooting:true,
 moving:false,dashing:false,time:1.2,actionAge:.07};

describe('AIRA V2 independent, original-source E firing pose ingest gate',()=>{
 it('indexes anticipation, discharge and recovery without looping a still frame',()=>{
  expect([.0,.015,.043,.045,.08,.104,.105,.15,.16].map(
   omegaAiraFireKeyframeAt)).toEqual([0,0,0,1,1,1,2,2,2]);
  expect(omegaAiraFireKeyframeAt(-2)).toBe(0);
  expect(omegaAiraFireKeyframeAt(Number.NaN)).toBe(0);
  expect(OMEGA_AIRA_FIRE_STUDY_SHOT_SECONDS).toBeGreaterThan(.15);
  expect(OMEGA_AIRA_E_FIRE_STUDY.columns).toBe(3);
  expect(OMEGA_AIRA_E_FIRE_STUDY.expectedAtlasWidth).toBe(
   OMEGA_AIRA_E_FIRE_STUDY.columns*OMEGA_AIRA_E_FIRE_STUDY.sourceWidth);
 });
 it('loads one committed local asset, not 160 imaginary production sprites',()=>{
  const loaded:string[]=[];
  class ReadyAtlas{
   complete=true;naturalWidth=720;naturalHeight=240;
   decoding='';onload:(()=>void)|null=null;onerror:(()=>void)|null=null;
   private path='';
   set src(value:string){loaded.push(value);this.path=value;}
   get src(){return this.path;}
  }
  vi.stubGlobal('Image',ReadyAtlas);
  const frames=new OmegaAiraV2FireFrames();
  expect(frames.ready).toBe(false);
  frames.prepare();
  expect(frames.ready).toBe(true);
  expect(loaded).toEqual([OMEGA_AIRA_E_FIRE_STUDY.path]);
  frames.prepare();
  expect(loaded).toHaveLength(1);
  expect(OMEGA_AIRA_E_FIRE_STUDY.binaryPresent).toBe(true);
  expect(OMEGA_AIRA_E_FIRE_STUDY.productionApproved).toBe(false);
  expect(OMEGA_AIRA_E_FIRE_STUDY.path).toMatch(/\/e-fire-3key-atlas\.svg$/);
  expect(OMEGA_AIRA_E_FIRE_STUDY.sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(OMEGA_AIRA_E_FIRE_STUDY.svgSha256).toMatch(/^[a-f0-9]{64}$/);
  const calls:unknown[][]=[];
  const ctx={drawImage:(...args:unknown[])=>calls.push(args)} as unknown as CanvasRenderingContext2D;
  for(const [age,sx] of [[0,0],[.07,240],[.125,480]] as const){
   expect(frames.draw(ctx,'E',{...actor,actionAge:age},136)).toBe(true);
   expect(calls.at(-1)?.slice(1)).toEqual([sx,0,240,240,-68,-136,136,136]);
  }
  expect(calls).toHaveLength(3);
  for(const other of ['SE','S','SW','W','NW','N','NE'] as const)
   expect(frames.draw(ctx,other,actor,136)).toBe(false);
  expect(frames.draw(ctx,'E',{...actor,shooting:false},136)).toBe(false);
  expect(frames.draw(ctx,'E',{...actor,actionAge:.2},136)).toBe(false);
  expect(frames.draw(ctx,'E',{...actor,dashing:true},136)).toBe(false);
  expect(calls).toHaveLength(3);
 });
 it('fails closed on decode errors and wrong dimensions; never draws invalid art',()=>{
  class BrokenAtlas{
   complete=true;naturalWidth=240;naturalHeight=240;
   decoding='';onload:(()=>void)|null=null;onerror:(()=>void)|null=null;src='';
  }
  vi.stubGlobal('Image',BrokenAtlas);
  const frames=new OmegaAiraV2FireFrames();frames.prepare();
  expect(frames.ready).toBe(false);
  const calls:unknown[][]=[];
  const ctx={drawImage:(...args:unknown[])=>calls.push(args)} as unknown as CanvasRenderingContext2D;
  expect(frames.draw(ctx,'E',actor,136)).toBe(false);
  expect(calls).toEqual([]);
 });

});
