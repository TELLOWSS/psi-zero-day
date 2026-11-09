import {afterEach,describe,expect,it,vi} from 'vitest';
import type {OmegaActorView} from '../src/ui/omega-protocol-actor-render';
import {
 OMEGA_AIRA_E_DASH_STUDY,OMEGA_AIRA_E_DASH_DURATION,
 OmegaAiraV2DashFrames,omegaAiraDashKeyframeAt,
} from '../src/ui/omega-aira-v2-dash-frames';

afterEach(()=>vi.unstubAllGlobals());
const dash:OmegaActorView={
 facingX:1,facingY:0,moving:true,time:5,
 dashing:true,shooting:false,actionAge:.08,
};
describe('AIRA V2 E 3-illustration dash ingest gate',()=>{
 it('uses launch, midair and recovery poses at native Watch dash age',()=>{
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
 it('never fetches draft source artwork that is not yet committed',()=>{
  let created=0;
  class FakeImage{constructor(){created++;}}
  vi.stubGlobal('Image',FakeImage);
  const images=new OmegaAiraV2DashFrames();
  images.prepare();images.prepare();
  expect(images.ready).toBe(false);
  expect(created).toBe(0);
  expect(OMEGA_AIRA_E_DASH_STUDY.binaryPresent).toBe(false);
  expect(OMEGA_AIRA_E_DASH_STUDY.productionApproved).toBe(false);
 });
 it('will not draw fabricated mirrored poses or replace native combat without source approval',()=>{
  const rig=new OmegaAiraV2DashFrames();
  const calls:unknown[][]=[];
  const ctx={drawImage:(...args:unknown[])=>calls.push(args)} as unknown as CanvasRenderingContext2D;
  for(const heading of ['E','SE','S','SW','W','NW','N','NE'] as const)
   expect(rig.draw(ctx,heading,dash,136)).toBe(false);
  for(const partial of [
   {dashing:false},{hurt:true},{ultimate:true},{finished:true},
   {actionAge:.23},{actionAge:-1},{actionAge:NaN},
  ])
   expect(rig.draw(ctx,'E',{...dash,...partial},136)).toBe(false);
  expect(rig.draw(ctx,'E',dash,0)).toBe(false);
  expect(calls).toHaveLength(0);
 });
});
