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
 it('does not fetch missing binary or claim that a 3-key E pose is 160 approved assets',()=>{
  let imagesCreated=0;
  class FakeImage{constructor(){imagesCreated++}}
  vi.stubGlobal('Image',FakeImage);
  const frames=new OmegaAiraV2FireFrames();
  frames.prepare();
  expect(frames.ready).toBe(false);
  expect(imagesCreated).toBe(0);
  expect(OMEGA_AIRA_E_FIRE_STUDY.binaryPresent).toBe(false);
  expect(OMEGA_AIRA_E_FIRE_STUDY.productionApproved).toBe(false);
  expect(OMEGA_AIRA_E_FIRE_STUDY.sha256).toMatch(/^[a-f0-9]{64}$/);
 });
 it('keeps native shot renderer fail-closed until real binary and QA arrive',()=>{
  const frames=new OmegaAiraV2FireFrames();
  const recorded:string[]=[];
  const ctx=new Proxy({},{
   get(_t,k){return (..._args:unknown[])=>{recorded.push(String(k));}},
   set(){return true;},
  }) as unknown as CanvasRenderingContext2D;
  for(const heading of ['E','SE','S','SW','W','NW','N','NE'] as const){
   expect(frames.draw(ctx,heading,actor,136)).toBe(false);
  }
  expect(frames.draw(ctx,'E',{...actor,shooting:false},136)).toBe(false);
  expect(frames.draw(ctx,'E',{...actor,actionAge:.2},136)).toBe(false);
  expect(recorded).toEqual([]);
 });
});
