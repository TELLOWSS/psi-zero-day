import {describe,it,expect} from 'vitest';
import {OMEGA_WALK_STUDY,OMEGA_WALK_STUDY_MOBILE,omegaWalkStudyAtlasFrame} from '../src/ui/omega-walk-atlas';
import {OMEGA_ART_CONTRACT,OMEGA_MOTIONS} from '../src/ui/omega-operator-motion';
import {omegaOperatorEligibility} from '../src/domain/omega-operator-unlock';
import {PATROL_STAGE_IDS} from '../src/domain/patrol-survivors';

describe('OMEGA 8 direction × 6 phase reference atlas is NOT a playable release',()=>{
 it('samples valid 384×512 rects across all 48 cells without spilling atlas boundaries',()=>{
  expect(OMEGA_MOTIONS.walk.frames).toBe(6);
  expect(OMEGA_ART_CONTRACT.contactFramesPerDirection).toBe(6);
  expect([OMEGA_WALK_STUDY.columns,OMEGA_WALK_STUDY.rows]).toEqual([8,6]);
  const all=new Set<string>();
  for(let direction=0;direction<8;direction++){
   for(let frame=0;frame<6;frame++){
    const radians=direction*Math.PI/4;
    const elapsed=frame/OMEGA_MOTIONS.walk.fps;
    const p=omegaWalkStudyAtlasFrame(elapsed,radians);
    expect(p).toMatchObject({x:direction*384,y:frame*512,width:384,height:512,directionIndex:direction,frame,playable:false});
    expect(p.x+p.width).toBeLessThanOrEqual(OMEGA_WALK_STUDY.width);
    expect(p.y+p.height).toBeLessThanOrEqual(OMEGA_WALK_STUDY.height);
    all.add(`${p.x}:${p.y}`);
   }
  }
  expect(all.size).toBe(48);
 });
 it('keeps 8x6 mobile atlas addresses in bounds with quarter texture memory',()=>{
  expect(OMEGA_WALK_STUDY_MOBILE).toMatchObject({width:1536,height:1536,frameWidth:192,frameHeight:256,prototypeOnly:true,artistApproved:false});
  for(let direction=0;direction<8;direction++)for(let frame=0;frame<6;frame++){
   const p=omegaWalkStudyAtlasFrame(frame/12,direction*Math.PI/4,false,'mobile');
   expect(p).toMatchObject({x:direction*192,y:frame*256,width:192,height:256,playable:false});
   expect(p.x+p.width).toBeLessThanOrEqual(OMEGA_WALK_STUDY_MOBILE.width);
   expect(p.y+p.height).toBeLessThanOrEqual(OMEGA_WALK_STUDY_MOBILE.height);
  }
  expect(OMEGA_WALK_STUDY_MOBILE.width*OMEGA_WALK_STUDY_MOBILE.height*4)
   .toBe((OMEGA_WALK_STUDY.width*OMEGA_WALK_STUDY.height*4)/4);
 });
 it('supports wraparound, negative time and reduced-motion static frame',()=>{
  expect(omegaWalkStudyAtlasFrame(.5,2*Math.PI)).toMatchObject({direction:'E',frame:0,x:0,y:0});
  expect(omegaWalkStudyAtlasFrame(-3,0)).toMatchObject({frame:0});
  expect(omegaWalkStudyAtlasFrame(.25,Math.PI/2,true)).toMatchObject({direction:'S',frame:0,y:0});
  expect(omegaWalkStudyAtlasFrame(Number.NaN,Number.NaN)).toMatchObject({direction:'S',frame:0});
 });
 it('keeps real Master rewards separate from prototype artwork entitlement',()=>{
  const all=[...PATROL_STAGE_IDS];
  const record=Object.fromEntries(all.map(id=>[id,{mastery:3}]));
  expect(omegaOperatorEligibility(all,record).earned).toBe(true);
  expect(OMEGA_WALK_STUDY.artistApproved).toBe(false);
  expect(OMEGA_WALK_STUDY.prototypeOnly).toBe(true);
  expect(OMEGA_WALK_STUDY.uniqueRearRight).toBe(false);
  expect(OMEGA_WALK_STUDY.actualGameplayIntegration).toBe(false);
 });
});
