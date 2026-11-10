import {describe,it,expect} from 'vitest';
import {omegaFieldNativeTerrain,omegaFieldPlan} from '../src/domain/omega-protocol-field';
import {
 omegaG2Quality,omegaG2SceneManifest,drawOmegaG2EntrySurface,drawOmegaG2RearEnvironment,
 drawOmegaG2NativeFacade,drawOmegaG2BoundaryRail,
} from '../src/ui/omega-protocol-m12-authored-industrial';

function ctxProbe(){
 const ops:string[]=[];
 const hit=(name:string)=>()=>{ops.push(name);};
 const gradient={addColorStop:(_at:number,_color:string)=>{ops.push('stop');}};
 const ctx={
  save:hit('save'),restore:hit('restore'),beginPath:hit('begin'),
  closePath:hit('close'),moveTo:hit('move'),lineTo:hit('line'),
  fill:hit('fill'),stroke:hit('stroke'),fillRect:hit('rect'),
  strokeRect:hit('strokeRect'),arc:hit('arc'),ellipse:hit('ellipse'),
  createLinearGradient:()=>{ops.push('gradient');return gradient;},
  createRadialGradient:()=>{ops.push('radial');return gradient;},
 } as unknown as CanvasRenderingContext2D;
 return {ctx,ops};
}
describe('M12-G2 original industrial authored runtime setpieces',()=>{
 it('uses deterministic responsive detail budgets without paid APIs or assets',()=>{
  expect(omegaG2Quality(390,844)).toEqual({tier:'low',facadeWindows:5,trussBraces:3,glow:false});
  expect(omegaG2Quality(844,390).tier).toBe('low');
  expect(omegaG2Quality(1024,768).tier).toBe('balanced');
  expect(omegaG2Quality(1440,900).tier).toBe('detail');
  expect(()=>omegaG2Quality(0,390)).toThrow(RangeError);
  expect(()=>omegaG2Quality(NaN,900)).toThrow(RangeError);
 });
 it('routes only real scene-1 scaffold/machine/cargo solids to tall foreground structures',()=>{
  const plan=omegaFieldPlan(20261108,1);
  const manifest=omegaG2SceneManifest(plan);
  expect(manifest.map(p=>p.layer)).toEqual([
   'rear-skyline','rear-crane','native-gangform','native-hoist',
   'native-cargo','boundary-rail',
  ]);
  for(const p of manifest){
   expect(p.decorative).toBe(true);
   if(p.sourceId)expect(plan.obstacles.some(o=>o.id===p.sourceId)).toBe(true);
  }
  expect(omegaG2SceneManifest(omegaFieldPlan(20261108,4))).toEqual([]);
 });
 it('renders three native facade identities and distant depth with unmodified geometry and HP domain',()=>{
  const plan=omegaFieldPlan(20261108,1),before=JSON.stringify(plan);
  const terrain=JSON.stringify(omegaFieldNativeTerrain(plan));
  const quality=omegaG2Quality(1440,900);
  const {ctx,ops}=ctxProbe();
  drawOmegaG2EntrySurface(ctx,plan,12.2,quality);
  drawOmegaG2RearEnvironment(ctx,plan,12.2,quality);
  const beforeFacades=ops.length;
  expect(beforeFacades).toBeGreaterThan(20);
  expect(ops).toContain('radial');
  for(const o of plan.obstacles)drawOmegaG2NativeFacade(ctx,plan,o,12.2,quality);
  expect(ops.length).toBeGreaterThan(beforeFacades+60);
  drawOmegaG2BoundaryRail(ctx,plan,quality);
  expect(JSON.stringify(plan)).toBe(before);
  expect(JSON.stringify(omegaFieldNativeTerrain(plan))).toBe(terrain);
 });
 it('ignores other sectors and fabricated pseudo-obstacles instead of adding fake cover',()=>{
  const plan=omegaFieldPlan(20261108,7),quality=omegaG2Quality(390,844);
  const {ctx,ops}=ctxProbe();
  drawOmegaG2EntrySurface(ctx,plan,2,quality);
  drawOmegaG2RearEnvironment(ctx,plan,2,quality);
  drawOmegaG2BoundaryRail(ctx,plan,quality);
  for(const o of plan.obstacles)drawOmegaG2NativeFacade(ctx,plan,o,2,quality);
  expect(ops).toEqual([]);
  const first=omegaFieldPlan(20261108,1);
  const {ctx:foreign,ops:foreignOps}=ctxProbe();
  drawOmegaG2NativeFacade(foreign,first,{...first.obstacles[0]!},1,quality);
  expect(foreignOps).toEqual([]);
 });
 it('fails closed on bad scene time without Canvas side effects',()=>{
  const plan=omegaFieldPlan(20261108,1),quality=omegaG2Quality(390,844);
  const {ctx,ops}=ctxProbe();
  drawOmegaG2EntrySurface(ctx,plan,NaN,quality);
  drawOmegaG2RearEnvironment(ctx,plan,Infinity,quality);
  drawOmegaG2NativeFacade(ctx,plan,plan.obstacles[0]!,NaN,quality);
  expect(ops).toEqual([]);
 });
});
