import {describe,expect,it} from 'vitest';
import {omegaFieldNativeTerrain,omegaFieldPlan} from '../src/domain/omega-protocol-field';
import {omega3DBudget} from '../src/ui/omega-protocol-atmosphere-3d';
import {omegaQuarterViewCamera} from '../src/ui/omega-protocol-camera';
import {
 drawOmegaLivingBackdrop,drawOmegaLivingGround,drawOmegaLivingProp,
} from '../src/ui/omega-protocol-living-world';

function ctxProbe(){
 const ops:string[]=[];
 const grad={addColorStop:(_n:number,_s:string)=>ops.push('colorStop')};
 const ctx=new Proxy({},{
  get(_t,key){
   if(key==='createLinearGradient'||key==='createRadialGradient'){
    return ()=>{ops.push(String(key));return grad;};
   }
   return ()=>{ops.push(String(key));};
  },
  set(){return true;},
 }) as unknown as CanvasRenderingContext2D;
 return {ctx,ops};
}

describe('Living 3D environment motion across all 5 sectors and 4 obstacle kinds',()=>{
 it('animates searchlights, skyline drones, and sector horizon phenomena safely',()=>{
  const budget=omega3DBudget(1440,900);
  for(const wave of [1,4,8,11,15]){
   const plan=omegaFieldPlan(20261108,wave);
   const before=JSON.stringify(plan);
   const camera=omegaQuarterViewCamera(plan.entry,1440,900,1.55);
   const {ctx,ops}=ctxProbe();
   drawOmegaLivingBackdrop(ctx,plan,camera,1440,900,14.2,budget);
   expect(ops).toContain('createLinearGradient');
   expect(ops).toContain('arc');
   expect(JSON.stringify(plan)).toBe(before);
  }
  const plan=omegaFieldPlan(20261108,1);
  const camera=omegaQuarterViewCamera(plan.entry,1440,900,1.55);
  const {ctx:bad,ops:badOps}=ctxProbe();
  drawOmegaLivingBackdrop(bad,plan,camera,1440,900,Number.NaN,budget);
  expect(badOps).toEqual([]);
 });

 it('draws puddle rain ripples, perimeter steam, and wayfinding chevrons without changing native terrain',()=>{
  const budget=omega3DBudget(1440,900);
  for(const wave of [1,4,9,12,15]){
   const plan=omegaFieldPlan(20261108,wave);
   const beforePlan=JSON.stringify(plan);
   const beforeTerrain=JSON.stringify(omegaFieldNativeTerrain(plan));
   const {ctx,ops}=ctxProbe();
   drawOmegaLivingGround(ctx,plan,6.75,budget);
   expect(ops).toContain('createRadialGradient');
   expect(ops).toContain('stroke');
   expect(JSON.stringify(plan)).toBe(beforePlan);
   expect(JSON.stringify(omegaFieldNativeTerrain(plan))).toBe(beforeTerrain);
  }
 });

 it('animates all genuine prop kinds and responds to AIRA proximity while rejecting foreign objects',()=>{
  const budget=omega3DBudget(1440,900);
  const plan=omegaFieldPlan(20261108,5);
  for(const obstacle of plan.obstacles){
   const {ctx,ops}=ctxProbe();
   const near={x:obstacle.x+obstacle.width/2,y:obstacle.y+obstacle.height+30};
   drawOmegaLivingProp(ctx,plan,obstacle,near,3.4,budget);
   expect(ops.length).toBeGreaterThan(8);
  }
  const {ctx:fCtx,ops:fOps}=ctxProbe();
  drawOmegaLivingProp(fCtx,plan,{...plan.obstacles[0]!},{x:200,y:200},3.4,budget);
  expect(fOps).toEqual([]);

  const {ctx:bCtx,ops:bOps}=ctxProbe();
  drawOmegaLivingProp(bCtx,plan,plan.obstacles[0]!,{x:Number.NaN,y:200},3.4,budget);
  expect(bOps).toEqual([]);
 });
});
