import {describe,it,expect} from 'vitest';
import {omegaFieldPlan} from '../src/domain/omega-protocol-field';
import {omegaFieldDepthOrder} from '../src/ui/omega-protocol-depth-scene';
describe('OMEGA 3/4 solid-actor painter order',()=>{
 it('puts genuine props behind or in front of AIRA by actual world foot Y',()=>{
  const plan=omegaFieldPlan(20261108,1);
  const near=omegaFieldDepthOrder(plan,[{y:150,hp:10},{y:760,hp:7},{y:400,hp:0}],450);
  expect(near.filter(x=>x.kind==='hero')).toHaveLength(1);
  expect(near.filter(x=>x.kind==='hazard')).toHaveLength(2);
  expect(near.filter(x=>x.kind==='prop')).toHaveLength(plan.obstacles.length);
  const heroIndex=near.findIndex(x=>x.kind==='hero');
  const nearMachine=plan.obstacles.findIndex(o=>o.id==='machine');
  const nearCargo=plan.obstacles.findIndex(o=>o.id==='cargo');
  expect(near.findIndex(x=>x.kind==='prop'&&x.index===nearCargo)).toBeLessThan(heroIndex);
  expect(near.findIndex(x=>x.kind==='prop'&&x.index===nearMachine)).toBeGreaterThan(heroIndex);
  expect(near.findIndex(x=>x.kind==='hazard'&&x.index===0)).toBeLessThan(heroIndex);
  expect(near.findIndex(x=>x.kind==='hazard'&&x.index===1)).toBeGreaterThan(heroIndex);
 });
 it('preserves native navigation plan, exact hazard positions, health and encounter count',()=>{
  const plan=omegaFieldPlan(20261108,1);
  const hazards=[{y:200,hp:20},{y:730,hp:15},{y:480,hp:0}] as const;
  const before=JSON.stringify({plan,hazards});
  const a=omegaFieldDepthOrder(plan,hazards,450);
  const b=omegaFieldDepthOrder(plan,hazards,450);
  expect(a).toEqual(b);
  expect(a.map(x=>x.depth)).toEqual([...a.map(x=>x.depth)].sort((x,y)=>x-y));
  expect(JSON.stringify({plan,hazards})).toBe(before);
  expect(()=>omegaFieldDepthOrder(plan,hazards,NaN)).toThrow(RangeError);
  expect(()=>omegaFieldDepthOrder(plan,[{y:Infinity,hp:2}],300)).toThrow(RangeError);
 });
});
