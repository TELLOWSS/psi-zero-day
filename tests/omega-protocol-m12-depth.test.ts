import {describe,it,expect} from 'vitest';
import {omegaFieldPlan} from '../src/domain/omega-protocol-field';
import {
 omegaM12Budget,omegaM12Occluders,drawOmegaM12TerrainShadows,
 drawOmegaM12ActorFootShadow,drawOmegaM12StructureFacets,
 drawOmegaM12DistanceHaze,drawOmegaM12OcclusionBeacon,
} from '../src/ui/omega-protocol-m12-depth';

function fakeCanvas(){
 const calls:string[]=[];
 const hit=(v:string)=>(()=>{calls.push(v);});
 const ctx={
  save:hit('save'),restore:hit('restore'),beginPath:hit('beginPath'),
  closePath:hit('closePath'),ellipse:hit('ellipse'),arc:hit('arc'),
  fill:hit('fill'),stroke:hit('stroke'),fillRect:hit('fillRect'),
  moveTo:hit('moveTo'),lineTo:hit('lineTo'),translate:hit('translate'),
  setLineDash:hit('dash'),
 } as unknown as CanvasRenderingContext2D;
 return {ctx,calls};
}
describe('M12-G1 live native-anchored industrial depth vertical slice',()=>{
 it('uses bounded non-paid PC/tablet/mobile draw budgets',()=>{
  expect(omegaM12Budget(390,844)).toEqual({shadowBlur:false,structuralGlints:false,hazeBands:1});
  expect(omegaM12Budget(844,390)).toEqual(omegaM12Budget(390,844));
  expect(omegaM12Budget(1024,768)).toEqual({shadowBlur:true,structuralGlints:false,hazeBands:2});
  expect(omegaM12Budget(1440,900)).toEqual({shadowBlur:true,structuralGlints:true,hazeBands:3});
  expect(()=>omegaM12Budget(0,900)).toThrow(RangeError);
  expect(()=>omegaM12Budget(Infinity,390)).toThrow(RangeError);
 });
 it('uses the actual native obstacle footprint for dynamic foreground occlusion',()=>{
  const plan=omegaFieldPlan(20261108,1);
  const cargo=plan.obstacles.find(o=>o.id==='cargo')!;
  const behind={x:cargo.x+cargo.width/2,y:cargo.y-30};
  expect(omegaM12Occluders(plan,behind).map(o=>o.id)).toContain('cargo');
  expect(omegaM12Occluders(plan,{x:behind.x,y:cargo.y+cargo.height+30})).toHaveLength(0);
  expect(omegaM12Occluders(plan,{x:100,y:400})).toHaveLength(0);
  expect(omegaM12Occluders(omegaFieldPlan(20261108,4),behind)).toHaveLength(0);
  expect(()=>omegaM12Occluders(plan,{x:NaN,y:1})).toThrow(RangeError);
 });
 it('paints world-space props, long shadows, contact shadows and depth cue without editing physics',()=>{
  const plan=omegaFieldPlan(20261108,1),before=JSON.stringify(plan);
  const {ctx,calls}=fakeCanvas(),budget=omegaM12Budget(1440,900);
  drawOmegaM12TerrainShadows(ctx,plan,budget);
  expect(calls.filter(n=>n==='ellipse')).toHaveLength(4);
  for(const o of plan.obstacles)drawOmegaM12StructureFacets(ctx,plan,o,5,budget);
  expect(calls.filter(n=>n==='stroke').length).toBeGreaterThan(6);
  drawOmegaM12ActorFootShadow(ctx,{x:330,y:155});
  const obscured=drawOmegaM12OcclusionBeacon(ctx,plan,{x:330,y:155},5);
  expect(obscured).toBe(true);
  expect(calls.filter(n=>n==='ellipse')).toHaveLength(6);
  drawOmegaM12DistanceHaze(ctx,plan,5,budget);
  expect(calls.filter(n=>n==='fillRect').length).toBeGreaterThan(3);
  expect(JSON.stringify(plan)).toBe(before);
 });
 it('renders no fake barriers / occlusion outside the designated sector',()=>{
  const plan=omegaFieldPlan(20261108,12),{ctx,calls}=fakeCanvas();
  drawOmegaM12TerrainShadows(ctx,plan,omegaM12Budget(390,844));
  drawOmegaM12DistanceHaze(ctx,plan,4,omegaM12Budget(390,844));
  for(const o of plan.obstacles)drawOmegaM12StructureFacets(ctx,plan,o,4,omegaM12Budget(390,844));
  expect(drawOmegaM12OcclusionBeacon(ctx,plan,{x:300,y:200},4)).toBe(false);
  drawOmegaM12ActorFootShadow(ctx,{x:NaN,y:200});
  expect(calls).toEqual([]);
 });
});
