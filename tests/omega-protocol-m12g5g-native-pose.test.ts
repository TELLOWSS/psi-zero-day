import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import type {OmegaActorView} from '../src/ui/omega-protocol-actor-render';
import {
 OMEGA_G5G_ART_APPROVAL,OMEGA_G5G_NATIVE_POSE_MAP,
 omegaG5gLabRequested,omegaG5gPoseIndex,
 omegaG5gCoreSilhouetteDifference,omegaG5gPoseGeometryAudit,
 OmegaG5gNativeActionPoseStudy,
} from '../src/ui/omega-protocol-m12g5g-native-pose';
import {OMEGA_G5D_ACTUAL_E_WALK} from '../src/ui/omega-protocol-m12g5d-actual-source';
import {OmegaG5cLocalPainterlyReview} from '../src/ui/omega-protocol-m12g5c-local-art-review';
import {omegaFieldPlan,omegaFieldNativeTerrain} from '../src/domain/omega-protocol-field';

const actual=(p:Partial<OmegaActorView>={}):OmegaActorView=>({
 facingX:1,facingY:0,weaponFacingX:1,weaponFacingY:0,
 time:5.3,moving:true,dashing:false,shooting:false,hurt:false,
 actionAge:0,...p,
});
describe('M12-G5g original painterly SILVER AIRA four body poses vs FX-only fake actions',()=>{
 it('keeps full 160 original art, 320 masks and ALL independent action paintings BLOCKED',()=>{
  expect(OMEGA_G5G_ART_APPROVAL).toMatchObject({
   origin:'FOUR_ORIGINAL_E_WALK_WEBPS_REUSED_FOR_COMBAT_POSE_STUDY',
   candidateActionCount:3,candidatePoseIndicesPerAction:4,
   actionIndependentPaintedSources:0,approved160PaintedFrames:0,
   approved320Masks:0,artistSignedOff:false,
   commercialReleaseAllowed:false,canReplaceDefaultHero:false,
  });
  expect(omegaG5gLabRequested('?omegaLab=1&omegaM12G5g=1',true)).toBe(true);
  for(const [q,dev] of [
   ['?omegaLab=1&omegaM12G5g=1',false],
   ['?omegaM12G5g=1',true],
   ['?omegaLab=1&omegaM12G5g=true',true],
   ['?omegaLab=1&omegaM12G5g=1&omegaM12G5e=1',true],
   ['?omegaLab=1&omegaM12G5g=1&omegaG5VectorStudy=1',true],
   ['?omegaLab=1&omegaM12G5g=1&omegaSilverPreview=1',true],
  ] as const)expect(omegaG5gLabRequested(q,dev)).toBe(false);
 });
 it('uses real different source body frames per actual native event phase, NOT repeated 0 with a glow',()=>{
  expect(OMEGA_G5G_NATIVE_POSE_MAP).toEqual({
   fire:[0,1,2,3],dash:[0,1,2,3],hit:[0,3,2,1],
  });
  expect([0,1,2,3].map(x=>omegaG5gPoseIndex('hit',x))).toEqual([0,3,2,1]);
  expect(omegaG5gPoseIndex('fire',-1)).toBe(null);
  expect(omegaG5gPoseIndex('fire',4)).toBe(null);
  expect(omegaG5gPoseIndex('dash',NaN)).toBe(null);
 });
 it('requires explicit preview with original SHA verified candidate; never paints through idle/dash expiry/wrong heading',()=>{
  const paints:number[]=[],translations:number[]=[];
  let active=false,opened=0,closed=0;
  const fakeImages=Array.from({length:4},(_,i)=>({g5dIndex:i})) as unknown as HTMLImageElement[];
  const review={get active(){return active;},
   verifiedFrame:(i:number)=>i>=0&&i<4?{image:fakeImages[i]!,toeRow:486+i%2}:null};
  const fx={draw:(_ctx:CanvasRenderingContext2D,im:CanvasImageSource)=>{paints.push((im as unknown as {g5dIndex:number}).g5dIndex);return true;}};
  const context={save:()=>{opened++;},restore:()=>{closed++;},
   translate:(_x:number,y:number)=>{translations.push(y);}} as unknown as CanvasRenderingContext2D;
  const study=new OmegaG5gNativeActionPoseStudy(review,fx);
  expect(study.draw(context,actual({shooting:true,actionAge:.01}),110)).toBe(false);
  active=true;
  expect(study.draw(context,actual(),110)).toBe(false);
  expect(study.draw(context,actual({shooting:true,actionAge:.25}),110)).toBe(false);
  expect(study.draw(context,actual({dashing:true,facingX:-1}),110)).toBe(false);
  expect(study.draw(context,actual({hurt:true,finished:true}),110)).toBe(false);
  expect(study.draw(context,actual({shooting:true,actionAge:.045}),110)).toBe(true);
  expect(paints).toEqual([1]);
  expect(opened).toBe(closed);
  expect(translations[0]).toBeCloseTo(110*(512-487)/512);
  active=false;
  expect(study.draw(context,actual({shooting:true,actionAge:.045}),110)).toBe(false);
 });
 it('all twelve phase visits come from original G5d source IDs, without editing Watch physics or creating new sprite files',()=>{
  const paints:number[]=[],view:Partial<OmegaActorView>={};
  const images=[0,1,2,3].map(g5dIndex=>({g5dIndex})) as unknown as HTMLImageElement[];
  const review={active:true,verifiedFrame:(i:number)=>({
   image:images[i]!,toeRow:486,
  })};
  const painter={draw:(_ctx:CanvasRenderingContext2D,src:CanvasImageSource)=>{
   paints.push((src as unknown as {g5dIndex:number}).g5dIndex);return true;}};
  const ctx={save:()=>{},restore:()=>{},translate:()=>{}} as unknown as CanvasRenderingContext2D;
  const study=new OmegaG5gNativeActionPoseStudy(review,painter);
  const map:{
   flag:'shooting'|'dashing'|'hurt';ages:readonly number[];
   expected:readonly number[];
  }[]=[
   {flag:'shooting',ages:[.001,.046,.09,.14],expected:[0,1,2,3]},
   {flag:'dashing',ages:[.001,.09,.18,.28],expected:[0,1,2,3]},
   {flag:'hurt',ages:[.001,.08,.14,.23],expected:[0,3,2,1]},
  ];
  const world=omegaFieldPlan(20261112,1),before=JSON.stringify(omegaFieldNativeTerrain(world));
  for(const scenario of map){
   const start=paints.length;
   for(const age of scenario.ages){
    const state=actual({...view,[scenario.flag]:true,actionAge:age});
    expect(study.draw(ctx,state,110)).toBe(true);
   }
   expect(paints.slice(start)).toEqual(scenario.expected);
  }
  expect(study.evidence()).toEqual({counts:{fire:4,dash:4,hit:4},
   sourceFrames:{fire:[0,1,2,3],dash:[0,1,2,3],hit:[0,1,2,3]}});
  expect(JSON.stringify(omegaFieldNativeTerrain(world))).toBe(before);
  study.reset();
  expect(study.evidence().counts).toEqual({fire:0,dash:0,hit:0});
 });
 it('real 4 GitHub WebPs have ACTUAL distinct silhouette cores; changing only sparkle RGB with identical alpha MUST fail',async()=>{
  const pixel:Uint8ClampedArray[]=[];
  for(const entry of OMEGA_G5D_ACTUAL_E_WALK){
   const bytes=readFileSync('public'+entry.path);
   expect(createHash('sha256').update(bytes).digest('hex')).toBe(entry.sha256);
   const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   expect([info.width,info.height,info.channels]).toEqual([384,512,4]);
   pixel.push(new Uint8ClampedArray(data));
  }
  const report=omegaG5gPoseGeometryAudit(pixel);
  expect(report.pairwise).toHaveLength(6);
  expect(report.minimum).toBeGreaterThan(.18);
  expect(report.poseStudyEligible).toBe(true);
  expect(report.independentPaintingApproved).toBe(false);
  const duplicate=new Uint8ClampedArray(pixel[0]!);
  // RGB and WebP SHA can change while the body remains EXACTLY the same.
  for(let p=0;p<duplicate.length;p+=4)duplicate[p]=255-duplicate[p]!;
  expect(omegaG5gCoreSilhouetteDifference(pixel[0]!,duplicate)).toBe(0);
  expect(omegaG5gPoseGeometryAudit([pixel[0]!,duplicate,pixel[2]!,pixel[3]!]).poseStudyEligible).toBe(false);
  expect(omegaG5gCoreSilhouetteDifference(new Uint8ClampedArray(4),pixel[0]!)).toBe(0);
 });
 it('existing verified G5c actor review still fails closed by default for new source image access',()=>{
  const review=new OmegaG5cLocalPainterlyReview();
  expect(review.verifiedFrame(0)).toBe(null);
  expect(review.verifiedFrame(4)).toBe(null);
  expect(review.verifiedFrame(-1)).toBe(null);
  expect(review.verifiedFrame(NaN)).toBe(null);
 });
});
