import {describe,it,expect} from 'vitest';
import {omegaFieldPlan} from '../src/domain/omega-protocol-field';
import {
 omegaSceneBudget,omegaSectorOneDust,
 drawOmegaSectorOneGround,drawOmegaSectorOneActorLight,
 drawOmegaSectorOneAir,drawOmegaSectorOneGrade,drawOmegaSectorOneObstacleDetail,
} from '../src/ui/omega-protocol-sector-one-scene';

function makeCanvas(w=844,h=390){
 const calls:string[]=[];
 const gradient={addColorStop:(_offset:number,_color:string)=>{calls.push('gradientStop');}};
 const mark=(name:string)=>(()=>{calls.push(name);});
 const ctx={
  canvas:{width:w,height:h},
  save:mark('save'),restore:mark('restore'),
  beginPath:mark('beginPath'),closePath:mark('closePath'),
  fill:mark('fill'),stroke:mark('stroke'),
  fillRect:mark('fillRect'),strokeRect:mark('strokeRect'),
  moveTo:mark('moveTo'),lineTo:mark('lineTo'),
  ellipse:mark('ellipse'),arc:mark('arc'),translate:mark('translate'),
  createRadialGradient:()=>{calls.push('radial');return gradient;},
  createLinearGradient:()=>{calls.push('linear');return gradient;},
 } as unknown as CanvasRenderingContext2D;
 return {ctx,calls};
}
describe('OMEGA original sector-one visual vertical slice',()=>{
 it('cuts gradient/particle budgets on portrait and landscape without an API',()=>{
  expect(omegaSceneBudget(844,390)).toEqual({dust:8,floodlights:2,puddles:3});
  expect(omegaSceneBudget(390,844)).toEqual(omegaSceneBudget(844,390));
  expect(omegaSceneBudget(1440,900)).toEqual({dust:20,floodlights:4,puddles:5});
  expect(()=>omegaSceneBudget(0,500)).toThrow(RangeError);
  expect(()=>omegaSceneBudget(NaN,100)).toThrow(RangeError);
 });
 it('keeps limited dust coordinates deterministic and in world space',()=>{
  for(let i=0;i<20;i++){
   const particle=omegaSectorOneDust(44.25,i);
   expect(particle).toEqual(omegaSectorOneDust(44.25,i));
   expect(particle.x).toBeGreaterThanOrEqual(0);
   expect(particle.x).toBeLessThan(1400);
   expect(particle.y).toBeGreaterThanOrEqual(0);
   expect(particle.y).toBeLessThan(900);
   expect(particle.opacity).toBeLessThan(.20);
  }
  expect(omegaSectorOneDust(45,3)).not.toEqual(omegaSectorOneDust(44.25,3));
  expect(()=>omegaSectorOneDust(Infinity,0)).toThrow(RangeError);
  expect(()=>omegaSectorOneDust(1,-1)).toThrow(RangeError);
 });
 it('renders only sector one; never draws extra invisible geometry in others',()=>{
  const later=omegaFieldPlan(20261108,12),{ctx,calls}=makeCanvas();
  drawOmegaSectorOneGround(ctx,later);
  drawOmegaSectorOneActorLight(ctx,later,{x:150,y:450},5);
  drawOmegaSectorOneAir(ctx,later,5,omegaSceneBudget(844,390));
  drawOmegaSectorOneGrade(ctx,later,844,390);
  expect(calls).toEqual([]);
 });
 it('draws floor plates, focus lights and air as visual-only non-colliding layers',()=>{
  const plan=omegaFieldPlan(20261108,1);
  const before=JSON.stringify(plan);
  const {ctx,calls}=makeCanvas();
  drawOmegaSectorOneGround(ctx,plan);
  const floorRadial=calls.filter(s=>s==='radial').length;
  expect(floorRadial).toBe(2); // budgeted mobile floodlights
  expect(calls.filter(s=>s==='ellipse')).toHaveLength(3); // puddles
  drawOmegaSectorOneActorLight(ctx,plan,{x:150,y:450},1.5);
  expect(calls.filter(s=>s==='radial')).toHaveLength(3);
  drawOmegaSectorOneAir(ctx,plan,1.5,omegaSceneBudget(844,390));
  drawOmegaSectorOneGrade(ctx,plan,844,390);
  expect(calls.filter(s=>s==='linear')).toHaveLength(1);
  expect(calls.filter(s=>s==='radial')).toHaveLength(4);
  expect(calls.filter(s=>s==='stroke').length).toBeGreaterThan(10);
  expect(JSON.stringify(plan)).toBe(before);
  // Existing solids and interaction geometry are the single source of truth.
  for(const obstacle of plan.obstacles)drawOmegaSectorOneObstacleDetail(ctx,obstacle);
  expect(calls.filter(s=>s==='linear').length).toBe(5); // screen tone + 4 real obstacles
  expect(plan.obstacles).toHaveLength(4);
  expect(plan.event.steps.length).toBeGreaterThanOrEqual(2);
 });
 it('fails closed on invalid player/time/screen inputs without corrupting Canvas',()=>{
  const plan=omegaFieldPlan(20261108,1),{ctx,calls}=makeCanvas();
  drawOmegaSectorOneActorLight(ctx,plan,{x:NaN,y:70},1);
  drawOmegaSectorOneAir(ctx,plan,Infinity,omegaSceneBudget(844,390));
  drawOmegaSectorOneGrade(ctx,plan,0,500);
  expect(calls).toEqual([]);
 });
});
