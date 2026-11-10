import {describe,it,expect,vi,afterEach} from 'vitest';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {
 OMEGA_G5_SOURCE_ART,OMEGA_G5_REVIEW_URL,OMEGA_G5_VECTOR_STUDY_URL,
 omegaG5VectorStudyRequested,omegaG5DevRequested,
 omegaG5EFrameIndex,omegaG5DrifterPoseAt,OmegaG5DraftImageCache,
} from '../src/ui/omega-protocol-m12-g5-art';
import type {OmegaActorView} from '../src/ui/omega-protocol-actor-render';
import type {Hazard} from '../src/domain/patrol-survivors';
import type {OmegaZombieBrain} from '../src/domain/omega-protocol-zombie-ai';
import {omegaFieldPlan,omegaFieldNativeTerrain} from '../src/domain/omega-protocol-field';

afterEach(()=>vi.unstubAllGlobals());
const gait=(phase:number,active=true):OmegaActorView=>({
 facingX:1,facingY:0,time:1.2,moving:active,dashing:false,shooting:false,
 gait:{active,phase,distanceTravelled:36*phase,
  left:{x:-12,y:0,planted:true},right:{x:11,y:0,planted:false}},
});
describe('M12-G5 first SIX unique E walk and drifter source-vector key poses',()=>{
 it('requires explicit DEV lab and never turns on production 160 + 320 art gate',()=>{
  expect(OMEGA_G5_SOURCE_ART.productionApproved).toBe(false);
  expect(OMEGA_G5_SOURCE_ART.approved160FrameCount).toBe(0);
  expect(OMEGA_G5_SOURCE_ART.approved320MaskCount).toBe(0);
  expect(omegaG5DevRequested('?omegaLab=1&omegaM12G5=1',true)).toBe(true);
  for(const [query,lab] of [
   ['?omegaLab=1&omegaM12G5=1',false],
   ['?omegaM12G5=1',true],['?omegaLab=1&omegaM12G5=true',true],
   ['?omegaLab=1&omegaM12G5=1&omegaSilverPreview=repo',true],
   ['?omegaLab=1&omegaM12G5=1&omegaM12G4=1',true],
  ] as const)expect(omegaG5DevRequested(query,lab)).toBe(false);
  expect(OMEGA_G5_REVIEW_URL).toContain('omegaM12G5=1');
  expect(omegaG5VectorStudyRequested('?omegaLab=1&omegaM12G5=1',true)).toBe(false);
  expect(omegaG5VectorStudyRequested('?omegaLab=1&omegaM12G5=1&omegaG5VectorStudy=1',true)).toBe(true);
  expect(omegaG5VectorStudyRequested('?omegaLab=1&omegaM12G5=1&omegaG5VectorStudy=1',false)).toBe(false);
  expect(omegaG5VectorStudyRequested('?omegaM12G5=1&omegaG5VectorStudy=1',true)).toBe(false);
  expect(OMEGA_G5_VECTOR_STUDY_URL).toContain('omegaG5VectorStudy=1');
 });
 it('has SIX physically distinct local original 384x512 SVG binaries, no mirror, embedded remote image or duplicate',()=>{
  const sources=[...OMEGA_G5_SOURCE_ART.silverEast,...OMEGA_G5_SOURCE_ART.infectedDrifter];
  expect(new Set(sources).size).toBe(6);
  const contents=sources.map(p=>readFileSync(join(process.cwd(),'public',p.replace(/^\//,'')),'utf8'));
  expect(new Set(contents).size).toBe(6);
  for(const txt of contents){
   expect(txt).toMatch(/viewBox="0 0 384 512"/);
   expect(txt).toMatch(/width="384" height="512"/);
   expect(txt).not.toMatch(/<image|<use|href=|scale\(-1/);
   expect((txt.match(/<path/g)??[]).length).toBeGreaterThan(18);
  }
  // These are independently composed key poses, not repeated sources.
  expect(new Set(contents.slice(0,4).map(s=>s.match(/<!-- legs:[\s\S]+?<\/path>/)?.[0]??s)).size).toBe(4);
 });
 it('advances E source based on actual collision-corrected Watch gait, never on clock alone',()=>{
  expect([0,.12,.249,.25,.49,.5,.749,.75,.99,1].map(omegaG5EFrameIndex))
   .toEqual([0,0,0,1,1,2,2,3,3,0]);
  expect(omegaG5EFrameIndex(NaN)).toBe(0);
  expect(omegaG5EFrameIndex(-.01)).toBe(3);
  const a={x:200,y:220},b={x:200,y:220};
  expect(omegaG5DrifterPoseAt(a)).toBe(omegaG5DrifterPoseAt(b));
  expect([omegaG5DrifterPoseAt({x:208,y:220}),omegaG5DrifterPoseAt({x:232,y:220}),
   omegaG5DrifterPoseAt({x:262,y:220})]).toContain(1);
 });
 it('paints different sources only on authentic E travel; rejects idle, 7 other angles and unsupported actions',()=>{
  const paths:string[]=[];
  class Decoded{
   decoding=''; complete=true; naturalWidth=384; naturalHeight=512;
   onload:(()=>void)|null=null;onerror:(()=>void)|null=null;private value='';
   set src(v:string){this.value=v;paths.push(v);}get src(){return this.value;}
  }
  vi.stubGlobal('Image',Decoded);
  const art=new OmegaG5DraftImageCache();art.prepare();
  expect(art.status()).toEqual({silverEast:4,infectedDrifter:2});
  const draws:unknown[][]=[];
  const ctx={drawImage:(...args:unknown[])=>draws.push(args)} as unknown as CanvasRenderingContext2D;
  for(const [phase,index] of [[.1,0],[.34,1],[.56,2],[.89,3]] as const){
   expect(art.drawSilverE(ctx,gait(phase),109)).toBe(true);
   expect((draws.at(-1)?.[0] as Decoded).src).toBe(OMEGA_G5_SOURCE_ART.silverEast[index]);
  }
  expect(draws).toHaveLength(4);
  expect(art.evidence().heroFramesSeen).toEqual([0,1,2,3]);
  for(const changes of [
   {facingX:-1,facingY:0},{facingX:1,facingY:1},
   {shooting:true},{dashing:true},{hurt:true},
   {ultimate:true},{finished:true},
   {gait:{...gait(.5).gait!,active:false}},{gait:undefined},
  ]){
   expect(art.drawSilverE(ctx,{...gait(.5),...changes},109)).toBe(false);
  }
  expect(draws).toHaveLength(4);
  expect(paths).toHaveLength(6);
 });
 it('only overrides the live drifter (not 3 other native zombie kinds), preserving 4 domain solids',()=>{
  class Decoded{complete=true;naturalWidth=384;naturalHeight=512;decoding='';onload=null;onerror=null;src='';}
  vi.stubGlobal('Image',Decoded);
  const art=new OmegaG5DraftImageCache();art.prepare();
  const calls:unknown[][]=[];
  const ctx={drawImage:(...args:unknown[])=>calls.push(args)} as unknown as CanvasRenderingContext2D;
  const hazard={type:'UNHELMETED',id:'drifter-1',hp:1,x:200,y:300} as Hazard;
  const brain={kind:'drifter',phase:'pursue'} as OmegaZombieBrain;
  const plan=omegaFieldPlan(20261110,1),terrain=JSON.stringify(omegaFieldNativeTerrain(plan));
  expect(art.drawDrifter(ctx,hazard,brain)).toBe(true);
  expect(calls).toHaveLength(1);
  expect(art.drawDrifter(ctx,hazard,{...brain,kind:'sprinter'})).toBe(false);
  expect(art.drawDrifter(ctx,{...hazard,hp:0},brain)).toBe(false);
  expect(art.drawDrifter(ctx,hazard,undefined)).toBe(false);
  expect(art.evidence().drifterDraws).toBe(1);
  expect(JSON.stringify(omegaFieldNativeTerrain(plan))).toBe(terrain);
 });
});
