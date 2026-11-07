import {describe,it,expect} from 'vitest';
import {OMEGA_DIRECTIONS,OMEGA_MOTIONS,OMEGA_ART_CONTRACT,omegaFacingIndex,omegaMotionFrame} from '../src/ui/omega-operator-motion';

describe('OMEGA animation choreography contract',()=>{
 it('provides all eight directions with stable 360-degree wrap',()=>{
  expect(OMEGA_DIRECTIONS).toEqual(['E','SE','S','SW','W','NW','N','NE']);
  expect(omegaFacingIndex(0)).toBe(0);
  expect(omegaFacingIndex(Math.PI/2)).toBe(2);
  expect(omegaFacingIndex(-Math.PI/2)).toBe(6);
  expect(omegaFacingIndex(Math.PI*2)).toBe(0);
  expect(omegaFacingIndex(-Math.PI*2)).toBe(0);
  expect(omegaFacingIndex(Number.NaN)).toBe(2);
 });
 it('has authored frame requirements for locomotion, combat, ultimate, and recovery',()=>{
  expect(Object.keys(OMEGA_MOTIONS)).toEqual(['idle','walk','run','fire','combo','dash','hit','knockdown','recover','ultimate','victory','defeat']);
  expect(OMEGA_MOTIONS.ultimate.frames).toBeGreaterThan(OMEGA_MOTIONS.fire.frames);
  expect(OMEGA_ART_CONTRACT.requiredSockets).toContain('rightWrist');
  expect(OMEGA_ART_CONTRACT.baseDirections).toBe(8);
  for(const config of Object.values(OMEGA_MOTIONS)){
   expect(config.frames).toBeGreaterThanOrEqual(4);
   expect(config.fps).toBeGreaterThan(0);
   expect(config.equipmentAnchors).toBe(true);
  }
 });
 it('loops gait but holds final one-shot frame without overshooting',()=>{
  expect(omegaMotionFrame('run',0,0).frame).toBe(0);
  expect(omegaMotionFrame('run',.5,0).frame).toBe(0);
  expect(omegaMotionFrame('fire',100,Math.PI/2)).toMatchObject({direction:'S',frame:5,finished:true});
  expect(omegaMotionFrame('ultimate',99,0)).toMatchObject({frame:13,finished:true});
  expect(omegaMotionFrame('idle',99,0).finished).toBe(false);
 });
 it('never samples invalid frames for negative/invalid time or reduced-motion UI',()=>{
  for(const name of Object.keys(OMEGA_MOTIONS) as (keyof typeof OMEGA_MOTIONS)[]){
   for(const value of [-10,Number.NaN,0,.01,10000]){
    const sample=omegaMotionFrame(name,value,-Math.PI/2);
    expect(sample.frame).toBeGreaterThanOrEqual(0);
    expect(sample.frame).toBeLessThan(sample.frameCount);
   }
   expect(omegaMotionFrame(name,10,Math.PI,true).frame).toBe(0);
  }
 });
});
