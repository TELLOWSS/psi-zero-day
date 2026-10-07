import {expect,it} from 'vitest';
import {EquipmentCheckDirection} from '../src/ui/survivors-equipment-check';
import {directionalPoseWeights} from '../src/ui/survivors-directional-art';
import {fittingPose} from '../src/ui/survivors-fitting-pose';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import asset from '../content/survivors-equipment-check-v1.json';
const safe={clock:0,phase:'playing',moving:false,action:0,reaction:0,danger:false,reduced:false,player:true};
it('binds the actual transparent final candidate binary without claiming Director approval',()=>{
 const bytes=readFileSync('public'+asset.uri);expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
 expect(bytes.readUInt32BE(16)).toBe(asset.width);expect(bytes.readUInt32BE(20)).toBe(asset.height);expect(bytes[25]).toBe(6);
 expect(asset.status).toBe('FINAL_CANDIDATE');expect(asset.directorVisualApproval).toBe(false);
});
it('uses a dedicated check cell, not a firing gesture, and blends without opacity loss',()=>{
 const pose=fittingPose(.45,'check',1,false);expect(directionalPoseWeights(pose)).toEqual([{frame:11,weight:1}]);
 for(const progress of [0,.05,.1,.5,.9,.99,1,NaN]){
  const weights=directionalPoseWeights({...pose,equipmentCheck:progress});expect(weights.reduce((sum,w)=>sum+w.weight,0)).toBeCloseTo(1);
 }
 expect(directionalPoseWeights({...pose,moving:true}).some(w=>w.frame===11)).toBe(false);
 expect(directionalPoseWeights({...pose,action:1}).some(w=>w.frame===11)).toBe(false);
 expect(directionalPoseWeights(fittingPose(.45,'check',1,true)).some(w=>w.frame===11)).toBe(false);
});
it('checks briefly on a safe opening, freezes on pause, and input interrupts immediately',()=>{
 const director=new EquipmentCheckDirection();expect(director.sample(safe)).toBe(0);
 expect(director.sample({...safe,clock:.45})).toBeCloseTo(.5);
 expect(director.sample({...safe,phase:'paused',clock:.45})).toBeCloseTo(.5);
 expect(director.sample({...safe,clock:.46,moving:true})).toBe(0);
 expect(director.sample({...safe,clock:.47})).toBe(0);
});
it('requires safe idle and cooldown; danger, firing, damage, reduced motion and other actors suppress it',()=>{
 for(const overrides of [{danger:true},{action:1},{reaction:1},{reduced:true},{player:false}]){
  const director=new EquipmentCheckDirection();expect(director.sample({...safe,...overrides,clock:10})).toBe(0);
 }
 const director=new EquipmentCheckDirection();director.sample(safe);director.sample({...safe,clock:1});
 expect(director.sample({...safe,clock:9})).toBe(0);director.sample({...safe,clock:18});expect(director.sample({...safe,clock:18.45})).toBeCloseTo(.5);
 director.reset();expect(director.sample(safe)).toBe(0);expect(director.sample({...safe,clock:.45})).toBeCloseTo(.5);
});
