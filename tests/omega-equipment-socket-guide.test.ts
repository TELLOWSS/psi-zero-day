import {describe,it,expect} from 'vitest';
import {OMEGA_DIRECTIONS} from '../src/ui/omega-operator-motion';
import {omegaAllSocketGuides,omegaFrameSocketGuide} from '../src/ui/omega-equipment-socket-guide';
describe('OMEGA 8-direction 48 pose socket handoff is an unapproved art guide',()=>{
 it('provides 48 finite separate pose records and all mandatory gear/foot anchors',()=>{
  const records=omegaAllSocketGuides();
  expect(records).toHaveLength(48);
  const keys=['head','chest','hip','back','leftHip','rightHip','leftKnee','rightKnee',
   'leftFoot','rightFoot','leftWrist','rightWrist','radio','weaponMuzzle','leftShoulder','rightShoulder'];
  for(const [i,pose] of records.entries()){
   expect(pose.heading).toBe(OMEGA_DIRECTIONS[Math.floor(i/6)]);
   expect(pose.phase).toBe(i%6);
   expect(Object.keys(pose.sockets).sort()).toEqual([...keys].sort());
   expect(pose.artStatus).toBe('VECTOR_PROTOTYPE_NOT_PLAYABLE');
   expect(pose.editorApproval).toBe(false);
   expect(pose.avatarEnabled).toBe(false);
   for(const coord of Object.values(pose.sockets)){
    expect(coord.x).toBeGreaterThanOrEqual(0);
    expect(coord.x).toBeLessThanOrEqual(384);
    expect(coord.y).toBeGreaterThanOrEqual(0);
    expect(coord.y).toBeLessThanOrEqual(512);
   }
   expect(pose.stance.left||pose.stance.right).toBe(true);
   for(const side of ['left','right'] as const){
    if(pose.stance[side])expect(pose.sockets[side+'Foot' as 'leftFoot'|'rightFoot'].y).toBe(454);
   }
  }
 });
 it('matches independently generated NE vector anchors without borrowing NW bitmap pixels',()=>{
  const ne=omegaFrameSocketGuide('NE',0);
  const nw=omegaFrameSocketGuide('NW',0);
  expect(ne.sockets.head).toEqual({x:196.95,y:153.5});
  expect(ne.sockets.radio).toEqual({x:212.51,y:218});
  expect(ne.sockets.leftFoot).toEqual({x:216.04,y:454});
  expect(ne.sockets.leftKnee.x).toBeCloseTo(253.66,1);
  expect(ne.sockets.leftKnee.y).toBeCloseTo(359.81,1);
  expect(ne.sockets.radio.x).toBeCloseTo(nw.sockets.radio.x,2);
  expect(ne.sockets.radio.x).not.toBeCloseTo(384-nw.sockets.radio.x,0);
  expect(ne.sockets.weaponMuzzle.x).not.toBe(nw.sockets.weaponMuzzle.x);
 });
 it('is deterministic in all 48 poses and rejects invalid phases',()=>{
  for(const dir of OMEGA_DIRECTIONS)for(let frame=0;frame<6;frame++){
   expect(omegaFrameSocketGuide(dir,frame)).toEqual(omegaFrameSocketGuide(dir,frame));
  }
  expect(()=>omegaFrameSocketGuide('NE',-1)).toThrow(RangeError);
  expect(()=>omegaFrameSocketGuide('NE',6)).toThrow(RangeError);
  expect(()=>omegaFrameSocketGuide('NE',.5)).toThrow(RangeError);
 });
});
