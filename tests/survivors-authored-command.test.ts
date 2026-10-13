import {describe,it,expect,vi} from 'vitest';
import {attackProgress,commandFrame,ATTACK_MOTION} from '../src/ui/survivors-attack-motion';
import {SpriteMotionTracker} from '../src/ui/survivors-sprite-motion';
import {fittingPose} from '../src/ui/survivors-fitting-pose';
import {materialRibbonPoint,drawMaterialRibbon} from '../src/ui/survivors-material-ribbon';

describe('authored command and optical material motion',()=>{
 it('visits all eight authored poses and restores neutral after each attack profile',()=>{
  for(const kind of ['shot','spray','ultimate'] as const){
   const duration=ATTACK_MOTION[kind].duration;
   expect(Array.from({length:8},(_,i)=>commandFrame(attackProgress((i+.5)/8*duration,kind)))).toEqual([0,1,2,3,4,5,6,7]);
   for(const elapsed of [-1,duration,duration+1,NaN,Infinity])expect(commandFrame(attackProgress(elapsed,kind))).toBe(0);
  }
 });
 it('uses simulation attack time while walking and freezes repeated samples',()=>{
  const tracker=new SpriteMotionTracker(),actor={};tracker.sample(actor,0,0,0);tracker.act(actor,0,'ultimate');
  const pose=tracker.sample(actor,12,0,.1);
  expect(pose.moving).toBe(true);expect(pose.actionProgress).toBeCloseTo(.1/.42);
  expect(tracker.sample(actor,12,0,.1)).toBe(pose);
  expect(tracker.sample(actor,24,0,.5).actionProgress).toBe(0);
  tracker.act(actor,.5);expect(tracker.sample(actor,24,0,.52).actionProgress).toBeCloseTo(.02/.24);
 });
 it('shares the same frame timing in fitting and keeps reduced motion neutral',()=>{
  expect(fittingPose(.15,'action',1,false,'ultimate').actionProgress).toBeCloseTo(.15/.42);
  expect(fittingPose(.15,'action',1,true,'ultimate').actionProgress).toBe(0);
  expect(fittingPose(.15,'walk',1,false).actionProgress).toBe(0);
 });
 it('finishes the hand gesture during rapid mixed firing without suppressing recoil',()=>{
  const tracker=new SpriteMotionTracker(),actor={},frames=[];tracker.act(actor,0);let emission=0;
  for(let i=0;i<8;i++){
   const time=(i+.5)/8*.24;
   if(time-emission>=.065){tracker.act(actor,time,i%2?'spray':'shot');emission=time;}
   const pose=tracker.sample(actor,0,0,time);frames.push(commandFrame(pose.actionProgress));
  }
  expect(frames).toEqual([0,1,2,3,4,5,6,7]);
  tracker.act(actor,.25,'ultimate');expect(tracker.sample(actor,0,0,.29).actionProgress).toBeCloseTo(.04/.42);
  tracker.act(actor,.30,'shot');expect(tracker.sample(actor,0,0,.33).actionProgress).toBeCloseTo(.08/.42);
  tracker.act(actor,0,'shot');expect(tracker.sample(actor,0,0,.03).actionProgress).toBeCloseTo(.03/.24);
 });
 it('advects continuous mirrored texture sampling with bounded silhouette opacity',()=>{
  for(let u=0;u<=1;u+=.1)for(let time=0;time<2;time+=.05){
   const a=materialRibbonPoint(u,time,1),b=materialRibbonPoint(u,time+.001,1),left=materialRibbonPoint(u,time,-1);
   expect(a.x).toBe(-left.x);expect(a.y).toBe(left.y);expect(Math.abs(a.texture-b.texture)).toBeLessThan(.002);
   expect(a.alpha).toBeGreaterThanOrEqual(0);expect(a.alpha).toBeLessThanOrEqual(.46);
   expect(a.texture).toBeGreaterThanOrEqual(0);expect(a.texture).toBeLessThanOrEqual(1);
  }
  expect(materialRibbonPoint(0,0,1).alpha).toBe(0);expect(materialRibbonPoint(1,0,1).alpha).toBeLessThan(1e-20);
  expect(materialRibbonPoint(.5,0,1,1).width).toBeGreaterThan(materialRibbonPoint(.5,0,1).width);
 });
 it('halves strip work under crowding and never samples adjacent cells',()=>{
  const atlas={naturalWidth:1448,naturalHeight:1086} as HTMLImageElement;
  const ctx={save:vi.fn(),restore:vi.fn(),translate:vi.fn(),rotate:vi.fn(),drawImage:vi.fn()} as unknown as CanvasRenderingContext2D;
  drawMaterialRibbon(ctx,atlas,6,1,1,0,0,false);expect(ctx.drawImage).toHaveBeenCalledTimes(8);
  for(const call of vi.mocked(ctx.drawImage).mock.calls){expect(call[1]).toBeGreaterThan(724);expect(Number(call[1])+Number(call[3])).toBeLessThan(1086);expect(call[2]).toBeGreaterThan(362);expect(Number(call[2])+Number(call[4])).toBeLessThan(724);}
  vi.mocked(ctx.drawImage).mockClear();drawMaterialRibbon(ctx,atlas,6,1,1,0,0,true);expect(ctx.drawImage).toHaveBeenCalledTimes(4);
  expect(vi.mocked(ctx.save).mock.calls.length).toBe(vi.mocked(ctx.restore).mock.calls.length);
 });
});
