import {describe,expect,it} from 'vitest';
import {OMEGA_QUARTER_VIEW} from '../src/domain/omega-protocol-field';
import {OMEGA_DIRECTIONS,type OmegaHeading} from '../src/ui/omega-protocol-actor-render';
import {
 OmegaMotionSmoother,OmegaBallisticTracerTracker,
 omegaSilverLocalMuzzle,omegaWorldPointFromUprightOffset,
 drawOmegaSilverKineticActor,drawOmegaEnhancedWideMuzzle,
 drawOmegaBallisticProjectile,drawOmegaBladeWorldSlash,
} from '../src/ui/omega-protocol-silver-kinetics';

const VECTORS:Readonly<Record<OmegaHeading,readonly [number,number]>>={
 E:[1,0],SE:[1,1],S:[0,1],SW:[-1,1],
 W:[-1,0],NW:[-1,-1],N:[0,-1],NE:[1,-1],
};

function recorder(){
 const events:Array<{name:string;args:unknown[]}>= [];
 const grad={addColorStop:()=>{}};
 const ctx=new Proxy({},{
  get(_t,key){
   if(key==='createLinearGradient'||key==='createRadialGradient'){
    return ()=>{events.push({name:String(key),args:[]});return grad;};
   }
   return (...args:unknown[])=>events.push({name:String(key),args});
  },
  set(){return true;},
 }) as unknown as CanvasRenderingContext2D;
 return {ctx,events};
}

