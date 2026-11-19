import {describe,it,expect} from 'vitest';
import {omegaFieldNativeTerrain,omegaFieldPlan} from '../src/domain/omega-protocol-field';
import {omegaQuarterViewCamera} from '../src/ui/omega-protocol-camera';
import {
 omega3DBudget,omega3DSectorTheme,
 drawOmega3DBackdrop,drawOmega3DGroundSurface,drawOmega3DPropRelief,
 drawOmega3DActorLighting,drawOmega3DOcclusionGuide,drawOmega3DProjectile,
 drawOmega3DForegroundAtmosphere,
} from '../src/ui/omega-protocol-atmosphere-3d';

function fakeCanvas(){
 const ops:string[]=[];
 const hit=(op:string)=>()=>{ops.push(op);};
 const grad={addColorStop:(_stop:number,_color:string)=>{ops.push('colorStop');}};
 const ctx={
  save:hit('save'),restore:hit('restore'),setTransform:hit('setTransform'),
  beginPath:hit('beginPath'),closePath:hit('closePath'),rect:hit('rect'),clip:hit('clip'),
  translate:hit('translate'),moveTo:hit('moveTo'),lineTo:hit('lineTo'),
  arc:hit('arc'),ellipse:hit('ellipse'),
  fill:hit('fill'),stroke:hit('stroke'),fillRect:hit('fillRect'),strokeRect:hit('strokeRect'),
  setLineDash:hit('dash'),
  createLinearGradient:()=>{ops.push('linearGradient');return grad;},
  createRadialGradient:()=>{ops.push('radialGradient');return grad;},
 } as unknown as CanvasRenderingContext2D;
 return {ctx,ops};
}

