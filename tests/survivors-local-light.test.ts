import {expect,it} from 'vitest';
import {actorLocalLight} from '../src/ui/survivors-local-light';
import {stageActorLight} from '../src/ui/survivors-stage-light';
import {PATROL_STAGE_IDS,type StageHazardObject} from '../src/domain/patrol-survivors';
const lamp=(x:number,y=200,state='active')=>({id:String(x),type:'floodlight_tower',state,x,y,radius:180}) as StageHazardObject;
it('preserves all fifty ambient looks outside active fixtures without mutating input',()=>{
 for(const stage of PATROL_STAGE_IDS){
  const base=stageActorLight(stage)!,objects=[lamp(100,200,'destroyed'),lamp(300,200,'warning')],before=JSON.stringify(objects);
  expect(actorLocalLight(base,{x:200,y:200},objects)).toEqual({...base,localInfluence:0});
  expect(actorLocalLight(base,{x:1000,y:800},[lamp(100)])).toEqual({...base,localInfluence:0});
  expect(JSON.stringify(objects)).toBe(before);
 }
});
it('casts away from the real light and smoothly warms nearby actor alpha',()=>{
 const base=stageActorLight('stage_02')!,left=actorLocalLight(base,{x:100,y:200},[lamp(200)]),right=actorLocalLight(base,{x:300,y:200},[lamp(200)]);
 expect(left.shadowX).toBeLessThan(0);expect(right.shadowX).toBeGreaterThan(0);
 expect(left.fill).toBeGreaterThan(base.fill);expect(left.color).not.toBe(base.color);
 expect(actorLocalLight(base,{x:500,y:200},[lamp(200)]).localInfluence).toBeLessThan(right.localInfluence);
 const atSource=actorLocalLight(base,{x:200,y:200},[lamp(200)]);
 expect(Object.values(atSource).filter(v=>typeof v==='number').every(Number.isFinite)).toBe(true);
 expect(atSource.opacity).toBeLessThanOrEqual(.24);expect(atSource.fill).toBeLessThanOrEqual(.18);
});
it('blends opposing fixtures without an abrupt midpoint switch',()=>{
 const base=stageActorLight('stage_05')!,objects=[lamp(100),lamp(300)],before=JSON.stringify(objects);
 const a=actorLocalLight(base,{x:199.9,y:200},objects),b=actorLocalLight(base,{x:200.1,y:200},objects);
 expect(Math.abs(a.shadowX-b.shadowX)).toBeLessThan(.01);
 expect(actorLocalLight(base,{x:200,y:200},objects)).toEqual(actorLocalLight(base,{x:200,y:200},[...objects].reverse()));
 expect(JSON.stringify(objects)).toBe(before);
});
it('ignores non-lights and invalid fixture coordinates',()=>{
 const base=stageActorLight('stage_01')!;
 expect(actorLocalLight(base,{x:200,y:200},[lamp(NaN),{...lamp(200),type:'explosive_barrel'}])).toEqual({...base,localInfluence:0});
});
