import {describe,expect,it} from 'vitest';
import {omegaSceneArtFrame,omegaSceneArtRequested,
 omegaSceneDiagonalFallback,omegaSceneActionFrameIndex,omegaSceneNativeFireHoldUntil} from '../src/ui/omega-scene-art-preview';
import type {OmegaActorView} from '../src/ui/omega-protocol-actor-render';

const view:OmegaActorView={facingX:-1,facingY:0,moving:true,time:1,dashing:false,shooting:false};
const foot={x:0,y:0,planted:true};
const gait={active:true,phase:0,distanceTravelled:1,left:foot,right:foot};
describe('M12-G5o integrated original scene-art preview / NEVER production approval',()=>{
 it('requires explicit scene-art QA URL and never enables normal game',()=>{
  expect(omegaSceneArtRequested('?omegaLab=1&omegaSceneArt=1',true)).toBe(true);
  expect(omegaSceneArtRequested('?omegaLab=1&omegaSceneArt=1',false)).toBe(false);
  expect(omegaSceneArtRequested('?omegaLab=1',true)).toBe(false);
  expect(omegaSceneArtRequested('?omegaSceneArt=1',true)).toBe(false);
 });
 it('chooses real authored four walk images only after actual collision corrected movement',()=>{
  expect(omegaSceneArtFrame({...view,gait})).toBe('walk-W-0');
  expect(omegaSceneArtFrame({...view,gait:{...gait,phase:.76}})).toBe('walk-W-3');
  expect(omegaSceneArtFrame({...view,gait:{...gait,active:false}})).toBe('idle-W');
 });
 it('diagonal motion uses a real nearby side view of four existing painted frames, not an invented eighth pack',()=>{
  const projected=[['NE',1,-1,'E'],['SE',1,1,'E'],['NW',-1,-1,'W'],['SW',-1,1,'W']] as const;
  for(const [heading,x,y,source] of projected){
   expect(omegaSceneDiagonalFallback(heading)).toBe(source);
   for(let i=0;i<4;i++){
    expect(omegaSceneArtFrame({...view,facingX:x,facingY:y,gait:{...gait,phase:(i+.1)/4}}))
     .toBe('walk-'+source+'-'+i);
   }
   expect(omegaSceneArtFrame({...view,facingX:x,facingY:y,gait:{...gait,active:false}}))
    .toBe('idle-'+heading);
  }
  expect(omegaSceneDiagonalFallback('N')).toBeNull();
 });
 it('full source W/E/N/S gait is selected directly and uses all distinct source indices',()=>{
  for(const [x,y,name] of [[-1,0,'W'],[1,0,'E'],[0,1,'S'],[0,-1,'N']] as const)
   for(let i=0;i<4;i++)
    expect(omegaSceneArtFrame({...view,facingX:x,facingY:y,gait:{...gait,phase:(i+.2)/4}}))
     .toBe('walk-'+name+'-'+i);
 });
 it('actual native FIRE/DASH/HIT takes precedence over moving gait for W and recovered E originals',()=>{
  const values=['fire','dash','hit'] as const;
  for(const facingX of [-1,1]){
   for(const action of values){
    const duration=action==='fire'?.165:action==='dash'?.22:.15;
    for(let i=0;i<4;i++){
     const k=omegaSceneArtFrame({...view,facingX,sceneAction:action,gait,
      actionAge:(i+.4)*duration/4,shooting:false,dashing:false,hurt:false});
     expect(k).toBe(action+'-'+(facingX<0?'W':'E')+'-'+i);
    }
   }
  }
 });
 it('real FIRE/DASH/HIT survives E-to-SE and W-to-NW heading transitions',()=>{
  for(const [x,y,side] of [[1,1,'E'],[1,-1,'E'],[-1,1,'W'],[-1,-1,'W']] as const)
   for(const action of ['fire','dash','hit'] as const)
    for(let i=0;i<4;i++){
     const duration=action==='fire'?.165:action==='dash'?.22:.15;
     expect(omegaSceneArtFrame({...view,facingX:x,facingY:y,
      gait,sceneAction:action,actionAge:(i+.25)*duration/4})).toBe(action+'-'+side+'-'+i);
    }
 });
 it('explicit native walk cannot be spoofed into fire by stale shoot flags',()=>{
  expect(omegaSceneArtFrame({...view,facingX:1,gait,shooting:true,sceneAction:'walk'})).toBe('walk-E-0');
  expect(omegaSceneArtFrame({...view,facingX:-1,shooting:true,gait,sceneAction:'walk'})).toBe('walk-W-0');
  expect(omegaSceneArtFrame({...view,sceneAction:'fire',gait,shooting:false,actionAge:.14})).toBe('fire-W-3');
 });
 it('recoil follow-through comes from a REAL handheld launch, not fake shot cues',()=>{
  const at=3;
  const launched=omegaSceneNativeFireHoldUntil(0,[{phase:'launch',kind:'radio'}],at);
  expect(launched).toBeCloseTo(3.09);
  const carried=omegaSceneNativeFireHoldUntil(launched,[],at+.13);
  expect(carried).toBeCloseTo(launched);
  expect(omegaSceneActionFrameIndex('fire',at+.13-(carried-.09))).toBe(3);
  expect(omegaSceneNativeFireHoldUntil(carried,[],at+.25)).toBe(0);
  expect(omegaSceneNativeFireHoldUntil(0,[{phase:'impact',kind:'radio'}],at)).toBe(0);
  expect(omegaSceneNativeFireHoldUntil(0,[{phase:'launch',kind:'drone_laser'}],at)).toBe(0);
  expect(omegaSceneNativeFireHoldUntil(carried,[],0)).toBe(0);
  expect(omegaSceneNativeFireHoldUntil(0,[{phase:'launch',kind:'radio'}],NaN)).toBe(0);
 });
 it('action frames clamp malformed and out-of-bounds age rather than selecting missing files',()=>{
  for(const action of ['fire','dash','hit'] as const){
   expect(omegaSceneActionFrameIndex(action,-42)).toBe(0);
   expect(omegaSceneActionFrameIndex(action,NaN)).toBe(0);
   expect(omegaSceneActionFrameIndex(action,Infinity)).toBe(0);
   expect(omegaSceneActionFrameIndex(action,100)).toBe(3);
  }
 });
});
