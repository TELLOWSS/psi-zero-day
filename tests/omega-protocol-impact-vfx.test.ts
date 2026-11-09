import {describe,it,expect} from 'vitest';
import type {ProjectileFeedback} from '../src/domain/survivors-projectile-feedback';
import {
 OMEGA_MAX_IMPACT_FX,OMEGA_IMPACT_FX_DURATION,
 omegaAdvanceImpactFx,drawOmegaImpactFx,
} from '../src/ui/omega-protocol-impact-vfx';
const event=(phase:ProjectileFeedback['phase'],id='one',details:Partial<ProjectileFeedback>={}):ProjectileFeedback=>({
 projectileId:id,kind:'radio',phase,x:300,y:410,angle:0,radius:12,...details,
});
const mockCanvas=()=>{
 const calls:Array<{name:string;args:unknown[]}>= [];
 const ctx=new Proxy({},{
  get(_target,key){return (...args:unknown[])=>calls.push({name:String(key),args});},
  set(){return true},
 }) as unknown as CanvasRenderingContext2D;
 return {ctx,calls};
};
describe('OMEGA impact graphics are native-feedback-only and bounded',()=>{
 it('does not invent firing, damage, critical or explosions from lingering projectiles',()=>{
  const idle=omegaAdvanceImpactFx([],[event('launch'),event('release')],4);
  expect(idle).toHaveLength(0);
  const actual=omegaAdvanceImpactFx(idle,[
   event('impact','a',{appliedDamage:23.5,critical:true,targetRadius:32}),
   event('impact','b',{blocked:true,appliedDamage:0}),
  ],4);
  expect(actual).toHaveLength(2);
  expect(actual[0]).toMatchObject({damage:23.5,critical:true,blocked:false,x:300,y:410});
  expect(actual[1]).toMatchObject({damage:0,critical:false,blocked:true});
  expect(actual[0]!.until).toBeCloseTo(4+OMEGA_IMPACT_FX_DURATION);
  expect(omegaAdvanceImpactFx(actual,[],4+OMEGA_IMPACT_FX_DURATION)).toHaveLength(0);
  expect(()=>omegaAdvanceImpactFx([],[],NaN)).toThrow(RangeError);
 });
 it('ignores invalid impact coordinates and keeps the last 24, even in dense waves',()=>{
  const events=Array.from({length:100},(_,i)=>event('impact',String(i)));
  events.push(event('impact','bad-x',{x:NaN}));
  const active=omegaAdvanceImpactFx([],events,1);
  expect(active).toHaveLength(OMEGA_MAX_IMPACT_FX);
  expect(active.map(v=>v.seed).length).toBe(OMEGA_MAX_IMPACT_FX);
  expect(active.every(v=>Number.isFinite(v.radius))).toBe(true);
 });
 it('draws only actual active impact sparks, keeping honest damage numbers',()=>{
  const p=omegaAdvanceImpactFx([],[
   event('impact','real',{critical:true,appliedDamage:16.8}),
   event('impact','guard',{blocked:true,appliedDamage:0}),
  ],1);
  const canvas=mockCanvas();
  drawOmegaImpactFx(canvas.ctx,p,1.08);
  expect(canvas.calls.filter(v=>v.name==='fillText').map(v=>v.args[0])).toEqual(['17']);
  expect(canvas.calls.filter(v=>v.name==='lineTo').length).toBe(12);
  const ended=mockCanvas();
  drawOmegaImpactFx(ended.ctx,p,2);
  expect(ended.calls).toHaveLength(0);
 });
});