describe('Fluid silver AIRA 8-way walk, recoil gunplay, and 3-hit sword combo kinetics',()=>{
 it('smooths post-collision velocity without spikes across zone transitions or NaN inputs',()=>{
  const smoother=new OmegaMotionSmoother();
  expect(smoother.advance(200,300,1/60,1)).toEqual({vx:0,vy:0,speedRatio:0});
  const first=smoother.advance(204,300,1/60,1);
  expect(first.vx).toBeGreaterThan(0);
  expect(first.speedRatio).toBeGreaterThan(0);
  expect(first.speedRatio).toBeLessThanOrEqual(1);
  const reset=smoother.advance(600,300,1/60,1); // >96 teleport clamp
  expect(reset).toEqual({vx:0,vy:0,speedRatio:0});
  expect(smoother.advance(Number.NaN,300,1/60,1)).toEqual({vx:0,vy:0,speedRatio:0});
 });

 it('renders articulated 3-part walk in all 8 directions with ZERO horizontal mirroring',()=>{
  const dummyImage={} as HTMLImageElement;
  for(const heading of OMEGA_DIRECTIONS){
   const [fx,fy]=VECTORS[heading];
   const {ctx,events}=recorder();
   const drawn=drawOmegaSilverKineticActor(ctx,dummyImage,heading,{
    facingX:fx,facingY:fy,moving:true,time:2.4,dashing:false,shooting:false,
    speedRatio:0.9,
    gait:{active:true,phase:0.32,distanceTravelled:18,
     left:{x:-8,y:0,planted:true},right:{x:9,y:-3,planted:false}},
   },118);
   expect(drawn).toBe(true);
   expect(events.filter(e=>e.name==='drawImage')).toHaveLength(3);
   // Zero scale(-1, 1) mirroring across all 8 directions!
   expect(events.some(e=>e.name==='scale'&&(e.args[0] as number)<0)).toBe(false);
  }
 });

 it('orders additive muzzle flash BEHIND rear heading (N) and IN FRONT of S with zero vector fillRect guns',()=>{
  const dummyImage={} as HTMLImageElement;
  const run=(heading:OmegaHeading)=>{
   const [fx,fy]=VECTORS[heading];
   const {ctx,events}=recorder();
   drawOmegaSilverKineticActor(ctx,dummyImage,heading,{
    facingX:fx,facingY:fy,weaponFacingX:1,weaponFacingY:0,
    moving:false,time:1.2,dashing:false,shooting:true,actionAge:0.03,
   },118);
   return events;
  };
  const back=run('N');
  const front=run('S');
  expect(back.some(e=>e.name==='fillRect')).toBe(false);
  expect(front.some(e=>e.name==='fillRect')).toBe(false);
  const backFirstGun=back.findIndex(e=>e.name==='createRadialGradient');
  const backFirstBody=back.findIndex(e=>e.name==='drawImage');
  const frontLastBody=front.map(e=>e.name).lastIndexOf('drawImage');
  const frontGun=front.findIndex(e=>e.name==='createRadialGradient');
  expect(backFirstGun).toBeGreaterThanOrEqual(0);
  expect(backFirstGun).toBeLessThan(backFirstBody);
  expect(frontGun).toBeGreaterThan(frontLastBody);
 });

 it('renders 3-hit slash pose without cartoon fillRect blades, dash afterimages, wide muzzle flare, and world slash',()=>{
  const dummyImage={} as HTMLImageElement;
  for(const combo of [1,2,3] as const){
   const {ctx,events}=recorder();
   const ok=drawOmegaSilverKineticActor(ctx,dummyImage,'SE',{
    facingX:1,facingY:1,moving:true,time:5,dashing:false,shooting:false,
    bladeAge:0.09,bladeCombo:combo,bladeFacingX:1,bladeFacingY:0.2,bladeHits:2,
   },120);
   expect(ok).toBe(true);
   expect(events.some(e=>e.name==='fillRect')).toBe(false);
   expect(events.some(e=>e.name==='createRadialGradient')).toBe(true);
  }
  const {ctx:dashCtx,events:dashEvents}=recorder();
  drawOmegaSilverKineticActor(dashCtx,dummyImage,'E',{
   facingX:1,facingY:0,moving:true,time:5,dashing:true,shooting:false,
  },120);
  expect(dashEvents.filter(e=>e.name==='drawImage')).toHaveLength(5);

  const {ctx:mCtx,events:mOps}=recorder();
  drawOmegaEnhancedWideMuzzle(mCtx,35,-70,128,0.02,1,0);
  expect(mOps.some(e=>e.name==='createRadialGradient')).toBe(true);

  const {ctx:sCtx,events:sOps}=recorder();
  drawOmegaBladeWorldSlash(sCtx,{
   time:10,combo:3,hits:2,totalDamage:45,x:400,y:450,facingX:1,facingY:0,
  },10.08);
  expect(sOps.some(e=>e.name==='createRadialGradient')).toBe(true);
  expect(sOps.some(e=>e.name==='ellipse')).toBe(true);

  const {ctx:expiredCtx,events:expiredOps}=recorder();
  drawOmegaBladeWorldSlash(expiredCtx,{
   time:10,combo:1,hits:0,totalDamage:15,x:400,y:450,facingX:1,facingY:0,
  },10.5);
  expect(expiredOps).toHaveLength(0);
 });

 it('maps all 8 muzzle barrel anchors into world coords and tracks barrel-to-chest tracer elevation',()=>{
  for(const heading of OMEGA_DIRECTIONS){
   const local=omegaSilverLocalMuzzle(heading,118);
   expect(Number.isFinite(local.x)).toBe(true);
   expect(Number.isFinite(local.y)).toBe(true);
   expect(local.rear).toBe(heading==='N');
  }
  const muzzleWorld=omegaWorldPointFromUprightOffset({x:500,y:400},34.8,-71.4,OMEGA_QUARTER_VIEW);
  expect(muzzleWorld.x).toBeCloseTo(500+34.8-(-0.22/0.78)*(-71.4),4);
  expect(muzzleWorld.y).toBeCloseTo(400-71.4/0.78,4);

  const tracker=new OmegaBallisticTracerTracker();
  tracker.sync([{id:'p1',x:500,y:400}],muzzleWorld,1.0);
  const atSpawn=tracker.resolveVisual({id:'p1',x:500,y:400},OMEGA_QUARTER_VIEW,1.0);
  expect(atSpawn.visualX).toBeCloseTo(muzzleWorld.x,3);
  expect(atSpawn.visualY).toBeCloseTo(muzzleWorld.y,3);

  const cruising=tracker.resolveVisual({id:'p1',x:620,y:400},OMEGA_QUARTER_VIEW,1.15);
  expect(cruising.groundX).toBe(620);
  expect(cruising.groundY).toBe(400);
  expect(cruising.visualY).toBeCloseTo(400-48/OMEGA_QUARTER_VIEW.groundYScale,2);

  const {ctx:bCtx,events:bEvents}=recorder();
  drawOmegaBallisticProjectile(bCtx,atSpawn,6,600,0,false);
  expect(bEvents.some(e=>e.name==='ellipse')).toBe(true);
  expect(bEvents.some(e=>e.name==='createLinearGradient')).toBe(true);

  tracker.sync([],muzzleWorld,1.2);
  const pruned=tracker.resolveVisual({id:'p1',x:620,y:400},OMEGA_QUARTER_VIEW,1.2);
  expect(pruned.age).toBe(1);
 });
});