describe('Diablo-style 3D depth, parallax, and atmosphere across all 15 zones',()=>{
 it('computes bounded quality budgets and rejects invalid viewports',()=>{
  expect(omega3DBudget(390,844)).toEqual({
   tier:'mobile',weatherCount:12,puddles:4,lights:3,godRays:2,parallaxBeams:5,shadowBlur:false,
  });
  expect(omega3DBudget(1024,768)).toEqual({
   tier:'tablet',weatherCount:22,puddles:6,lights:4,godRays:3,parallaxBeams:7,shadowBlur:true,
  });
  expect(omega3DBudget(1440,900)).toEqual({
   tier:'desktop',weatherCount:34,puddles:8,lights:5,godRays:4,parallaxBeams:9,shadowBlur:true,
  });
  expect(()=>omega3DBudget(0,900)).toThrow(RangeError);
  expect(()=>omega3DBudget(Number.NaN,900)).toThrow(RangeError);
 });

 it('provides distinct gothic-industrial themes for all 5 sectors',()=>{
  const weathers=[1,2,3,4,5].map(s=>omega3DSectorTheme(s).weather);
  expect(weathers).toEqual(['rain','sparks','storm','mist','embers']);
  expect(()=>omega3DSectorTheme(0)).toThrow(RangeError);
  expect(()=>omega3DSectorTheme(6)).toThrow(RangeError);
 });

 it('renders multi-plane parallax backdrops and elevated chasm depth across sectors without mutating plans',()=>{
  const budget=omega3DBudget(1440,900);
  for(const wave of [1,4,7,10,15]){
   const plan=omegaFieldPlan(20261108,wave);
   const before=JSON.stringify(plan);
   const camera=omegaQuarterViewCamera(plan.entry,1440,900,1.55);
   const {ctx,ops}=fakeCanvas();
   drawOmega3DBackdrop(ctx,plan,camera,1440,900,12.5,budget);
   expect(ops).toContain('linearGradient');
   expect(ops).toContain('radialGradient');
   expect(ops.length).toBeGreaterThan(35);
   expect(JSON.stringify(plan)).toBe(before);
  }
  const {ctx:badCtx,ops:badOps}=fakeCanvas();
  const plan1=omegaFieldPlan(20261108,1);
  drawOmega3DBackdrop(badCtx,plan1,omegaQuarterViewCamera(plan1.entry,1440,900,1.55),1440,900,Number.NaN,budget);
  expect(badOps).toEqual([]);
 });

 it('renders 3D ground surfaces, specular puddles, and Sectors 2-5 shadows without altering native terrain',()=>{
  const budget=omega3DBudget(1440,900);
  for(const wave of [1,5,14]){
   const plan=omegaFieldPlan(20261108,wave);
   const beforePlan=JSON.stringify(plan);
   const beforeTerrain=JSON.stringify(omegaFieldNativeTerrain(plan));
   const {ctx,ops}=fakeCanvas();
   drawOmega3DGroundSurface(ctx,plan,8.4,budget);
   expect(ops).toContain('ellipse');
   expect(ops).toContain('radialGradient');
   expect(ops.length).toBeGreaterThan(25);
   expect(JSON.stringify(plan)).toBe(beforePlan);
   expect(JSON.stringify(omegaFieldNativeTerrain(plan))).toBe(beforeTerrain);
  }
 });

 it('renders clipped 3D relief shading strictly on genuine obstacles and rejects foreign objects',()=>{
  const budget=omega3DBudget(1440,900);
  const planUpper=omegaFieldPlan(20261108,5);
  const {ctx,ops}=fakeCanvas();
  for(const obstacle of planUpper.obstacles){
   drawOmega3DPropRelief(ctx,planUpper,obstacle,4.2,budget);
  }
  expect(ops).toContain('clip');
  expect(ops).toContain('linearGradient');
  expect(ops.length).toBeGreaterThan(planUpper.obstacles.length*8);

  const foreign={...planUpper.obstacles[0]!};
  const {ctx:foreignCtx,ops:foreignOps}=fakeCanvas();
  drawOmega3DPropRelief(foreignCtx,planUpper,foreign,4.2,budget);
  expect(foreignOps).toEqual([]);
 });

 it('renders dynamic hero torchlight, aim cone, combat flash, boss floor aura, and Sectors 2-5 contact shadows',()=>{
  const budget=omega3DBudget(1440,900);
  const planUpper=omegaFieldPlan(20261108,6);
  const {ctx,ops}=fakeCanvas();
  drawOmega3DActorLighting(
   ctx,planUpper,{x:400,y:450},{x:1,y:0},
   [{x:720,y:440,hp:500,radius:36,isStageBoss:true},{x:610,y:520,hp:120,radius:22}],
   9.1,{muzzle:0.8,blade:0.6},budget,
  );
  expect(ops).toContain('ellipse');
  expect(ops).toContain('radialGradient');
  expect(ops.length).toBeGreaterThan(15);

  const {ctx:badCtx,ops:badOps}=fakeCanvas();
  drawOmega3DActorLighting(badCtx,planUpper,{x:Number.NaN,y:450},{x:1,y:0},[],9.1,{muzzle:1,blade:0},budget);
  expect(badOps).toEqual([]);
 });

 it('keeps Sector 1 occlusion separate while guiding occluded actors in Sectors 2-5',()=>{
  const s1=omegaFieldPlan(20261108,1);
  const s1Obs=s1.obstacles[0]!;
  const {ctx:c1,ops:o1}=fakeCanvas();
  expect(drawOmega3DOcclusionGuide(c1,s1,{x:s1Obs.x+20,y:s1Obs.y+10},3)).toBe(false);
  expect(o1).toEqual([]);

  const s2=omegaFieldPlan(20261108,5);
  const s2Obs=s2.obstacles.find(o=>o.kind==='container')!;
  const {ctx:c2,ops:o2}=fakeCanvas();
  expect(drawOmega3DOcclusionGuide(c2,s2,{x:s2Obs.x+s2Obs.width/2,y:s2Obs.y-20},3)).toBe(true);
  expect(o2).toContain('ellipse');

  const {ctx:cClear,ops:oClear}=fakeCanvas();
  expect(drawOmega3DOcclusionGuide(cClear,s2,{x:s2Obs.x+s2Obs.width/2,y:s2Obs.y+s2Obs.height+45},3)).toBe(false);
  expect(oClear).toEqual([]);
 });

 it('renders layered tracer projectiles and foreground atmosphere + vignette safely',()=>{
  const {ctx:pCtx,ops:pOps}=fakeCanvas();
  drawOmega3DProjectile(pCtx,300,400,5,180,-40,false);
  expect(pOps).toContain('linearGradient');
  expect(pOps.filter(op=>op==='arc')).toHaveLength(2);

  const {ctx:badP,ops:badPOps}=fakeCanvas();
  drawOmega3DProjectile(badP,300,Number.NaN,5,10,0,false);
  expect(badPOps).toEqual([]);

  const planBoss=omegaFieldPlan(20261108,15);
  const camera=omegaQuarterViewCamera(planBoss.entry,1440,900,1.55);
  const budget=omega3DBudget(1440,900);
  const {ctx:fCtx,ops:fOps}=fakeCanvas();
  drawOmega3DForegroundAtmosphere(fCtx,planBoss,camera,1440,900,21.5,true,budget);
  expect(fOps).toContain('radialGradient');
  expect(fOps).toContain('clip');
  expect(fOps.length).toBeGreaterThan(45);
 });
});
