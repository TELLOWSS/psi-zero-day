import {describe,it,expect} from 'vitest';
import {OMEGA_VISUAL_STAGE,omegaVisualAuditLayout,omegaVisualAuditMarker,omegaVisualAuditGroupFrames,omegaVisualAuditNextFrame,OMEGA_VISUAL_AIRA_GROUPS,OMEGA_VISUAL_INFECTED_GROUPS} from '../src/ui/omega-candidate-art-audit';
import {omegaWideVisibleBounds} from '../src/ui/omega-protocol-m12g5i-action-art';
import {omegaInfectedVisibleBounds,OmegaInfectedCandidateReview} from '../src/ui/omega-infected-candidate-review';
import {OmegaG5iLocalActionArtPreview} from '../src/ui/omega-protocol-m12g5i-action-art';

describe('M12-G5k session-only real-image visual comparison',()=>{
 it('positions dissimilar source sizes on the exact same shown ground/foot coordinate',()=>{
  const a={width:640,height:512,referenceHeight:512,foot:{x:320,y:480}};
  const infected={width:656,height:600,referenceHeight:500,foot:{x:315,y:517}};
  for(const frame of [a,infected]){
   const placement=omegaVisualAuditLayout(frame);
   expect(placement.left+frame.foot.x*placement.scale).toBeCloseTo(OMEGA_VISUAL_STAGE.pivotX);
   expect(placement.top+frame.foot.y*placement.scale).toBeCloseTo(OMEGA_VISUAL_STAGE.groundY);
   expect(placement.width/placement.height).toBeCloseTo(frame.width/frame.height);
  }
 });
 it('projects muzzle dot from the identical frame transform; never repositions the real game weapon',()=>{
  const layout=omegaVisualAuditLayout({width:640,height:512,referenceHeight:512,foot:{x:320,y:480}});
  const muzzle=omegaVisualAuditMarker({x:450,y:190},layout);
  expect(muzzle.left).toBeCloseTo(OMEGA_VISUAL_STAGE.pivotX+130*layout.scale);
  expect(muzzle.top).toBeCloseTo(OMEGA_VISUAL_STAGE.groundY-290*layout.scale);
 });
 it('rejects invalid or nonfinite coordinates instead of displaying fake ground proof',()=>{
  for(const foot of [{x:-1,y:300},{x:640,y:300},{x:320,y:512},{x:NaN,y:480}]){
   expect(()=>omegaVisualAuditLayout({width:640,height:512,referenceHeight:512,foot})).toThrow();
  }
  expect(()=>omegaVisualAuditLayout({width:656,height:600,referenceHeight:0,foot:{x:200,y:500}})).toThrow();
 });
 it('returns true pixel bounds for AIRA wide candidates without claiming a foot',()=>{
  const p=new Uint8ClampedArray(640*512*4);
  expect(omegaWideVisibleBounds(p)).toBeNull();
  for(let y=55;y<450;y++)for(let x=90;x<510;x++)p[(y*640+x)*4+3]=255;
  expect(omegaWideVisibleBounds(p)).toEqual({minX:90,minY:55,maxX:509,maxY:449});
  expect(omegaWideVisibleBounds(new Uint8ClampedArray(3))).toBeNull();
 });
 it('tracks infected actor ink independent of guessed foot coordinates',()=>{
  const p=new Uint8ClampedArray(6*5*4);
  p[(1*6+2)*4+3]=64;p[(4*6+5)*4+3]=255;
  expect(omegaInfectedVisibleBounds(p,6,5)).toEqual({minX:2,minY:1,maxX:5,maxY:4});
  expect(omegaInfectedVisibleBounds(p,6,6)).toBeNull();
  expect(omegaInfectedVisibleBounds(new Uint8ClampedArray(4),1,1)).toBeNull();
 });
 it('never creates candidate art or an approval from an empty session',()=>{
  const aira=new OmegaG5iLocalActionArtPreview(),infected=new OmegaInfectedCandidateReview();
  expect(aira.reviewCards()).toEqual([]);
  expect(infected.reviewCards()).toEqual([]);
  expect(aira.activate(true)).toBe(false);
  expect(infected.activate(true)).toBe(false);
  expect(aira.evidence().humanArtworkSignoff).toBe(false);
  expect(infected.evidence().artApproved).toBe(false);
 });
 it('shows exactly the authentic named 0-3 frames in numeric order for every action group',()=>{
  const make=(file:string)=>({file,imageUrl:'blob:qa-metadata-only',width:640,height:512,referenceHeight:512,foot:{x:320,y:480}});
  const allAira=OMEGA_VISUAL_AIRA_GROUPS.flatMap(group=>[3,1,0,2].map(i=>make('aira-east-'+group+'-'+i+'.webp')));
  for(const group of OMEGA_VISUAL_AIRA_GROUPS)
   expect(omegaVisualAuditGroupFrames(allAira,'aira',group).map(x=>x.file))
    .toEqual([0,1,2,3].map(i=>'aira-east-'+group+'-'+i+'.webp'));
  expect(omegaVisualAuditGroupFrames(allAira,'aira','walk')).toEqual([]);
  expect(omegaVisualAuditGroupFrames(allAira.slice(1),'aira','fire')).toEqual([]);
 });
 it('rejects renamed or duplicate infected poses rather than inventing missing artwork',()=>{
  const make=(file:string)=>({file,imageUrl:'blob:qa-metadata-only',width:640,height:512,referenceHeight:512,foot:{x:300,y:480}});
  const all=OMEGA_VISUAL_INFECTED_GROUPS.flatMap(group=>[3,2,1,0].map(i=>make(group+'-'+i+'.webp')));
  for(const group of OMEGA_VISUAL_INFECTED_GROUPS)
   expect(omegaVisualAuditGroupFrames(all,'infected',group).map(x=>x.file))
    .toEqual([0,1,2,3].map(i=>group+'-'+i+'.webp'));
  const dup=all.map((row,i)=>i===1?{...row,file:'basic-0.webp'}:row);
  expect(omegaVisualAuditGroupFrames(dup,'infected','basic')).toEqual([]);
  expect(omegaVisualAuditGroupFrames(all,'infected','unknown')).toEqual([]);
 });
 it('manually moves through four poses without a timer, skipping or automatic approval',()=>{
  expect([0,1,2,3].map(i=>omegaVisualAuditNextFrame(i,1))).toEqual([1,2,3,0]);
  expect([0,1,2,3].map(i=>omegaVisualAuditNextFrame(i,-1))).toEqual([3,0,1,2]);
 });

});
