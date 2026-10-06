import {describe,expect,it} from 'vitest';
import type {Projectile} from '../src/domain/patrol-survivors';
import type {ProjectileFeedback} from '../src/domain/survivors-projectile-feedback';
import {balancedFeedbackPool,feedbackCoreOwners,cinematicFlightSelection} from '../src/ui/survivors-vfx-composition';
import {weaponContactEnvelope} from '../src/ui/survivors-vfx-timing';

const contact=(kind:ProjectileFeedback['kind']='radio',x=0,extra:Partial<ProjectileFeedback>={})=>({event:{projectileId:String(x),kind,phase:'impact',x,y:0,angle:0,radius:10,...extra} as ProjectileFeedback,age:0});
const flight=(kind:Projectile['kind'],x:number):Projectile=>({id:String(x),kind,x,y:0,vx:0,vy:0,radius:4,damage:1,duration:1,pierce:1});
describe('presentation composition contract',()=>{
 it('reserves competing weapon and worker receipts without mutating the input',()=>{
  const spam=Array.from({length:100},(_,i)=>contact('radio',i));
  const hunter=contact('hunter_beam',200),worker=contact('radio',201,{worker:true});
  const all=[...spam,hunter,worker],result=balancedFeedbackPool(all,8);
  expect(result).toHaveLength(8);expect(result).toContain(hunter);expect(result).toContain(worker);
  expect(all).toHaveLength(102);expect(result).toEqual(all.filter(e=>result.includes(e)));
 });
 it('protects held cut-ins and bounds even a saturated pool',()=>{
  const held=contact('shout_shockwave',0,{phase:'launch'});
  const result=balancedFeedbackPool([held,...Array.from({length:100},(_,i)=>contact('radio',i))],4,[],e=>e===held);
  expect(result).toHaveLength(4);expect(result).toContain(held);
 });
 it('keeps one nearby hot core, with critical priority and separate safety receipts',()=>{
  const normal=contact('radio',0),critical=contact('hunter_beam',12,{critical:true}),far=contact('radio',100),worker=contact('radio',5,{worker:true});
  expect([...feedbackCoreOwners([normal,critical,far,worker])]).toEqual([critical,far]);
 });
 it('does not let the first weapon monopolize flight details',()=>{
  const radios=Array.from({length:80},(_,i)=>flight('radio',i+10)),hunter=flight('hunter_beam',5);
  const result=cinematicFlightSelection([...radios,hunter],[],4,{x:0,y:0});
  expect(result.size).toBe(4);expect(result.has(hunter)).toBe(true);expect(result.has(radios[0]!)).toBe(true);
  expect(radios[0]!.x).toBe(10);
 });
 it('gives a fast impact exposure and a longer material tail',()=>{
  const early=weaponContactEnvelope('impact',.01,.24),late=weaponContactEnvelope('impact',.16,.24);
  expect(early.exposure).toBeGreaterThan(late.exposure);expect(late.material).toBeGreaterThan(late.exposure);
  expect(late.travel).toBeGreaterThan(early.travel);
  expect(weaponContactEnvelope('launch',0,.14).exposure).toBe(0);
  expect(weaponContactEnvelope('impact',1,0).material).toBe(0);
 });
});
