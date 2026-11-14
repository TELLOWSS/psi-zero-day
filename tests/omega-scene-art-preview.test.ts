import {describe,expect,it} from 'vitest';
import {omegaSceneArtFrame,omegaSceneArtRequested} from '../src/ui/omega-scene-art-preview';
import type {OmegaActorView} from '../src/ui/omega-protocol-actor-render';

const view:OmegaActorView={facingX:-1,facingY:0,moving:true,time:1,dashing:false,shooting:false};
describe('integrated art preview',()=>{
 it('stays behind the explicit lab and scene flags',()=>{
  expect(omegaSceneArtRequested('?omegaLab=1&omegaSceneArt=1',true)).toBe(true);
  expect(omegaSceneArtRequested('?omegaLab=1&omegaSceneArt=1',false)).toBe(false);
  expect(omegaSceneArtRequested('?omegaLab=1',true)).toBe(false);
 });
 it('chooses different painted frames only when movement is real',()=>{
  const foot={x:0,y:0,planted:true};
  const gait={active:true,phase:0,distanceTravelled:1,left:foot,right:foot};
  expect(omegaSceneArtFrame({...view,gait})).toBe('walk-W-0');
  expect(omegaSceneArtFrame({...view,gait:{...gait,phase:.76}})).toBe('walk-W-3');
  expect(omegaSceneArtFrame({...view,gait:{...gait,active:false}})).toBe('idle-W');
 });
 it('does not invent painted walking frames for diagonal headings',()=>{
  expect(omegaSceneArtFrame({...view,facingY:1})).toBe('idle-SW');
 });
 it('uses the native action duration to select the available combat poses',()=>{
  expect(omegaSceneArtFrame({...view,facingX:0,facingY:1,dashing:true,actionAge:.2})).toBe('dash-S-3');
  expect(omegaSceneArtFrame({...view,facingX:0,facingY:-1,hurt:true,actionAge:.12})).toBe('hit-N-3');
  expect(omegaSceneArtFrame({...view,facingX:0,facingY:1,shooting:true,actionAge:.08})).toBe('fire-S-3');
  expect(omegaSceneArtFrame({...view,facingX:0,facingY:-1,shooting:true,actionAge:.08})).toBe('idle-N');
 });
});
