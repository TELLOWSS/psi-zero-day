import {describe,it,expect} from 'vitest';
import {OMEGA_DIRECTIONS,drawOmegaProtocolActor} from '../src/ui/omega-protocol-actor-render';
import {
 omegaAiraKineticPose,omegaAiraKineticFrameIndex,
 OMEGA_AIRA_TECHNICAL_ACTION_KEYS,
} from '../src/ui/omega-protocol-aira-kinetics';
import type {OmegaArtAction} from '../src/ui/omega-protocol-art-motion';

const durations:Readonly<Record<OmegaArtAction,number>>={
 walk:.59,fire:.165,dash:.22,hit:.18,ultimate:2,finish:1,
};
describe('OMEGA original kinetic body framing (NOT approved 160-sprite art)',()=>{
 it('keeps a full action vocabulary of exactly 20 distinct time slots per heading',()=>{
  expect(Object.values(OMEGA_AIRA_TECHNICAL_ACTION_KEYS)
   .reduce((sum,n)=>sum+n,0)).toBe(20);
  for(const h of OMEGA_DIRECTIONS){
   for(const action of Object.keys(durations) as OmegaArtAction[]){
    const n=OMEGA_AIRA_TECHNICAL_ACTION_KEYS[action];
    const entries=Array.from({length:n},(_,i)=>
     omegaAiraKineticPose(h,action,(i+.25)/n*durations[action]));
    expect(entries.map(e=>e.index)).toEqual(Array.from({length:n},(_,i)=>i));
    expect(new Set(entries.map(({torsoTilt,torsoYOffset,hairSweep,shoulderYOffset,weaponRecoil})=>
     JSON.stringify([torsoTilt,torsoYOffset,hairSweep,shoulderYOffset,weaponRecoil]))).size).toBe(n);
   }
  }
 });
 it('provides independent left/front/back direction pose offsets, not one omnidirectional still',()=>{
  for(const action of ['walk','fire','dash','hit','ultimate','finish'] as const){
   const poses=OMEGA_DIRECTIONS.map(h=>omegaAiraKineticPose(h,action,durations[action]*.5));
   const keys=poses.map(p=>JSON.stringify([p.torsoTilt,p.torsoYOffset,
     p.hairSweep,p.shoulderYOffset]));
   expect(new Set(keys).size).toBe(8);
  }
 });
 it('does not invent attack recoil when no native shot event exists',()=>{
  expect(omegaAiraKineticPose('S','walk',.2).weaponRecoil).toBe(0);
  expect(omegaAiraKineticPose('S','dash',.12).weaponRecoil).toBe(0);
  expect(omegaAiraKineticPose('S','hit',.12).weaponRecoil).toBe(0);
  expect(omegaAiraKineticPose('S','fire',.08).weaponRecoil).toBeGreaterThan(0);
  expect(omegaAiraKineticFrameIndex('fire',Infinity)).toBe(0);
  expect(omegaAiraKineticFrameIndex('finish',10)).toBe(1);
 });
 it('makes visible source-body operations change for native action phases without moving collision feet',()=>{
  const draw=(action:OmegaArtAction,actionAge:number)=>{
   const events:Array<{name:string;args:unknown[]}>= [];
   const ctx=new Proxy({},{
    get(_t,key){return (...args:unknown[])=>events.push({name:String(key),args});},
    set(){return true;},
   }) as unknown as CanvasRenderingContext2D;
   drawOmegaProtocolActor(ctx,{
    facingX:1,facingY:0,moving:true,time:2.1,
    dashing:action==='dash',shooting:action==='fire',
    hurt:action==='hit',ultimate:action==='ultimate',
    finished:action==='finish',actionAge,
   });
   return events;
  };
  const walk=draw('walk',0),fire=draw('fire',.08),
   dash=draw('dash',.11),hit=draw('hit',.1);
  const rotations=([walk,fire,dash,hit]).map(calls=>calls.filter(c=>c.name==='rotate')
   .map(c=>c.args[0]));
  expect(new Set(rotations.map(JSON.stringify)).size).toBe(4);
  // Native feet are drawn before the upper-body tilt, preserving ground pivot.
  for(const calls of [walk,fire,dash,hit]){
   const boot=calls.findIndex(c=>c.name==='fillRect');
   const torso=calls.findIndex(c=>c.name==='rotate');
   expect(boot).toBeGreaterThanOrEqual(0);
   expect(torso).toBeGreaterThan(boot);
  }
 });
});
