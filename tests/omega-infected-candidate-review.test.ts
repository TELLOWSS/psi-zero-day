import {describe,it,expect} from 'vitest';
import {OMEGA_INFECTED_FILES,omegaInfectedLabRequested,omegaInfectedSoloKind,omegaInfectedManifest,omegaInfectedPose,omegaAdvanceInfectedStride,omegaInfectedFacesLeft,omegaInfectedIsWebP,OmegaInfectedCandidateReview} from '../src/ui/omega-infected-candidate-review';

describe('OMEGA infected candidate audition',()=>{
 it('permits a solo native actor only in the explicit local art fixture',()=>{
  const q='?omegaLab=1&omegaInfectedArtLab=1&omegaQaState=zombieAI&omegaInfectedSolo=sprinter';
  expect(omegaInfectedSoloKind(q,true)).toBe('sprinter');
  expect(omegaInfectedSoloKind(q,false)).toBeNull();
  expect(omegaInfectedSoloKind(q.replace('zombieAI','other'),true)).toBeNull();
  expect(omegaInfectedSoloKind(q.replace('sprinter','unknown'),true)).toBeNull();
  expect(omegaInfectedSoloKind(q.replace('omegaLab=1','omegaLab=0'),true)).toBeNull();
 });
 it('is isolated behind development and explicit flags',()=>{
  expect(omegaInfectedLabRequested('?omegaLab=1&omegaInfectedArtLab=1',true)).toBe(true);
  expect(omegaInfectedLabRequested('?omegaLab=1&omegaInfectedArtLab=1',false)).toBe(false);
  expect(omegaInfectedLabRequested('?omegaInfectedArtLab=1',true)).toBe(false);
  expect(omegaInfectedLabRequested('?omegaLab=1&omegaInfectedArtLab=1&omegaM12G5i=1',true)).toBe(false);
  const review=new OmegaInfectedCandidateReview();expect(review.activate(true)).toBe(false);expect(review.active).toBe(false);
 });
 it('requires a unique named hash and common reference scale per kind',()=>{
  const frames=OMEGA_INFECTED_FILES.map((file,i)=>({file,sha256:(i+1).toString(16).padStart(64,'0'),foot:{x:200,y:400},referenceHeight:500}));
  expect(omegaInfectedManifest({version:1,frames})).toHaveLength(16);
  expect(()=>omegaInfectedManifest({version:1,frames:frames.slice(1)})).toThrow();
  expect(()=>omegaInfectedManifest({version:1,frames:[...frames.slice(0,15),frames[0]]})).toThrow();
  expect(()=>omegaInfectedManifest({version:1,frames:frames.map((f,i)=>i===0?{...f,referenceHeight:400}:f)})).toThrow();
  expect(()=>omegaInfectedManifest({version:1,frames:frames.map((f,i)=>i===0?{...f,foot:{x:NaN,y:1}}:f)})).toThrow();
 });
 it('advances walk by actual displacement and returns to rest when blocked',()=>{
  const initial={x:100,y:300,time:0,phase:'pursue'} as const;
  const start=omegaAdvanceInfectedStride(undefined,initial,'drifter');
  const first=omegaAdvanceInfectedStride(start,{...initial,x:109,time:.04},'drifter');
  const fast=omegaAdvanceInfectedStride(first,{...initial,x:118,time:.08},'drifter');
  const slow=omegaAdvanceInfectedStride(first,{...initial,x:118,time:.18},'drifter');
  expect(omegaInfectedPose('drifter',start)).toBe(0);
  expect(omegaInfectedPose('drifter',first)).toBe(1);
  expect(omegaInfectedPose('drifter',fast)).toBe(2);
  expect(omegaInfectedPose('drifter',slow)).toBe(2);
  const held=omegaAdvanceInfectedStride(fast,{...initial,x:118,time:.11},'drifter');
  expect(omegaInfectedPose('drifter',held)).toBe(2);
  const stopped=omegaAdvanceInfectedStride(held,{...initial,x:118,time:.25},'drifter');
  expect(omegaInfectedPose('drifter',stopped)).toBe(0);
  const jump=omegaAdvanceInfectedStride(fast,{...initial,x:270,time:.12},'drifter');
  expect(omegaInfectedPose('drifter',jump)).toBe(0);
 });
 it('uses the runner crouch for warning, a raised attack for charge and neither for walking',()=>{
  const warning=omegaAdvanceInfectedStride(undefined,{phase:'warning',x:100,y:300,time:0},'sprinter');
  expect(omegaInfectedPose('sprinter',warning)).toBe(0);
  expect(omegaInfectedPose('armored',warning)).toBe(3);
  const charge=omegaAdvanceInfectedStride(warning,{...warning,phase:'charge',time:.04},'sprinter');
  expect(omegaInfectedPose('sprinter',charge)).toBe(3);
  const first=omegaAdvanceInfectedStride(charge,{...charge,phase:'pursue',time:.08},'sprinter');
  const walk=omegaAdvanceInfectedStride(first,{...first,x:110,time:.12},'sprinter');
  expect(omegaInfectedPose('sprinter',walk)).toBe(1);
 });
 it('keeps the telegraphed horizontal direction during warning and charge',()=>{
  expect(omegaInfectedFacesLeft({phase:'warning',lockedX:-1},100,200)).toBe(true);
  expect(omegaInfectedFacesLeft({phase:'charge',lockedX:1},100,0)).toBe(false);
  expect(omegaInfectedFacesLeft({phase:'pursue',lockedX:1},100,0)).toBe(true);
 });
 it('rejects renamed or truncated non-WebP files',()=>{
  const good=new Uint8Array(16);good.set([82,73,70,70],0);good.set([87,69,66,80],8);
  expect(omegaInfectedIsWebP(good.buffer)).toBe(true);
  expect(omegaInfectedIsWebP(new Uint8Array([137,80,78,71]).buffer)).toBe(false);
  good[8]=0;expect(omegaInfectedIsWebP(good.buffer)).toBe(false);
 });
});
