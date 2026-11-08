import {describe,it,expect,vi} from 'vitest';
import {omegaTechnicalFramePlacement} from '../src/ui/omega-stage-preview-bridge';
import {OMEGA_VFX_ATLAS,omegaVfxFrame,drawOmegaVfxPreview} from '../src/ui/omega-combat-vfx';

describe('OMEGA original VFX sprite atlas — 32 frames, gameplay effects not unlocked',()=>{
 const pose=omegaTechnicalFramePlacement({x:250,y:380},0,0,160);
 it('provides precisely 4 × 8 non-overlapping 384px sprite rectangles',()=>{
  const addresses=new Set<string>();
  for(const [row,action] of OMEGA_VFX_ATLAS.actions.entries()){
   for(let frame=0;frame<8;frame++){
    const t=frame*({muzzle:250,dash:410,hit:350,ultimate:1100}[action])/8+1;
    const fx=omegaVfxFrame(pose,action,t);
    expect(fx.source.x).toBe(frame*384);
    expect(fx.source.y).toBe(row*384);
    expect(fx.source.width).toBe(384);
    expect(fx.source.height).toBe(384);
    expect(fx.releaseApproved).toBe(false);
    addresses.add(fx.source.x+':'+fx.source.y);
   }
  }
  expect(addresses.size).toBe(32);
 });
 it('positions muzzle on weapon, damage over chest and ultimate around hip',()=>{
  const fire=omegaVfxFrame(pose,'muzzle',90),hit=omegaVfxFrame(pose,'hit',90),
    ult=omegaVfxFrame(pose,'ultimate',90);
  expect(fire.destination.x+fire.destination.width/2).toBeCloseTo(pose.sockets.weaponMuzzle.x);
  expect(fire.destination.y+fire.destination.height/2).toBeCloseTo(pose.sockets.weaponMuzzle.y);
  expect(hit.destination.y+hit.destination.height/2).toBeCloseTo(pose.sockets.chest.y);
  expect(ult.destination.x+ult.destination.width/2).toBeCloseTo(pose.sockets.hip.x);
 });
 it('clamps time, prevents stale effects after their duration and honors reduced-motion',()=>{
  expect(omegaVfxFrame(pose,'muzzle',-30).frame).toBe(0);
  expect(omegaVfxFrame(pose,'ultimate',NaN).frame).toBe(0);
  expect(omegaVfxFrame(pose,'muzzle',999)).toMatchObject({finished:true,frame:7});
  expect(omegaVfxFrame(pose,'dash',60,true)).toMatchObject({frame:4,opacity:0.35});
 });
 it('composites only valid 3072×1536 atlas and resets canvas state',()=>{
  const drawImage=vi.fn(),save=vi.fn(),restore=vi.fn();
  const ctx={drawImage,save,restore,globalAlpha:1} as unknown as CanvasRenderingContext2D;
  const image={naturalWidth:3072,naturalHeight:1536} as HTMLImageElement;
  const frame=omegaVfxFrame(pose,'ultimate',120);
  expect(drawOmegaVfxPreview(ctx,image,frame)).toBe(true);
  expect(drawImage).toHaveBeenCalledOnce();
  expect(save).toHaveBeenCalledOnce();expect(restore).toHaveBeenCalledOnce();
  expect(drawOmegaVfxPreview(ctx,{naturalWidth:1536,naturalHeight:1536} as HTMLImageElement,frame)).toBe(false);
  expect(drawOmegaVfxPreview(ctx,image,omegaVfxFrame(pose,'hit',999))).toBe(false);
 });
});
