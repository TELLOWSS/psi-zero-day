import {describe,it,expect} from 'vitest';
import {
 OMEGA_AIRA_V2_WALK_FRAMES,omegaAiraV2WalkFrame,drawOmegaAiraV2WalkRig,
} from '../src/ui/omega-aira-v2-walk-rig';
import {OMEGA_AIRA_V2_HEADINGS} from '../src/ui/omega-aira-v2-candidate';

function canvasTrace(){
 const trace:Array<{name:string;args:unknown[]}>= [];
 const ctx=new Proxy({},{
  get(_target,key){return (...args:unknown[])=>{
   trace.push({name:String(key),args});
  };},
  set(){return true;},
 }) as unknown as CanvasRenderingContext2D;
 return {ctx,trace};
}
describe('AIRA V2 user-chosen image: distance-driven interim cutout walk',()=>{
 it('uses six visibly distinct source-image leg configurations without mirrored art',()=>{
  expect(OMEGA_AIRA_V2_WALK_FRAMES).toBe(6);
  for(const direction of OMEGA_AIRA_V2_HEADINGS){
   const poses=Array.from({length:6},(_,i)=>
    omegaAiraV2WalkFrame(direction,(i+.5)/6));
   expect(poses.map(p=>p.frameIndex)).toEqual([0,1,2,3,4,5]);
   expect(poses.every(p=>p.leftLegAngle===-p.rightLegAngle)).toBe(true);
   expect(new Set(poses.map(p=>JSON.stringify([
    Number(p.leftLegAngle.toFixed(6)),Number(p.torsoX.toFixed(6)),
    Number(p.torsoY.toFixed(6)),
   ]))).size).toBe(6);
  }
  expect(omegaAiraV2WalkFrame('S',Number.NaN).frameIndex).toBe(0);
 });
 it('cuts two native legs and overlays intact torso while retaining fixed world-foot pivot',()=>{
  const {ctx,trace}=canvasTrace();
  const source={} as HTMLImageElement;
  drawOmegaAiraV2WalkRig(ctx,source,'E',.25,118);
  const images=trace.filter(x=>x.name==='drawImage');
  expect(images).toHaveLength(3);
  expect(images[0]!.args.slice(1)).toEqual([0,179,96,157,0,179,96,157]);
  expect(images[1]!.args.slice(1)).toEqual([96,179,96,157,96,179,96,157]);
  expect(images[2]!.args.slice(1)).toEqual([0,0,192,196,0,0,192,196]);
  const scales=trace.filter(x=>x.name==='scale');
  expect(scales).toHaveLength(1);
  expect(scales[0]!.args).toEqual([118/336,118/336]);
  expect(trace.filter(x=>x.name==='rotate')).toHaveLength(2);
  expect(trace.filter(x=>x.name==='save')).toHaveLength(trace.filter(x=>x.name==='restore').length);
 });
 it('never paints NaN dimensions or transforms, even on invalid height',()=>{
  const {ctx,trace}=canvasTrace();
  drawOmegaAiraV2WalkRig(ctx,{} as HTMLImageElement,'N',.5,0);
  drawOmegaAiraV2WalkRig(ctx,{} as HTMLImageElement,'N',.5,NaN);
  expect(trace).toHaveLength(0);
 });
});
