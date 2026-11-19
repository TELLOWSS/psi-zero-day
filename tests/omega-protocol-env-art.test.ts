import {readFileSync} from 'node:fs';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {OMEGA_FIELD_HEIGHT,OMEGA_FIELD_WIDTH,omegaFieldPlan} from '../src/domain/omega-protocol-field';
import {omega3DBudget} from '../src/ui/omega-protocol-atmosphere-3d';
import {omegaQuarterViewCamera} from '../src/ui/omega-protocol-camera';
import {
 OMEGA_ENV_ART_ROOT,omegaEnvArtPaths,omegaPrepareEnvArt,
 drawOmegaPaintedVista,drawOmegaPaintedFloor,
} from '../src/ui/omega-protocol-env-art';

afterEach(()=>vi.unstubAllGlobals());

function mockCanvas(){
 const draws:unknown[][]= [];
 const ctx={
  save:()=>{},restore:()=>{},setTransform:()=>{},
  translate:()=>{},scale:()=>{},fillRect:()=>{},
  drawImage:(...args:unknown[])=>draws.push(args),
 } as unknown as CanvasRenderingContext2D;
 return {ctx,draws};
}

describe('Painterly 5-sector environment art WebP assets and renderer',()=>{
 it('ships all 10 valid RIFF/WEBP environment assets on disk',()=>{
  const paths=omegaEnvArtPaths();
  expect(paths).toHaveLength(10);
  expect(paths.every(p=>p.startsWith(OMEGA_ENV_ART_ROOT)&&p.endsWith('.webp'))).toBe(true);
  for(const url of paths){
   const buf=readFileSync('public'+url);
   expect(buf.length).toBeGreaterThan(4096);
   expect(buf.toString('ascii',0,4)).toBe('RIFF');
   expect(buf.toString('ascii',8,12)).toBe('WEBP');
  }
 });

 it('fails closed gracefully before decoded images are ready or in Node env',()=>{
  const plan=omegaFieldPlan(20261108,1);
  const camera=omegaQuarterViewCamera(plan.entry,1280,720,1.55);
  const budget=omega3DBudget(1280,720);
  const {ctx,draws}=mockCanvas();
  omegaPrepareEnvArt();
  expect(drawOmegaPaintedVista(ctx,plan,camera,1280,720,budget)).toBe(false);
  expect(drawOmegaPaintedFloor(ctx,plan)).toBe(false);
  expect(draws).toHaveLength(0);
 });

 it('tiles horizon vistas seamlessly and renders 1400x900 painted sector floors once decoded',()=>{
  class ReadyImage{
   complete=true;naturalWidth=1344;naturalHeight=768;decoding='';
   src='';
  }
  vi.stubGlobal('Image',ReadyImage);
  omegaPrepareEnvArt();
  const budget=omega3DBudget(1280,720);
  for(const wave of [1,4,7,10,13]){
   const plan=omegaFieldPlan(20261108,wave);
   const camera=omegaQuarterViewCamera(plan.entry,1280,720,1.55);
   const {ctx:vCtx,draws:vDraws}=mockCanvas();
   expect(drawOmegaPaintedVista(vCtx,plan,camera,1280,720,budget)).toBe(true);
   expect(vDraws.length).toBeGreaterThanOrEqual(2);

   const {ctx:fCtx,draws:fDraws}=mockCanvas();
   expect(drawOmegaPaintedFloor(fCtx,plan)).toBe(true);
   expect(fDraws).toHaveLength(1);
   expect(fDraws[0]?.slice(1)).toEqual([0,0,OMEGA_FIELD_WIDTH,OMEGA_FIELD_HEIGHT]);
  }
  const {ctx:badCtx,draws:badDraws}=mockCanvas();
  const plan=omegaFieldPlan(20261108,1);
  const camera=omegaQuarterViewCamera(plan.entry,1280,720,1.55);
  expect(drawOmegaPaintedVista(badCtx,plan,camera,0,720,budget)).toBe(false);
  expect(drawOmegaPaintedVista(badCtx,{...plan,sector:6},camera,1280,720,budget)).toBe(false);
  expect(drawOmegaPaintedFloor(badCtx,{...plan,sector:0})).toBe(false);
  expect(badDraws).toHaveLength(0);
 });
});
